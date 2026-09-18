const express = require('express');
const router = express.Router();
const environmentController = require('../controllers/environmentController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, environmentController.listEnvironments);
router.get('/:id', optionalAuth, environmentController.getEnvironmentById);
router.get('/:id/logs', optionalAuth, environmentController.getEnvironmentLogs);
router.get('/:id/stats', optionalAuth, environmentController.getEnvironmentStats);
router.post('/provision', optionalAuth, environmentController.createOrRestartPreview);
router.post('/:id/rebuild', optionalAuth, environmentController.rebuildEnvironment);
router.post('/:id/retry', optionalAuth, environmentController.retryEnvironment);
router.post('/:id/stop', optionalAuth, environmentController.stopEnvironment);
router.post('/:id/destroy', optionalAuth, environmentController.destroyEnvironment);

module.exports = router;
