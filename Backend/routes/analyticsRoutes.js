const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Get comprehensive data usage analytics
router.get('/data-usage', analyticsController.getDataUsageAnalytics);

// Get table-specific analytics - supports all available tables
router.get('/data-usage/table/:tableName', analyticsController.getTableAnalytics);

// Get user-specific analytics
router.get('/data-usage/user/:userId', analyticsController.getUserAnalytics);

module.exports = router;
