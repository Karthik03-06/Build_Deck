const prisma = require('../prisma/client');
const { UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Middleware ensuring user is authenticated via session cookie
 */
async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return next(new UnauthorizedError('Authentication required. Please log in with GitHub.'));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        githubId: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      req.session = null;
      return next(new UnauthorizedError('Session invalid or user no longer exists.'));
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error(`Auth Middleware error: ${err.message}`);
    next(err);
  }
}

/**
 * Optional authentication: attaches user if session exists, but doesn't reject
 */
async function optionalAuth(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          githubId: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true
        }
      });
      if (user) req.user = user;
    }
  } catch (err) {
    // Ignore optional auth error
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
