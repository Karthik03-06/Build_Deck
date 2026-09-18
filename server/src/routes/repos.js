const express = require('express');
const router = express.Router();
const repoController = require('../controllers/repoController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, repoController.listRepositories);
router.get('/available', optionalAuth, repoController.listAvailableGithubRepos);
router.get('/:id', optionalAuth, repoController.getRepositoryById);
router.post('/connect', optionalAuth, repoController.connectRepository);

module.exports = router;
