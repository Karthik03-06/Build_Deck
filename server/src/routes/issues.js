const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, issueController.listIssues);
router.get('/:id', optionalAuth, issueController.getIssueById);
router.patch('/:id/status', optionalAuth, issueController.updateIssueStatus);
router.post('/:id/reproduce', optionalAuth, issueController.reproduceIssue);

module.exports = router;
