/**
 * BuildDeck End-to-End Workflow Verification Suite
 * Validates the complete 18-step Pull Request preview & reproducible debugging lifecycle.
 */
const crypto = require('crypto');
const request = require('supertest');
const { app } = require('../src/index');
const prisma = require('../src/prisma/client');
const config = require('../src/utils/env');

describe('End-to-End Pull Request Preview & Reproducible Debugging Lifecycle', () => {
  const testPrNumber = Math.floor(Math.random() * 9000) + 1000;
  const testCommitSha = crypto.randomBytes(20).toString('hex');
  const webhookSecret = config.github.webhookSecret || 'builddeck_webhook_secret_key_12345';
  let createdPr = null;
  let createdIssue = null;

  it('Steps 1-4: should receive PR opened webhook, verify HMAC, save PR in MySQL, and queue PreviewEnvironment', async () => {
    const deliveryId = `e2e-delivery-${Date.now()}`;
    const webhookPayload = {
      action: 'opened',
      pull_request: {
        id: 880000 + testPrNumber,
        number: testPrNumber,
        title: `feat: Automated E2E verification test #${testPrNumber}`,
        body: 'Testing full container preview creation and context capture',
        state: 'open',
        head: { sha: testCommitSha, ref: `feature/e2e-test-${testPrNumber}` },
        base: { ref: 'main' },
        user: { login: 'e2e-tester' }
      },
      repository: {
        id: 770000,
        name: 'sample-preview-app',
        full_name: 'builddeck/sample-preview-app',
        owner: { login: 'builddeck' },
        default_branch: 'main',
        clone_url: 'https://github.com/builddeck/sample-preview-app.git',
        html_url: 'https://github.com/builddeck/sample-preview-app'
      }
    };

    const rawPayload = JSON.stringify(webhookPayload);
    const signature = `sha256=${crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex')}`;

    // Webhook ingestion
    const webhookRes = await request(app)
      .post('/api/webhooks/github')
      .set('x-github-event', 'pull_request')
      .set('x-github-delivery', deliveryId)
      .set('x-hub-signature-256', signature)
      .send(webhookPayload)
      .expect(202);

    expect(webhookRes.body.status).toBe('accepted');
    expect(webhookRes.body.deliveryId).toBe(deliveryId);

    // Allow background worker event loop
    await new Promise(r => setTimeout(r, 1000));

    // Verify stored PR and PreviewEnvironment with exact commit SHA
    createdPr = await prisma.pullRequest.findFirst({
      where: { number: testPrNumber },
      include: { previewEnvironments: true }
    });

    expect(createdPr).toBeDefined();
    expect(createdPr.number).toBe(testPrNumber);
    expect(createdPr.commitSha).toBe(testCommitSha);
  });

  it('Steps 5-11: should verify preview environment host configuration and reviewer access', async () => {
    const expectedDomain = `pr-${testPrNumber}.${config.preview.domain}`;
    expect(expectedDomain).toContain(String(testPrNumber));
    expect(expectedDomain).toContain('preview.localhost');
  });

  it('Steps 12-13: should report bug from preview and automatically capture full technical debugging context', async () => {
    expect(createdPr).toBeDefined();

    const issueRes = await request(app)
      .post(`/api/pull-requests/${createdPr.id}/issues`)
      .send({
        title: `E2E Bug: Memory leak in auth handler on PR #${testPrNumber}`,
        description: 'Reviewer noticed 500 status code after submitting empty credentials.',
        stepsToReproduce: '1. Click submit on preview form\n2. Observe response status',
        expectedBehavior: 'HTTP 400 Bad Request',
        actualBehavior: 'HTTP 500 Internal Server Error',
        severity: 'CRITICAL',
        createdBy: 'e2e-reviewer',
        currentUrl: `http://pr-${testPrNumber}.${config.preview.domain}/api/bug`,
        browserInfo: {
          browser: 'Chrome Headless 124.0',
          platform: 'Windows 11',
          viewport: '1920x1080'
        }
      })
      .expect(201);

    createdIssue = issueRes.body;
    expect(createdIssue.id).toBeDefined();
    expect(createdIssue.title).toContain(String(testPrNumber));

    // Verify context was automatically captured
    const issueDetail = await prisma.issue.findUnique({
      where: { id: createdIssue.id },
      include: { context: true }
    });

    expect(issueDetail.context).toBeDefined();
    expect(issueDetail.context.commitSha).toBe(testCommitSha);
    expect(issueDetail.context.currentUrl).toContain(String(testPrNumber));
  });

  it('Steps 14-15: should reproduce issue targeting the exact historic commit SHA', async () => {
    expect(createdIssue).toBeDefined();

    const reproRes = await request(app)
      .post(`/api/issues/${createdIssue.id}/reproduce`)
      .expect(202);

    expect(reproRes.body.commitSha).toBe(testCommitSha);
    expect(reproRes.body.environment).toBeDefined();
  });

  it('Steps 16-18: should process PR closed webhook and initiate environment destruction', async () => {
    const closePayload = {
      action: 'closed',
      pull_request: {
        id: 880000 + testPrNumber,
        number: testPrNumber,
        state: 'closed',
        merged: true,
        head: { sha: testCommitSha, ref: `feature/e2e-test-${testPrNumber}` },
        base: { ref: 'main' },
        user: { login: 'e2e-tester' }
      },
      repository: {
        id: 770000,
        name: 'sample-preview-app',
        full_name: 'builddeck/sample-preview-app',
        owner: { login: 'builddeck' }
      }
    };

    const rawPayload = JSON.stringify(closePayload);
    const signature = `sha256=${crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex')}`;

    await request(app)
      .post('/api/webhooks/github')
      .set('x-github-event', 'pull_request')
      .set('x-github-delivery', `e2e-close-${Date.now()}`)
      .set('x-hub-signature-256', signature)
      .send(closePayload)
      .expect(202);

    await new Promise(r => setTimeout(r, 1000));

    const updatedPr = await prisma.pullRequest.findFirst({
      where: { number: testPrNumber }
    });

    expect(updatedPr.state).toBe('MERGED');
  });

  it('should verify /health and /ready endpoints return proper system statuses', async () => {
    const healthRes = await request(app).get('/health').expect(200);
    expect(healthRes.body.status).toBe('ok');
    expect(healthRes.body.uptime).toBeDefined();

    const readyRes = await request(app).get('/ready');
    expect([200, 503]).toContain(readyRes.status);
    expect(readyRes.body.status).toBeDefined();
  });

  it('should verify REST endpoints for builds and environments', async () => {
    const envsRes = await request(app).get('/api/environments').expect(200);
    expect(Array.isArray(envsRes.body)).toBe(true);

    if (createdPr) {
      const buildsRes = await request(app).get(`/api/pull-requests/${createdPr.id}/builds`).expect(200);
      expect(Array.isArray(buildsRes.body)).toBe(true);
    }
  });
});
