const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { optionalAuth } = require('../middleware/authMiddleware');
const { NotFoundError } = require('../utils/errors');

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const env = await prisma.previewEnvironment.findUnique({
      where: { id },
      include: {
        pullRequest: { include: { repository: true } },
        logs: { orderBy: { timestamp: 'desc' }, take: 100 }
      }
    });

    if (!env) {
      throw new NotFoundError(`Build ${id} not found`);
    }

    res.json({
      id: env.id,
      pullRequestId: env.pullRequestId,
      repository: env.pullRequest?.repository?.fullName,
      prNumber: env.pullRequest?.number,
      commitSha: env.commitSha,
      status: env.status,
      startedAt: env.startedAt || env.createdAt,
      completedAt: env.destroyedAt || null,
      previewUrl: env.previewUrl,
      logs: env.logs || []
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
