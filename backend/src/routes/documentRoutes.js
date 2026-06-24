const express = require('express');
const router = express.Router();
const { createOfferLetter, getOfferLetters, generateOfferLetterPdf, sendOfferLetter, generateIdCard, getIdCards } = require('../controllers/documentController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/offer-letters', authenticate, authorize('Admin'), getOfferLetters);
router.post('/offer-letters', authenticate, authorize('Admin'), createOfferLetter);
router.post('/offer-letters/:id/generate-pdf', authenticate, authorize('Admin'), generateOfferLetterPdf);
router.post('/offer-letters/:id/send', authenticate, authorize('Admin'), sendOfferLetter);

router.get('/id-cards', authenticate, authorize('Admin', 'Manager'), getIdCards);
router.post('/id-cards/generate/:employee_id', authenticate, authorize('Admin'), generateIdCard);

module.exports = router;
