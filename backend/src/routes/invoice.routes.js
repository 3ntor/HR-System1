const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/role');

// All routes require authentication
router.use(authenticateToken);

// Routes accessible by accountant and admin
router.post('/', checkRole(['accountant', 'admin']), invoiceController.createInvoice);
router.get('/', checkRole(['accountant', 'admin']), invoiceController.getInvoices);
router.get('/:id', checkRole(['accountant', 'admin']), invoiceController.getInvoice);
router.put('/:id', checkRole(['accountant', 'admin']), invoiceController.updateInvoice);
router.patch('/:id/status', checkRole(['accountant', 'admin']), invoiceController.updateInvoiceStatus);

// Delete route accessible by admin only
router.delete('/:id', checkRole(['admin']), invoiceController.deleteInvoice);

module.exports = router; 