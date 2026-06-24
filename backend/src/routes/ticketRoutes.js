const express = require('express');
const router = express.Router();
const { getTickets, getTicket, createTicket, updateTicket, getTicketStats } = require('../controllers/ticketController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/stats', authenticate, getTicketStats);
router.get('/', authenticate, getTickets);
router.get('/:id', authenticate, getTicket);
router.post('/', authenticate, createTicket);
router.put('/:id', authenticate, authorize('Admin', 'Manager'), updateTicket);

module.exports = router;
