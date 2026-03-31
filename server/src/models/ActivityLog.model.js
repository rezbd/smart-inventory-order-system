// server/src/models/ActivityLog.model.js
import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // e.g., 'ORDER_CREATED', 'STOCK_UPDATED', 'PRODUCT_RESTOCKED'
    },
    message: {
      type: String,
      required: true,
      // e.g., 'Order #ORD-00012 created for John Doe'
    },
    entityType: {
      type: String,
      enum: ['Order', 'Product', 'Category', 'User', 'System'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'entityType',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Flexible extra data
      default: {},
    },
  },
  {
    timestamps: true,
    // TTL index: auto-delete logs older than 90 days (optional, production concern)
    // expires: 60 * 60 * 24 * 90
  }
);

// Index for fast "latest 10" queries
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;