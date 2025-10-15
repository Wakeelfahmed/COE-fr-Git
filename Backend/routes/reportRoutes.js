const express = require('express');
const router = express.Router();
const customReportController = require('../controllers/reportController');

router.post('/', customReportController.createReport);
router.get('/', customReportController.getAllReports);
router.get('/:id', customReportController.getReportById);
router.put('/:id', customReportController.updateReport);
router.delete('/:id', customReportController.deleteReport);

module.exports = router;