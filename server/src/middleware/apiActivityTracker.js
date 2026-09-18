// In-memory circular buffer for recent API activities per environment or IP
const MAX_ACTIVITY_HISTORY = 50;
const activityLog = [];

/**
 * Redacts sensitive fields from objects or headers
 */
function sanitizePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'accesstoken', 'creditcard'];
  const clean = Array.isArray(obj) ? [] : {};

  for (const [key, val] of Object.entries(obj)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizePayload(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

function apiActivityTracker(req, res, next) {
  // Ignore static assets or socket polling
  if (req.path.startsWith('/socket.io') || req.path.startsWith('/favicon')) {
    return next();
  }

  const startTime = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = `${Date.now() - startTime}ms`;
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      duration,
      query: sanitizePayload(req.query),
      body: req.method !== 'GET' ? sanitizePayload(req.body) : undefined
    };

    activityLog.unshift(entry);
    if (activityLog.length > MAX_ACTIVITY_HISTORY) {
      activityLog.pop();
    }
  });

  next();
}

function getRecentActivity(limit = 20) {
  return activityLog.slice(0, limit);
}

module.exports = {
  apiActivityTracker,
  getRecentActivity,
  sanitizePayload
};
