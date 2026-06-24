const express = require('express');
const router = express.Router();
const { processPayroll, getPayrolls, generateSalarySlip, sendSalarySlip, markAsPaid, updatePayroll, deletePayroll } = require('../controllers/payrollController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', authenticate, authorize('Admin', 'Accountant', 'Staff'), getPayrolls);
router.post('/process', authenticate, authorize('Admin', 'Accountant'), processPayroll);
router.post('/:id/generate-slip', authenticate, authorize('Admin', 'Accountant', 'Staff'), generateSalarySlip);
router.post('/:id/send-slip', authenticate, authorize('Admin', 'Accountant'), sendSalarySlip);
router.put('/:id/mark-paid', authenticate, authorize('Admin', 'Accountant'), markAsPaid);
router.put('/:id', authenticate, authorize('Admin', 'Accountant'), updatePayroll);
router.delete('/:id', authenticate, authorize('Admin', 'Accountant'), deletePayroll);

module.exports = router;
