const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Main GitHub Webhook ingestion endpoint
router.post('/github', webhookController.handleGithubWebhook);

module.exports = router;
