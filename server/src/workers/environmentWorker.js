const prisma = require('../prisma/client');
const previewService = require('../services/preview/previewService');
const logger = require('../utils/logger');

let isRunning = false;
let workerInterval = null;

async function processNextJob() {
  if (isRunning) return;
  isRunning = true;

  try {
    // Find oldest pending job
    const job = await prisma.environmentJob.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { environment: true }
    });

    if (!job) {
      isRunning = false;
      return;
    }

    logger.info(`[Worker] Picking up job ${job.id} (type: ${job.type}) for environment ${job.environmentId}`);

    // Mark RUNNING
    await prisma.environmentJob.update({
      where: { id: job.id },
      data: {
        status: 'RUNNING',
        attempts: { increment: 1 }
      }
    });

    try {
      if (job.type === 'BUILD_AND_START' || job.type === 'REBUILD') {
        await previewService.deployEnvironment(job.environmentId);
      } else if (job.type === 'STOP_AND_DESTROY') {
        await previewService.teardownEnvironment(job.environmentId);
      }

      // Mark COMPLETED
      await prisma.environmentJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED' }
      });

      logger.info(`[Worker] Job ${job.id} completed successfully.`);
    } catch (jobErr) {
      logger.error(`[Worker] Job ${job.id} failed: ${jobErr.message}`);

      // Check max retries (max 2 attempts)
      const shouldRetry = job.attempts < 2 && !jobErr.message.includes('Dockerfile not found');
      
      await prisma.environmentJob.update({
        where: { id: job.id },
        data: {
          status: shouldRetry ? 'PENDING' : 'FAILED',
          error: jobErr.message
        }
      });
    }
  } catch (err) {
    logger.error(`[Worker Error] ${err.message}`);
  } finally {
    isRunning = false;
  }
}

function startWorker(pollIntervalMs = 3000) {
  logger.info(`[Worker] Environment Worker started (poll interval: ${pollIntervalMs}ms)`);
  workerInterval = setInterval(processNextJob, pollIntervalMs);
}

function stopWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    logger.info('[Worker] Environment Worker stopped.');
  }
}

// Support running directly as a standalone process
if (require.main === module) {
  startWorker(2000);
}

module.exports = {
  startWorker,
  stopWorker,
  processNextJob
};
