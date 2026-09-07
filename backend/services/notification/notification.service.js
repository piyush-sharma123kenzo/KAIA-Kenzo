/**
 * KAIA Technologies — Enterprise Notification Service
 * 
 * Provides centralized, fail-safe database notification dispatching:
 *  - Real-event customer alerts
 *  - Brand seller operational updates
 *  - Administrator platform broadcasts
 *  - Idempotent duplicate event suppression
 */

import Notification from '../../models/Notification.js';
import User from '../../models/User.js';

/**
 * Dispatch a real database notification to a specific user.
 * Wrapped in fail-safe try/catch so secondary notifications never abort primary operations.
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'General',
  referenceType = null,
  referenceId = null,
  link = null,
}) => {
  try {
    if (!userId || !title || !message) return null;

    // Idempotency: Prevent identical duplicate notifications for the same reference event
    if (referenceType && referenceId) {
      const existing = await Notification.findOne({
        user: userId,
        type,
        referenceType,
        referenceId: String(referenceId),
        title,
      });
      if (existing) return existing;
    }

    const notification = await Notification.create({
      user: userId,
      title: title.trim(),
      message: message.trim(),
      type,
      referenceType: referenceType ? String(referenceType) : null,
      referenceId: referenceId ? String(referenceId) : null,
      link: link || null,
      read: false,
    });

    return notification;
  } catch (err) {
    console.error('[NotificationService] Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Broadcast notification to all active platform administrators.
 */
export const notifyAdmins = async ({
  title,
  message,
  type = 'ADMIN',
  referenceType = null,
  referenceId = null,
  link = null,
}) => {
  try {
    const admins = await User.find({ role: 'ADMIN' }).select('_id');
    if (!admins || admins.length === 0) return [];

    const promises = admins.map((admin) =>
      createNotification({
        userId: admin._id,
        title,
        message,
        type,
        referenceType,
        referenceId,
        link,
      })
    );

    return await Promise.all(promises);
  } catch (err) {
    console.error('[NotificationService] Failed to notify admins:', err.message);
    return [];
  }
};

/**
 * Notify brand seller owner.
 */
export const notifyBrandOwner = async ({
  brandOwnerId,
  title,
  message,
  type = 'BRAND',
  referenceType = null,
  referenceId = null,
  link = null,
}) => {
  if (!brandOwnerId) return null;
  return await createNotification({
    userId: brandOwnerId,
    title,
    message,
    type,
    referenceType,
    referenceId,
    link,
  });
};

export default {
  createNotification,
  notifyAdmins,
  notifyBrandOwner,
};
