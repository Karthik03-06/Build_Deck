const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/github', authController.getGithubAuthUrl);
router.get('/github/callback', authController.githubCallback);
router.post('/demo-login', authController.demoLogin);
router.get('/me', optionalAuth, authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;
