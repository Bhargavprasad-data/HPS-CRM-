const { query } = require('../config/db');

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [req.user.userId]
    );
    
    const unreadCountResult = await query(
      `SELECT COUNT(*) FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [req.user.userId]
    );

    res.json({
      success: true,
      data: result.rows,
      unreadCount: parseInt(unreadCountResult.rows[0].count || 0)
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [req.params.id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    
    res.json({ success: true, message: 'Notification marked as read.', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1`,
      [req.user.userId]
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications
const clearAll = async (req, res, next) => {
  try {
    await query(
      `DELETE FROM notifications 
       WHERE user_id = $1`,
      [req.user.userId]
    );
    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markRead, markAllRead, clearAll };

