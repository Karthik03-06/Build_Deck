const prisma = require('../prisma/client');
const issueService = require('../services/issues/issueService');
const previewService = require('../services/preview/previewService');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

async function listIssues(req, res, next) {
  try {
    const { pullRequestId, status, severity } = req.query;
    const where = {};
    if (pullRequestId) where.pullRequestId = pullRequestId;
    if (status) where.status = status.toUpperCase();
    if (severity) where.severity = severity.toUpperCase();

    const issues = await prisma.issue.findMany({
      where,
      include: {
        pullRequest: {
          include: { repository: true }
        },
        context: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(issues);
  } catch (err) {
    next(err);
  }
}

async function getIssueById(req, res, next) {
  try {
    const { id } = req.params;
    const issue = await issueService.getIssueById(id);

    if (!issue) {
      throw new NotFoundError(`Issue ${id} not found`);
    }

    res.json(issue);
  } catch (err) {
    next(err);
  }
}

async function createIssue(req, res, next) {
  try {
    const { id: pullRequestId } = req.params;
    const {
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      browserInfo,
      userAgent,
      currentUrl
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const createdBy = req.user?.username || req.body.createdBy || 'Reviewer';
    const userId = req.user?.id || null;

    const issue = await issueService.createIssue({
      pullRequestId,
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity: severity || 'MEDIUM',
      createdBy,
      userId,
      browserInfo,
      userAgent: userAgent || req.headers['user-agent'],
      currentUrl
    });

    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
}

async function updateIssueStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const issue = await issueService.updateIssueStatus(id, status);
    res.json(issue);
  } catch (err) {
    next(err);
  }
}

async function reproduceIssue(req, res, next) {
  try {
    const { id } = req.params;
    const issue = await issueService.getIssueById(id);

    if (!issue) {
      throw new NotFoundError(`Issue ${id} not found`);
    }

    if (!issue.context || !issue.context.commitSha) {
      return res.status(400).json({ error: 'Cannot reproduce: Issue has no captured commit SHA.' });
    }

    logger.info(`[Reproduce] Starting reproduction workflow for Issue #${issue.id} with historical commit ${issue.context.commitSha}`);

    // Spin up environment using EXACT historic commit SHA
    const env = await previewService.reproduceIssue(id);

    res.status(202).json({
      message: 'Reproduction environment queued using exact historic commit SHA',
      commitSha: issue.context.commitSha,
      environment: env
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listIssues,
  getIssueById,
  createIssue,
  updateIssueStatus,
  reproduceIssue
};
