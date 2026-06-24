const express = require('express');
const router = express.Router();
const { getNotifications, markRead, markAllRead, clearAll } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, getNotifications);
router.put('/read-all', authenticate, markAllRead);
router.put('/:id/read', authenticate, markRead);
router.delete('/', authenticate, clearAll);

module.exports = router;

