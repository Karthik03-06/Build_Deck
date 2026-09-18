const express = require('express');
const router = express.Router();
const prController = require('../controllers/prController');
const issueController = require('../controllers/issueController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, prController.listPullRequests);
router.get('/:id', optionalAuth, prController.getPullRequestById);
router.get('/:id/builds', optionalAuth, prController.getPullRequestBuilds);
router.post('/:id/issues', optionalAuth, issueController.createIssue);

module.exports = router;
