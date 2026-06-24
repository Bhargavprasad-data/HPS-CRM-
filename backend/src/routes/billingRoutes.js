const express = require('express');
const router = express.Router();
const {
  getQuotations, createQuotation, generateQuotationPdf, sendQuotation, convertToInvoice,
  getInvoices, createInvoice, generateInvoicePdf, markInvoicePaid,
} = require('../controllers/billingController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Quotations
router.get('/quotations', authenticate, authorize('Admin', 'Accountant', 'Manager'), getQuotations);
router.post('/quotations', authenticate, authorize('Admin', 'Accountant'), createQuotation);
router.post('/quotations/:id/generate-pdf', authenticate, authorize('Admin', 'Accountant'), generateQuotationPdf);
router.post('/quotations/:id/send', authenticate, authorize('Admin', 'Accountant'), sendQuotation);
router.post('/quotations/:id/convert', authenticate, authorize('Admin', 'Accountant'), convertToInvoice);

// Invoices
router.get('/invoices', authenticate, authorize('Admin', 'Accountant', 'Manager'), getInvoices);
router.post('/invoices', authenticate, authorize('Admin', 'Accountant'), createInvoice);
router.post('/invoices/:id/generate-pdf', authenticate, authorize('Admin', 'Accountant'), generateInvoicePdf);
router.put('/invoices/:id/mark-paid', authenticate, authorize('Admin', 'Accountant'), markInvoicePaid);

module.exports = router;
