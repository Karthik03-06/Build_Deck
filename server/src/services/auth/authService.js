const axios = require('axios');
const prisma = require('../../prisma/client');
const config = require('../../utils/env');
const { encryptToken } = require('../../utils/cryptoUtils');
const logger = require('../../utils/logger');
const { UnauthorizedError } = require('../../utils/errors');

class AuthService {
  /**
   * Generates the GitHub OAuth redirect URL with state
   */
  getGithubAuthUrl(state) {
    const clientId = config.github.clientId || process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new Error('GITHUB_CLIENT_ID is not configured');
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${config.frontendUrl.replace(/\/$/, '')}/api/auth/github/callback`,
      scope: 'read:user user:email repo write:repo_hook',
      state: state || 'builddeck_auth'
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for GitHub access token and creates/updates User
   */
  async handleGithubCallback(code) {
    if (!code) {
      throw new UnauthorizedError('Authorization code is missing');
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code
      },
      {
        headers: { Accept: 'application/json' }
      }
    );

    const { access_token, error, error_description } = tokenResponse.data;
    if (error || !access_token) {
      throw new UnauthorizedError(`GitHub OAuth error: ${error_description || error}`);
    }

    // Fetch GitHub user profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const ghUser = userResponse.data;

    // Fetch primary email if not public
    let email = ghUser.email;
    if (!email) {
      try {
        const emailsResponse = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const primary = emailsResponse.data.find(e => e.primary);
        if (primary) email = primary.email;
      } catch (e) {
        logger.warn('Could not fetch user emails from GitHub');
      }
    }

    const encryptedToken = encryptToken(access_token, config.sessionSecret);

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { githubId: String(ghUser.id) },
      update: {
        username: ghUser.login,
        displayName: ghUser.name || ghUser.login,
        email: email || `${ghUser.login}@users.noreply.github.com`,
        avatarUrl: ghUser.avatar_url,
        accessTokenEncrypted: encryptedToken
      },
      create: {
        githubId: String(ghUser.id),
        username: ghUser.login,
        displayName: ghUser.name || ghUser.login,
        email: email || `${ghUser.login}@users.noreply.github.com`,
        avatarUrl: ghUser.avatar_url,
        accessTokenEncrypted: encryptedToken
      }
    });

    logger.info(`[Auth] User authenticated via GitHub OAuth: ${user.username} (${user.id})`);
    return user;
  }

  /**
   * Fast development / demo login fallback when GitHub OAuth credentials aren't set
   */
  async handleDemoLogin() {
    let demoUser = await prisma.user.findUnique({
      where: { githubId: 'demo-user-12345' }
    });

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          githubId: 'demo-user-12345',
          username: 'demo-developer',
          displayName: 'Demo Reviewer (BuildDeck)',
          email: 'demo@builddeck.local',
          avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4'
        }
      });
    }

    logger.info(`[Auth] User signed in via Demo Mode: ${demoUser.username} (${demoUser.id})`);
    return demoUser;
  }
}

module.exports = new AuthService();
