const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/health', systemController.getHealthStatus);
router.get('/ready', systemController.getReadinessStatus);
router.get('/metrics', optionalAuth, systemController.getDashboardMetrics);
router.get('/settings', optionalAuth, systemController.getSystemSettings);

module.exports = router;
