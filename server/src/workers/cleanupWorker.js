const prisma = require('../prisma/client');
const dockerService = require('../services/docker/dockerService');
const previewService = require('../services/preview/previewService');
const config = require('../utils/env');
const logger = require('../utils/logger');

let cleanupInterval = null;

async function runCleanupCycle() {
  logger.info('[Cleanup Worker] Starting automated resource cleanup sweep...');

  try {
    const now = new Date();
    const lifetimeMs = (config.preview.maxLifetime || 3600) * 1000;
    const expirationThreshold = new Date(now.getTime() - lifetimeMs);

    // 1. Find Expired Environments
    const expiredEnvs = await prisma.previewEnvironment.findMany({
      where: {
        status: { in: ['RUNNING', 'STARTING', 'BUILDING', 'FAILED'] },
        createdAt: { lt: expirationThreshold }
      }
    });

    for (const env of expiredEnvs) {
      logger.info(`[Cleanup Worker] Destroying expired environment ${env.id} (exceeded lifetime of ${config.preview.maxLifetime}s)`);
      try {
        await previewService.teardownEnvironment(env.id);
      } catch (e) {
        logger.warn(`[Cleanup Worker] Failed to teardown expired env ${env.id}: ${e.message}`);
      }
    }

    // 2. Find environments belonging to closed/merged PRs that are still active
    const closedPrEnvs = await prisma.previewEnvironment.findMany({
      where: {
        status: { in: ['RUNNING', 'STARTING', 'BUILDING'] },
        pullRequest: {
          state: { in: ['CLOSED', 'MERGED'] }
        }
      }
    });

    for (const env of closedPrEnvs) {
      logger.info(`[Cleanup Worker] Destroying environment ${env.id} because PR is closed/merged`);
      try {
        await previewService.teardownEnvironment(env.id);
      } catch (e) {
        logger.warn(`[Cleanup Worker] Failed to teardown closed PR env ${env.id}: ${e.message}`);
      }
    }

    // 3. Detect and remove orphaned Docker containers
    const activeEnvs = await prisma.previewEnvironment.findMany({
      where: { status: { in: ['RUNNING', 'STARTING', 'BUILDING'] } },
      select: { containerId: true }
    });

    const activeContainerIds = activeEnvs.map(e => e.containerId).filter(Boolean);
    const cleanedOrphans = await dockerService.cleanupOrphans(activeContainerIds);
    if (cleanedOrphans.length > 0) {
      logger.info(`[Cleanup Worker] Cleaned ${cleanedOrphans.length} orphaned BuildDeck container(s).`);
    }
  } catch (err) {
    logger.error(`[Cleanup Worker Error] ${err.message}`);
  }
}

function startCleanupWorker(intervalMs = 60000) {
  logger.info(`[Cleanup Worker] Scheduled cleanup worker (sweep interval: ${intervalMs}ms)`);
  // Run first cycle after 5 seconds
  setTimeout(runCleanupCycle, 5000);
  cleanupInterval = setInterval(runCleanupCycle, intervalMs);
}

function stopCleanupWorker() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('[Cleanup Worker] Cleanup worker stopped.');
  }
}

// Support running directly as a standalone script
if (require.main === module) {
  runCleanupCycle().then(() => process.exit(0));
}

module.exports = {
  startCleanupWorker,
  stopCleanupWorker,
  runCleanupCycle
};
