const prisma = require('../prisma/client');
const config = require('../utils/env');
const { verifyGithubSignature } = require('../utils/cryptoUtils');
const previewService = require('../services/preview/previewService');
const { emitPrUpdated, emitActivity } = require('../sockets/socketServer');
const logger = require('../utils/logger');

/**
 * Main GitHub Webhook Handler
 */
async function handleGithubWebhook(req, res) {
  const signature = req.headers['x-hub-signature-256'];
  const deliveryId = req.headers['x-github-delivery'];
  const eventType = req.headers['x-github-event'];

  logger.info(`[Webhook Received] Event: ${eventType}, Delivery: ${deliveryId}`);

  // 1. Validate GitHub HMAC Signature
  // If secret is set, signature is strictly verified
  if (config.github.webhookSecret) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = verifyGithubSignature(rawBody, signature, config.github.webhookSecret);
    if (!isValid) {
      logger.warn(`[Webhook] Invalid signature received for delivery ${deliveryId}`);
      return res.status(401).json({ error: 'Invalid HMAC signature' });
    }
  }

  if (!deliveryId) {
    return res.status(400).json({ error: 'Missing X-GitHub-Delivery header' });
  }

  // 2. Webhook Idempotency Check
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { deliveryId }
  });

  if (existingEvent) {
    logger.info(`[Webhook Idempotency] Delivery ${deliveryId} already processed. Ignoring duplicate.`);
    return res.status(200).json({ status: 'ignored', message: 'Duplicate delivery ID' });
  }

  // 3. Store Webhook Event
  const webhookRecord = await prisma.webhookEvent.create({
    data: {
      deliveryId,
      eventType: eventType || 'unknown',
      action: req.body.action || null,
      payload: JSON.stringify(req.body),
      processed: false
    }
  });

  // 4. Return fast response to GitHub (Do NOT block for Docker operations)
  res.status(202).json({
    status: 'accepted',
    deliveryId,
    timestamp: new Date().toISOString()
  });

  // 5. Asynchronously process the event
  setImmediate(async () => {
    try {
      await processWebhookPayload(eventType, req.body);
      await prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: { processed: true }
      });
    } catch (err) {
      logger.error(`[Webhook Background Error] Failed to process delivery ${deliveryId}: ${err.message}`);
    }
  });
}

/**
 * Asynchronous event processing pipeline
 */
async function processWebhookPayload(eventType, payload) {
  if (eventType === 'pull_request') {
    const { action, pull_request: prData, repository: repoData } = payload;
    logger.info(`[Webhook Processing] PR #${prData.number} action: ${action}`);

    // Find or create repository
    const defaultUser = await prisma.user.findFirst();
    const repo = await prisma.repository.upsert({
      where: { fullName: repoData.full_name },
      update: {
        defaultBranch: repoData.default_branch,
        cloneUrl: repoData.clone_url,
        htmlUrl: repoData.html_url
      },
      create: {
        githubRepositoryId: String(repoData.id),
        name: repoData.name,
        fullName: repoData.full_name,
        owner: repoData.owner.login,
        defaultBranch: repoData.default_branch,
        cloneUrl: repoData.clone_url,
        htmlUrl: repoData.html_url,
        userId: defaultUser?.id || 'demo-user-12345'
      }
    });

    const commitSha = prData.head.sha;
    let prState = prData.state.toUpperCase();
    if (prData.merged) prState = 'MERGED';

    // Upsert Pull Request record with EXACT commit SHA
    const pr = await prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId: repo.id,
          number: prData.number
        }
      },
      update: {
        title: prData.title,
        description: prData.body || '',
        sourceBranch: prData.head.ref,
        targetBranch: prData.base.ref,
        commitSha,
        state: prState,
        author: prData.user.login
      },
      create: {
        githubPrId: String(prData.id),
        number: prData.number,
        title: prData.title,
        description: prData.body || '',
        sourceBranch: prData.head.ref,
        targetBranch: prData.base.ref,
        commitSha,
        state: prState,
        author: prData.user.login,
        repositoryId: repo.id
      }
    });

    emitPrUpdated(pr);

    if (action === 'opened' || action === 'reopened') {
      logger.info(`[Webhook] PR #${pr.number} opened. Queuing preview environment for commit ${commitSha}`);
      await previewService.getOrCreateEnvironment(pr.id, commitSha);
    } else if (action === 'synchronize') {
      logger.info(`[Webhook] PR #${pr.number} updated with new commit ${commitSha}. Tearing down old container & queuing new preview...`);

      // Find any existing active environment for older commits
      const oldEnvs = await prisma.previewEnvironment.findMany({
        where: {
          pullRequestId: pr.id,
          status: { in: ['RUNNING', 'STARTING', 'BUILDING'] }
        }
      });

      for (const oldEnv of oldEnvs) {
        if (oldEnv.commitSha !== commitSha) {
          await previewService.teardownEnvironment(oldEnv.id);
        }
      }

      // Create preview for new commit
      await previewService.getOrCreateEnvironment(pr.id, commitSha);
    } else if (action === 'closed') {
      logger.info(`[Webhook] PR #${pr.number} closed/merged. Initiating automated container destruction...`);
      const activeEnvs = await prisma.previewEnvironment.findMany({
        where: {
          pullRequestId: pr.id,
          status: { in: ['RUNNING', 'STARTING', 'BUILDING', 'QUEUED'] }
        }
      });

      for (const env of activeEnvs) {
        await previewService.teardownEnvironment(env.id);
      }
    }
  } else if (eventType === 'ping') {
    logger.info('[Webhook] GitHub ping event received successfully.');
  }
}

module.exports = {
  handleGithubWebhook,
  processWebhookPayload
};
