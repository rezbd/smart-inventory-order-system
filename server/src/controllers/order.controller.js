import mongoose from 'mongoose';
import Order from '../models/Order.model.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../services/activityLog.service.js';
import {
  validateAndEnrichOrderItems,
  deductStockWithSession,
  restoreStockWithSession,
} from '../services/stock.service.js';

// ─── Status transition rules ─────────────────────────────────────────
// Defines the only LEGAL status transitions.
// E.g., a Delivered order cannot be moved to Pending.
const ALLOWED_TRANSITIONS = {
  Pending:   ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped:   ['Delivered'],
  Delivered: [],   // Terminal state
  Cancelled: [],   // Terminal state
};

// ─── GET /api/v1/orders ──────────────────────────────────────────────
export const getOrders = async (req, res, next) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name email')
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      results: orders.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/v1/orders/:id ──────────────────────────────────────────
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('items.product', 'name sku status stock');

    if (!order) {
      return next(new AppError(`No order found with ID: ${req.params.id}`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/orders ─────────────────────────────────────────────
/**
 * Creates a new order with full transactional safety:
 *
 * FLOW:
 *   1. Input validation (items array, customer name)
 *   2. Conflict detection via stock.service:
 *      - Duplicate product IDs in one order
 *      - Inactive / Out-of-Stock products
 *      - Requested qty > available stock
 *   3. Open Mongoose transaction
 *   4. Atomic stock deduction (race condition safe)
 *   5. Create Order document
 *   6. Commit transaction
 *   7. Log activity
 *
 * On ANY error inside the transaction → rollback → re-throw
 */
export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { customerName, customerEmail, items, notes } = req.body;

    // ── 1. Basic input validation ────────────────────────────────
    if (!customerName || !customerName.trim()) {
      return next(new AppError('Customer name is required.', 400));
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Order must contain at least one item.', 400));
    }

    // Validate that each item has required shape
    for (const item of items) {
      if (!item.product) {
        return next(new AppError('Each order item must have a "product" field.', 400));
      }
      if (!item.quantity || isNaN(item.quantity) || Number(item.quantity) < 1) {
        return next(
          new AppError('Each order item must have a "quantity" of at least 1.', 400)
        );
      }
      // Coerce quantity to integer (prevent fractional orders)
      item.quantity = Math.floor(Number(item.quantity));
    }

    // ── 2. Pre-transaction conflict detection ────────────────────
    // This runs OUTSIDE the transaction intentionally — it's a read-only
    // validation pass. The transaction then re-validates atomically.
    const enrichedItems = await validateAndEnrichOrderItems(items);

    // ── 3. Open transaction ──────────────────────────────────────
    session.startTransaction();

    // ── 4. Atomic stock deduction ────────────────────────────────
    const orderItems = await deductStockWithSession(
      enrichedItems,
      session,
      req.user._id
    );

    // ── 5. Calculate total ───────────────────────────────────────
    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // ── 6. Create the Order document ─────────────────────────────
    // Note: session is passed so the create is part of the transaction
    const [order] = await Order.create(
      [
        {
          customerName: customerName.trim(),
          customerEmail: customerEmail?.trim(),
          items: orderItems,
          totalAmount,
          notes: notes?.trim(),
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    // ── 7. Commit ────────────────────────────────────────────────
    await session.commitTransaction();

    // ── 8. Log activity (after commit — fire and forget) ─────────
    await logActivity({
      action: 'ORDER_CREATED',
      message: `Order ${order.orderNumber} created for "${customerName.trim()}" — ${orderItems.length} item(s), total $${totalAmount.toFixed(2)}.`,
      entityType: 'Order',
      entityId: order._id,
      performedBy: req.user._id,
      metadata: {
        orderNumber: order.orderNumber,
        itemCount: orderItems.length,
        totalAmount,
        customerName: customerName.trim(),
      },
    });

    // ── 9. Populate and return ───────────────────────────────────
    const populatedOrder = await Order.findById(order._id)
      .populate('createdBy', 'name email')
      .populate('items.product', 'name sku status stock');

    res.status(201).json({
      status: 'success',
      message: `Order ${order.orderNumber} created successfully.`,
      data: { order: populatedOrder },
    });
  } catch (error) {
    // Rollback all stock deductions if anything went wrong
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    session.endSession();
  }
};

// ─── PATCH /api/v1/orders/:id/status ────────────────────────────────
/**
 * Updates the status of an order, enforcing legal transition rules.
 * Delegates to cancelOrder for Cancelled transitions (stock restore).
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;

    if (!newStatus) {
      return next(new AppError('New status is required.', 400));
    }

    // Delegate cancellations to the dedicated handler
    if (newStatus === 'Cancelled') {
      return cancelOrder(req, res, next);
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new AppError(`No order found with ID: ${req.params.id}`, 404));
    }

    // ── Enforce transition rules ─────────────────────────────────
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      return next(
        new AppError(
          `Cannot transition order from "${order.status}" to "${newStatus}". ` +
            `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}.`,
          400
        )
      );
    }

    const previousStatus = order.status;
    order.status = newStatus;
    await order.save();

    await logActivity({
      action: 'ORDER_STATUS_UPDATED',
      message: `Order ${order.orderNumber} status changed from "${previousStatus}" to "${newStatus}".`,
      entityType: 'Order',
      entityId: order._id,
      performedBy: req.user._id,
      metadata: { previousStatus, newStatus, orderNumber: order.orderNumber },
    });

    res.status(200).json({
      status: 'success',
      message: `Order ${order.orderNumber} updated to "${newStatus}".`,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/v1/orders/:id/cancel ────────────────────────────────
/**
 * Cancels an order and atomically restores all deducted stock.
 *
 * FLOW:
 *   1. Validate order exists and is cancellable
 *   2. Open transaction
 *   3. Restore stock for each line item
 *   4. Set order status to Cancelled
 *   5. Commit
 *   6. Log activity
 */
export const cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new AppError(`No order found with ID: ${req.params.id}`, 404));
    }

    // ── Check if cancellation is allowed ─────────────────────────
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes('Cancelled')) {
      return next(
        new AppError(
          `Order "${order.orderNumber}" cannot be cancelled. ` +
            `Current status is "${order.status}" which is a terminal state.`,
          400
        )
      );
    }

    // ── Open transaction ─────────────────────────────────────────
    session.startTransaction();

    // ── Restore stock for every line item ────────────────────────
    await restoreStockWithSession(order.items, session, req.user._id);

    // ── Update order status ──────────────────────────────────────
    order.status = 'Cancelled';
    await order.save({ session });

    // ── Commit ───────────────────────────────────────────────────
    await session.commitTransaction();

    // ── Log activity ─────────────────────────────────────────────
    await logActivity({
      action: 'ORDER_CANCELLED',
      message: `Order ${order.orderNumber} was cancelled by "${req.user.name}". Stock restored for ${order.items.length} item(s).`,
      entityType: 'Order',
      entityId: order._id,
      performedBy: req.user._id,
      metadata: {
        orderNumber: order.orderNumber,
        itemsRestored: order.items.length,
        totalAmount: order.totalAmount,
      },
    });

    res.status(200).json({
      status: 'success',
      message: `Order ${order.orderNumber} has been cancelled and stock has been restored.`,
      data: { order },
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    session.endSession();
  }
};