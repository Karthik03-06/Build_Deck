const prisma = require('../prisma/client');
const dockerService = require('../services/docker/dockerService');
const config = require('../utils/env');

async function getProcessHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
}

async function getReadinessStatus(req, res) {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error';
  }

  const isReady = dbStatus === 'connected';
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: dbStatus
    }
  });
}

async function getHealthStatus(req, res) {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error';
  }

  const dockerCheck = await dockerService.checkConnection();

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus,
        provider: 'mysql'
      },
      docker: {
        status: dockerCheck.connected ? 'connected' : 'unavailable',
        version: dockerCheck.version || null,
        error: dockerCheck.error || null
      },
      traefik: {
        status: 'configured',
        host: config.preview.traefikHost,
        domain: config.preview.domain
      },
      realtime: {
        status: 'active',
        transport: 'socket.io'
      }
    }
  });
}

async function getDashboardMetrics(req, res, next) {
  try {
    const [
      activePrCount,
      runningPreviewsCount,
      activeBuildsCount,
      failedBuildsCount,
      openIssuesCount,
      recentActivity
    ] = await Promise.all([
      prisma.pullRequest.count({ where: { state: 'OPEN' } }),
      prisma.previewEnvironment.count({ where: { status: 'RUNNING' } }),
      prisma.previewEnvironment.count({ where: { status: { in: ['QUEUED', 'BUILDING', 'STARTING'] } } }),
      prisma.previewEnvironment.count({ where: { status: 'FAILED' } }),
      prisma.issue.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.activityEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          repository: true,
          pullRequest: true
        }
      })
    ]);

    res.json({
      metrics: {
        activePullRequests: activePrCount,
        runningPreviews: runningPreviewsCount,
        activeBuilds: activeBuildsCount,
        failedBuilds: failedBuildsCount,
        openIssues: openIssuesCount
      },
      recentActivity
    });
  } catch (err) {
    next(err);
  }
}

async function getSystemSettings(req, res) {
  res.json({
    environment: config.nodeEnv,
    previewDomain: config.preview.domain,
    traefikHost: config.preview.traefikHost,
    healthCheckPath: config.preview.healthPath,
    startupTimeoutMs: config.preview.startupTimeout,
    resourceLimits: {
      memoryLimit: config.preview.memoryLimit,
      cpuLimit: config.preview.cpuLimit,
      pidsLimit: config.preview.pidsLimit
    },
    maxLifetimeSeconds: config.preview.maxLifetime,
    githubConfigured: Boolean(config.github.clientId && config.github.clientSecret),
    webhookConfigured: Boolean(config.github.webhookSecret)
  });
}

module.exports = {
  getProcessHealth,
  getReadinessStatus,
  getHealthStatus,
  getDashboardMetrics,
  getSystemSettings
};
