const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getAttendance, getTodayAttendance, applyLeave, approveLeave, getLeaves } = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/checkin', authenticate, checkIn);
router.post('/checkout', authenticate, checkOut);
router.get('/today', authenticate, authorize('Admin', 'Manager'), getTodayAttendance);
router.get('/', authenticate, getAttendance);
router.post('/leave', authenticate, applyLeave);
router.put('/leave/:id/approve', authenticate, authorize('Admin', 'Manager'), approveLeave);
router.get('/leaves', authenticate, getLeaves);

module.exports = router;
