import Product from '../models/Product.model.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../services/activityLog.service.js';

/**
 * GET /api/v1/inventory/restock-queue
 * Returns all products where stock < minStockThreshold, sorted by
 * most critical (lowest stock ratio) first. This is a derived query —
 * no separate queue collection needed.
 */
export const getRestockQueue = async (req, res, next) => {
  try {
    // Use aggregation to compute urgency ratio and sort by it
    const queue = await Product.aggregate([
      {
        $match: {
          $expr: { $lt: ['$stock', '$minStockThreshold'] },
        },
      },
      {
        $addFields: {
          // urgencyRatio: 0 = empty, 1 = at threshold. Sort ascending (most urgent first)
          urgencyRatio: {
            $cond: {
              if: { $eq: ['$minStockThreshold', 0] },
              then: 0,
              else: { $divide: ['$stock', '$minStockThreshold'] },
            },
          },
          stockDeficit: { $subtract: ['$minStockThreshold', '$stock'] },
        },
      },
      { $sort: { urgencyRatio: 1, stock: 1 } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmpty: true } },
      {
        $project: {
          name: 1,
          sku: 1,
          stock: 1,
          minStockThreshold: 1,
          status: 1,
          price: 1,
          urgencyRatio: 1,
          stockDeficit: 1,
          'category.name': 1,
          'category._id': 1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      results: queue.length,
      data: { queue },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/inventory/restock/:productId
 * Manually restocks a product by adding a specified quantity.
 * Body: { quantity: Number }
 */
export const restockProduct = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const restockQty = Math.floor(Number(quantity));

    if (!restockQty || restockQty < 1) {
      return next(new AppError('Restock quantity must be a positive integer.', 400));
    }

    const product = await Product.findById(req.params.productId);
    if (!product) return next(new AppError('Product not found.', 404));

    const previousStock = product.stock;
    product.stock += restockQty;
    // The pre-save hook on the Product model will auto-update status
    await product.save();

    await logActivity({
      action: 'PRODUCT_RESTOCKED',
      message: `"${product.name}" restocked by ${restockQty} units (${previousStock} → ${product.stock}).${product.status === 'Active' && previousStock === 0 ? ' Status restored to Active.' : ''}`,
      entityType: 'Product',
      entityId: product._id,
      performedBy: req.user._id,
      metadata: {
        previousStock,
        added: restockQty,
        newStock: product.stock,
        statusRestored: previousStock === 0 && product.status === 'Active',
      },
    });

    res.status(200).json({
      status: 'success',
      message: `${product.name} restocked successfully. New stock: ${product.stock}.`,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};