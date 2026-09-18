const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieSession = require('cookie-session');
const rateLimit = require('express-rate-limit');

const config = require('./utils/env');
const logger = require('./utils/logger');
const { initSocket } = require('./sockets/socketServer');
const { apiActivityTracker } = require('./middleware/apiActivityTracker');
const errorHandler = require('./middleware/errorHandler');

// Workers
const { startWorker, stopWorker } = require('./workers/environmentWorker');
const { startCleanupWorker, stopCleanupWorker } = require('./workers/cleanupWorker');

// Route modules
const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repos');
const prRoutes = require('./routes/prs');
const envRoutes = require('./routes/environments');
const issueRoutes = require('./routes/issues');
const webhookRoutes = require('./routes/webhooks');
const systemRoutes = require('./routes/system');
const buildRoutes = require('./routes/builds');

const app = express();
const server = http.createServer(app);

// 1. Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allows preview frames
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS configuration
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// 3. Body Parsing with rawBody capture for GitHub HMAC signature validation
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true }));

// 4. Secure Cookie Session
app.use(cookieSession({
  name: 'builddeck_session',
  keys: [config.sessionSecret],
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax'
}));

// 5. Rate Limiting for public endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// 6. API Activity Tracker for reproducible debugging
app.use(apiActivityTracker);

// 7. Initialize Real-Time Socket.IO
initSocket(server);

// 8. Liveness and Readiness root endpoints
const systemController = require('./controllers/systemController');
app.get('/health', systemController.getProcessHealth);
app.get('/ready', systemController.getReadinessStatus);

// 9. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/pull-requests', prRoutes);
app.use('/api/environments', envRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/builds', buildRoutes);

// 10. Centralized Error Handler
app.use(errorHandler);

// 11. Start Server & Workers (only when not in test environment)
const PORT = config.port;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`=======================================================`);
    logger.info(`  BuildDeck Engine Server running on port ${PORT}`);
    logger.info(`  Mode: ${config.nodeEnv}`);
    logger.info(`  Frontend URL: ${config.frontendUrl}`);
    logger.info(`  Preview Domain: ${config.preview.domain}`);
    logger.info(`=======================================================`);

    // Start Background Job Worker and Cleanup Worker
    startWorker(3000);
    startCleanupWorker(60000);
  });
}

// Graceful Shutdown
function handleShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopWorker();
  stopCleanupWorker();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = { app, server };
