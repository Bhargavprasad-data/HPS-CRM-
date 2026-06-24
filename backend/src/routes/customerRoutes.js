const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', authenticate, authorize('Admin', 'Manager', 'Accountant'), getCustomers);
router.get('/:id', authenticate, authorize('Admin', 'Manager', 'Accountant'), getCustomer);
router.post('/', authenticate, authorize('Admin', 'Manager'), createCustomer);
router.put('/:id', authenticate, authorize('Admin', 'Manager'), updateCustomer);
router.delete('/:id', authenticate, authorize('Admin'), deleteCustomer);

module.exports = router;
