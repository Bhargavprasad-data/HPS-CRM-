const { query } = require('../config/db');

/**
 * Creates a notification for a specific user.
 * @param {string} userId - UUID of the user.
 * @param {string} title - Title of the notification.
 * @param {string} message - Body message.
 * @param {string} type - 'info', 'success', 'warning', 'error'
 * @param {string} link - Optional link URL for redirecting.
 */
const createNotification = async (userId, title, message, type = 'info', link = null) => {
  try {
    if (!userId) return null;
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, title, message, type, link]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

/**
 * Creates notifications for all users with a specific role.
 * @param {string} roleName - Name of the role (e.g. 'Admin', 'Manager', 'Accountant').
 * @param {string} title - Title of the notification.
 * @param {string} message - Body message.
 * @param {string} type - Notification type.
 * @param {string} link - Optional link.
 */
const notifyRole = async (roleName, title, message, type = 'info', link = null) => {
  try {
    const users = await query(
      `SELECT u.id FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE r.name = $1 AND u.is_active = true`,
      [roleName]
    );
    
    const notifications = [];
    for (const user of users.rows) {
      const notif = await createNotification(user.id, title, message, type, link);
      if (notif) notifications.push(notif);
    }
    return notifications;
  } catch (error) {
    console.error(`Failed to notify role ${roleName}:`, error);
    return [];
  }
};

module.exports = { createNotification, notifyRole };
