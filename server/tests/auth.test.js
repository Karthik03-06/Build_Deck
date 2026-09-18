const request = require('supertest');
const { app } = require('../src/index');
const authService = require('../src/services/auth/authService');

describe('Authentication & Session Management', () => {
  it('should generate a valid GitHub OAuth redirect URL', () => {
    // Override clientId temporarily if not set
    const originalId = process.env.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_ID = 'test_gh_client_id';

    const url = authService.getGithubAuthUrl('test_state');
    expect(url).toContain('https://github.com/login/oauth/authorize');
    expect(url).toContain('client_id=test_gh_client_id');
    expect(url).toContain('state=test_state');

    process.env.GITHUB_CLIENT_ID = originalId;
  });

  it('should allow demo login and establish a secure session', async () => {
    const res = await request(app)
      .post('/api/auth/demo-login')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe('demo-developer');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should report unauthenticated for requests without session', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .expect(200);

    expect(res.body.authenticated).toBe(false);
  });
});
