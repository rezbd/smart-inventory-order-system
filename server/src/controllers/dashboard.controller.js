import mongoose from 'mongoose';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import { getRecentActivity } from '../services/activityLog.service.js';

/**
 * GET /api/v1/dashboard/metrics
 * Returns all dashboard data in a single optimized query round-trip
 * using Promise.all for parallel execution.
 */
export const getDashboardMetrics = async (req, res, next) => {
  try {
    // Define "today" as midnight → now in UTC
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      revenueToday,
      pendingOrders,
      completedOrders,
      lowStockCount,
      outOfStockCount,
      totalProducts,
      recentActivity,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      // Total orders created today
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),

      // Revenue from Delivered orders today
      Order.aggregate([
        {
          $match: {
            status: 'Delivered',
            createdAt: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Pending orders count
      Order.countDocuments({ status: 'Pending' }),

      // Completed (Delivered) orders count
      Order.countDocuments({ status: 'Delivered' }),

      // Low stock: stock > 0 but below threshold
      Product.countDocuments({
        $expr: {
          $and: [
            { $gt: ['$stock', 0] },
            { $lt: ['$stock', '$minStockThreshold'] },
          ],
        },
      }),

      // Out of stock products
      Product.countDocuments({ status: 'Out of Stock' }),

      // Total products
      Product.countDocuments(),

      // Latest 10 activity logs
      getRecentActivity(10),

      // Top 5 products by stock (for product summary widget)
      Product.find()
        .populate('category', 'name')
        .sort({ stock: -1 })
        .limit(5)
        .select('name sku stock minStockThreshold status price category')
        .lean(),

      // Latest 5 orders for dashboard order feed
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber customerName totalAmount status createdAt')
        .lean(),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          ordersToday,
          revenueToday: revenueToday[0]?.total ?? 0,
          pendingOrders,
          completedOrders,
          lowStockCount,
          outOfStockCount,
          totalProducts,
        },
        recentActivity,
        topProducts,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};