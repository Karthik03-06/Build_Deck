const prisma = require('../../prisma/client');
const { getRecentActivity } = require('../../middleware/apiActivityTracker');
const { emitIssueCreated, emitIssueUpdated } = require('../../sockets/socketServer');
const logger = require('../../utils/logger');

class IssueService {
  /**
   * Creates an issue with automatically captured technical debugging context
   */
  async createIssue({
    pullRequestId,
    title,
    description,
    stepsToReproduce,
    expectedBehavior,
    actualBehavior,
    severity = 'MEDIUM',
    createdBy,
    userId,
    // Context parameters automatically submitted from preview page
    browserInfo,
    userAgent,
    currentUrl
  }) {
    // 1. Fetch Pull Request and latest/active Preview Environment
    const pr = await prisma.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: {
        previewEnvironments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!pr) {
      throw new Error(`Pull Request ${pullRequestId} not found`);
    }

    const activeEnv = pr.previewEnvironments[0] || null;
    const commitSha = activeEnv ? activeEnv.commitSha : pr.commitSha;
    const containerId = activeEnv ? activeEnv.containerId : null;
    const environmentStatus = activeEnv ? activeEnv.status : 'UNKNOWN';

    // 2. Automatically retrieve relevant tail logs from EnvironmentLog
    let relevantLogs = [];
    if (activeEnv) {
      const recentLogs = await prisma.environmentLog.findMany({
        where: { environmentId: activeEnv.id },
        orderBy: { timestamp: 'desc' },
        take: 30
      });
      relevantLogs = recentLogs.reverse().map(l => `[${l.level}] [${l.source}] ${l.message}`);
    }

    // 3. Automatically retrieve sanitized API activity
    const apiActivity = getRecentActivity(15);

    // 4. Create Issue and IssueContext atomically
    const issue = await prisma.issue.create({
      data: {
        pullRequestId,
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        severity,
        status: 'OPEN',
        createdBy: createdBy || 'Anonymous Reviewer',
        userId: userId || null,
        context: {
          create: {
            environmentId: activeEnv ? activeEnv.id : null,
            commitSha,
            containerId,
            browserInfo: typeof browserInfo === 'string' ? browserInfo : JSON.stringify(browserInfo || {}),
            userAgent: userAgent || 'Unknown Browser',
            currentUrl: currentUrl || (activeEnv ? activeEnv.previewUrl : ''),
            relevantLogs: JSON.stringify(relevantLogs),
            apiActivity: JSON.stringify(apiActivity),
            environmentStatus
          }
        }
      },
      include: {
        context: true,
        pullRequest: true
      }
    });

    // 5. Emit real-time Socket.IO notification
    emitIssueCreated(issue);
    logger.info(`[Issue Service] Issue created: #${issue.id} "${issue.title}" with context for commit ${commitSha}`);

    return issue;
  }

  /**
   * Retrieves issue with parsed JSON context fields
   */
  async getIssueById(issueId) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        context: true,
        pullRequest: {
          include: {
            repository: true,
            previewEnvironments: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!issue) return null;

    // Parse JSON fields safely for consumption
    if (issue.context) {
      try {
        issue.context.parsedBrowserInfo = JSON.parse(issue.context.browserInfo || '{}');
      } catch (e) {
        issue.context.parsedBrowserInfo = {};
      }
      try {
        issue.context.parsedLogs = JSON.parse(issue.context.relevantLogs || '[]');
      } catch (e) {
        issue.context.parsedLogs = [];
      }
      try {
        issue.context.parsedApiActivity = JSON.parse(issue.context.apiActivity || '[]');
      } catch (e) {
        issue.context.parsedApiActivity = [];
      }
    }

    return issue;
  }

  /**
   * Updates an issue status
   */
  async updateIssueStatus(issueId, status) {
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { status },
      include: {
        context: true,
        pullRequest: true
      }
    });

    emitIssueUpdated(issue);
    return issue;
  }
}

module.exports = new IssueService();
