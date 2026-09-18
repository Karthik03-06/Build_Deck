const authService = require('../services/auth/authService');
const config = require('../utils/env');

async function getGithubAuthUrl(req, res, next) {
  try {
    const state = req.query.state || 'builddeck_oauth_state';
    const url = authService.getGithubAuthUrl(state);
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

async function githubCallback(req, res, next) {
  try {
    const { code } = req.query;
    const user = await authService.handleGithubCallback(code);

    // Set secure HTTP-only session cookie
    req.session.userId = user.id;

    // Redirect to frontend dashboard
    res.redirect(`${config.frontendUrl}/dashboard`);
  } catch (err) {
    next(err);
  }
}

async function demoLogin(req, res, next) {
  try {
    const user = await authService.handleDemoLogin();
    req.session.userId = user.id;
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    if (!req.user) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        githubId: req.user.githubId,
        username: req.user.username,
        displayName: req.user.displayName,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl
      }
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    req.session = null;
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGithubAuthUrl,
  githubCallback,
  demoLogin,
  getCurrentUser,
  logout
};
