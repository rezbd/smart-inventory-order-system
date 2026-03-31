import ActivityLog from '../models/ActivityLog.model.js';

/**
 * Fire-and-forget activity logger.
 * Failures are caught and logged to console — they NEVER bubble up
 * and crash the parent operation (e.g., order creation).
 *
 * @param {Object} params
 * @param {string} params.action       - Machine-readable event code (e.g., 'ORDER_CREATED')
 * @param {string} params.message      - Human-readable description
 * @param {string} params.entityType   - 'Order' | 'Product' | 'Category' | 'User' | 'System'
 * @param {ObjectId} [params.entityId] - The affected document's _id
 * @param {ObjectId} [params.performedBy] - The user who triggered the event
 * @param {Object}  [params.metadata]  - Any extra contextual data
 */
export const logActivity = async ({
  action,
  message,
  entityType,
  entityId = null,
  performedBy = null,
  metadata = {},
}) => {
  try {
    await ActivityLog.create({
      action,
      message,
      entityType,
      entityId,
      performedBy,
      metadata,
    });
  } catch (err) {
    // Non-blocking: log to console but never throw
    console.error(`[ActivityLog] Failed to write log — Action: ${action}`, err.message);
  }
};

/**
 * Fetch the latest N activity log entries for the dashboard.
 * @param {number} limit - Default 10
 */
export const getRecentActivity = async (limit = 10) => {
  return ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('performedBy', 'name email')
    .lean();
};