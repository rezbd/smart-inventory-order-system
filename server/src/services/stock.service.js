import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import AppError from '../utils/AppError.js';
import { logActivity } from './activityLog.service.js';

/**
 * Validates an array of order items BEFORE any stock is touched.
 * Performs all conflict checks in a single pass:
 *   1. Duplicate product IDs in the same order
 *   2. Product existence
 *   3. Product is Active (not Out of Stock / inactive)
 *   4. Requested quantity does not exceed available stock
 *
 * @param {Array} items - [{ product: ObjectId, quantity: Number }]
 * @returns {Array} enrichedItems - items with full product docs attached
 * @throws {AppError} - descriptive error on any conflict
 */
export const validateAndEnrichOrderItems = async (items) => {
  // ── 1. Duplicate check (client-side conflict detection) ──────────
  const productIds = items.map((item) => item.product.toString());
  const uniqueIds = new Set(productIds);

  if (uniqueIds.size !== productIds.length) {
    // Find the specific duplicate(s) for a clear error message
    const seen = new Set();
    const duplicates = [];
    for (const id of productIds) {
      if (seen.has(id)) duplicates.push(id);
      else seen.add(id);
    }
    throw new AppError(
      `Duplicate products detected in order. Each product can only appear once per order. Duplicate IDs: ${duplicates.join(', ')}`,
      400
    );
  }

  // ── 2. Fetch all products in a single DB query ───────────────────
  const productDocs = await Product.find({ _id: { $in: [...uniqueIds] } });

  // Build a Map for O(1) lookup
  const productMap = new Map(
    productDocs.map((p) => [p._id.toString(), p])
  );

  // ── 3. Validate each item ────────────────────────────────────────
  const enrichedItems = [];
  const errors = [];

  for (const item of items) {
    const product = productMap.get(item.product.toString());

    // 3a. Product must exist
    if (!product) {
      errors.push(`Product with ID "${item.product}" does not exist.`);
      continue;
    }

    // 3b. Product must be Active
    if (product.status !== 'Active') {
      errors.push(
        `"${product.name}" is currently "${product.status}" and cannot be ordered.`
      );
      continue;
    }

    // 3c. Requested qty must not exceed stock
    if (item.quantity > product.stock) {
      errors.push(
        `Insufficient stock for "${product.name}". ` +
          `Requested: ${item.quantity}, Available: ${product.stock}.`
      );
      continue;
    }

    // 3d. Quantity must be positive
    if (item.quantity < 1) {
      errors.push(`Quantity for "${product.name}" must be at least 1.`);
      continue;
    }

    enrichedItems.push({ item, product });
  }

  // If any item failed validation, throw ALL errors at once (better UX)
  if (errors.length > 0) {
    throw new AppError(errors.join(' | '), 400);
  }

  return enrichedItems;
};

/**
 * Atomically deducts stock for all items in an order.
 * Uses a Mongoose session so if ANY deduction fails, ALL are rolled back.
 *
 * @param {Array}  enrichedItems - Output from validateAndEnrichOrderItems
 * @param {Object} session       - Active Mongoose ClientSession
 * @param {ObjectId} performedBy - User ID for activity log
 * @returns {Array} orderItems   - Formatted items ready to embed in Order doc
 */
export const deductStockWithSession = async (
  enrichedItems,
  session,
  performedBy
) => {
  const orderItems = [];

  for (const { item, product } of enrichedItems) {
    const newStock = product.stock - item.quantity;

    // findOneAndUpdate is atomic at the document level
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: product._id,
        stock: { $gte: item.quantity }, // Re-validate stock inside the transaction
      },
      {
        $inc: { stock: -item.quantity },
        // Auto-set status if stock hits 0
        ...(newStock === 0 && { status: 'Out of Stock' }),
      },
      { new: true, session }
    );

    // If null, stock changed between validation and deduction (race condition)
    if (!updatedProduct) {
      throw new AppError(
        `Stock conflict on "${product.name}". ` +
          `The available stock changed while processing your order. Please retry.`,
        409
      );
    }

    // Log each stock deduction event
    await logActivity({
      action: 'STOCK_DEDUCTED',
      message: `Stock for "${product.name}" reduced by ${item.quantity} (${product.stock} → ${updatedProduct.stock})${updatedProduct.stock === 0 ? '. Status set to Out of Stock.' : '.'}`,
      entityType: 'Product',
      entityId: product._id,
      performedBy,
      metadata: {
        previousStock: product.stock,
        deducted: item.quantity,
        newStock: updatedProduct.stock,
        statusChanged: updatedProduct.stock === 0,
      },
    });

    // Build the order line item (price snapshot)
    orderItems.push({
      product: product._id,
      productName: product.name,       // Snapshot
      quantity: item.quantity,
      priceAtOrder: product.price,     // Snapshot
      subtotal: product.price * item.quantity,
    });
  }

  return orderItems;
};

/**
 * Restores stock when an order is cancelled.
 * Also re-activates "Out of Stock" products that now have stock again.
 *
 * @param {Array}    orderItems   - The embedded items from the cancelled Order
 * @param {Object}   session      - Active Mongoose ClientSession
 * @param {ObjectId} performedBy  - User ID for activity log
 */
export const restoreStockWithSession = async (
  orderItems,
  session,
  performedBy
) => {
  for (const item of orderItems) {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.product },
      [
        // Aggregation pipeline update: restore stock and conditionally fix status
        {
          $set: {
            stock: { $add: ['$stock', item.quantity] },
            status: {
              $cond: {
                // If it was Out of Stock and now has stock, reactivate it
                if: { $eq: ['$status', 'Out of Stock'] },
                then: 'Active',
                else: '$status',
              },
            },
          },
        },
      ],
      { new: true, session }
    );

    if (updatedProduct) {
      await logActivity({
        action: 'STOCK_RESTORED',
        message: `Stock for "${updatedProduct.name}" restored by ${item.quantity} due to order cancellation. New stock: ${updatedProduct.stock}.`,
        entityType: 'Product',
        entityId: item.product,
        performedBy,
        metadata: {
          restored: item.quantity,
          newStock: updatedProduct.stock,
          reactivated: updatedProduct.status === 'Active',
        },
      });
    }
  }
};