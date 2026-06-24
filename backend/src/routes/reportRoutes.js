const express = require('express');
const router = express.Router();
const { getDashboardStats, getAttendanceReport, getPayrollReport, getRevenueReport, getNotifications, markNotificationRead, markAllNotificationsRead, getAuditLogs } = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/attendance', authenticate, authorize('Admin', 'Manager'), getAttendanceReport);
router.get('/payroll', authenticate, authorize('Admin', 'Accountant'), getPayrollReport);
router.get('/revenue', authenticate, authorize('Admin', 'Accountant'), getRevenueReport);
router.get('/notifications', authenticate, getNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationRead);
router.put('/notifications/read-all', authenticate, markAllNotificationsRead);
router.get('/audit-logs', authenticate, authorize('Admin'), getAuditLogs);

module.exports = router;
