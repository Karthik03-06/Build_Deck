const { Server } = require('socket.io');
const logger = require('../utils/logger');
const config = require('../utils/env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for repository
    socket.on('join:repository', (repoId) => {
      if (repoId) {
        socket.join(`repository:${repoId}`);
        logger.debug(`[Socket.IO] ${socket.id} joined repository:${repoId}`);
      }
    });

    socket.on('leave:repository', (repoId) => {
      if (repoId) {
        socket.leave(`repository:${repoId}`);
      }
    });

    // Join room for pull request
    socket.on('join:pr', (prId) => {
      if (prId) {
        socket.join(`pr:${prId}`);
        logger.debug(`[Socket.IO] ${socket.id} joined pr:${prId}`);
      }
    });

    socket.on('leave:pr', (prId) => {
      if (prId) {
        socket.leave(`pr:${prId}`);
      }
    });

    // Join room for environment
    socket.on('join:environment', (envId) => {
      if (envId) {
        socket.join(`environment:${envId}`);
        logger.debug(`[Socket.IO] ${socket.id} joined environment:${envId}`);
      }
    });

    socket.on('leave:environment', (envId) => {
      if (envId) {
        socket.leave(`environment:${envId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

/**
 * Emit environment status changes (queued, building, starting, running, failed, stopping, destroyed)
 */
function emitEnvironmentStatus(env) {
  if (!io || !env) return;
  const eventName = `environment:${env.status ? env.status.toLowerCase() : 'updated'}`;
  
  // Broadcast to environment room, pr room, and global
  io.to(`environment:${env.id}`).emit(eventName, env);
  if (env.pullRequestId) {
    io.to(`pr:${env.pullRequestId}`).emit(eventName, env);
    io.to(`pr:${env.pullRequestId}`).emit('environment:updated', env);
  }
  io.emit(eventName, env);
  io.emit('environment:updated', env);
  logger.info(`[Socket.IO Broadcast] ${eventName} for env ${env.id} (${env.status})`);
}

/**
 * Emit a new environment log line in real time
 */
function emitEnvironmentLog(environmentId, logEntry) {
  if (!io || !environmentId) return;
  io.to(`environment:${environmentId}`).emit('environment:log', {
    environmentId,
    log: logEntry
  });
}

/**
 * Emit issue events
 */
function emitIssueCreated(issue) {
  if (!io || !issue) return;
  if (issue.pullRequestId) {
    io.to(`pr:${issue.pullRequestId}`).emit('issue:created', issue);
  }
  io.emit('issue:created', issue);
  logger.info(`[Socket.IO Broadcast] issue:created for issue ${issue.id}`);
}

function emitIssueUpdated(issue) {
  if (!io || !issue) return;
  if (issue.pullRequestId) {
    io.to(`pr:${issue.pullRequestId}`).emit('issue:updated', issue);
  }
  io.emit('issue:updated', issue);
}

/**
 * Emit PR updates
 */
function emitPrUpdated(pr) {
  if (!io || !pr) return;
  io.to(`pr:${pr.id}`).emit('pr:updated', pr);
  if (pr.repositoryId) {
    io.to(`repository:${pr.repositoryId}`).emit('pr:updated', pr);
  }
  io.emit('pr:updated', pr);
}

/**
 * Emit system activity event
 */
function emitActivity(activity) {
  if (!io || !activity) return;
  io.emit('activity:created', activity);
}

module.exports = {
  initSocket,
  getIO,
  emitEnvironmentStatus,
  emitEnvironmentLog,
  emitIssueCreated,
  emitIssueUpdated,
  emitPrUpdated,
  emitActivity
};
