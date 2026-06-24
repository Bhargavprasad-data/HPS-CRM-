const express = require('express');
const multer = require('multer');
const router = express.Router();
const { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getStats } = require('../controllers/employeeController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const upload = multer({ dest: 'src/uploads/temp/' });

router.get('/stats', authenticate, authorize('Admin', 'Manager'), getStats);
router.get('/', authenticate, authorize('Admin', 'Manager', 'Accountant'), getEmployees);
router.get('/:id', authenticate, getEmployee);
router.post('/', authenticate, authorize('Admin'), upload.single('photo'), createEmployee);
router.put('/:id', authenticate, authorize('Admin'), upload.single('photo'), updateEmployee);
router.delete('/:id', authenticate, authorize('Admin'), deleteEmployee);

module.exports = router;
