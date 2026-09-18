require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/builddeck',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'builddeck-default-session-secret-key-32chars',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'builddeck_webhook_secret_key_12345'
  },
  preview: {
    traefikHost: process.env.TRAEFIK_HOST || 'localhost',
    domain: process.env.PREVIEW_DOMAIN || 'preview.localhost',
    healthPath: process.env.PREVIEW_HEALTH_PATH || '/health',
    startupTimeout: parseInt(process.env.PREVIEW_STARTUP_TIMEOUT, 10) || 120000,
    memoryLimit: process.env.PREVIEW_MEMORY_LIMIT || '512m',
    cpuLimit: parseFloat(process.env.PREVIEW_CPU_LIMIT) || 1,
    pidsLimit: parseInt(process.env.PREVIEW_PIDS_LIMIT, 10) || 100,
    maxLifetime: parseInt(process.env.PREVIEW_MAX_LIFETIME, 10) || 3600
  },
  docker: {
    host: process.env.DOCKER_HOST || null,
    socketPath: process.env.DOCKER_SOCKET_PATH || null
  }
};

module.exports = config;
