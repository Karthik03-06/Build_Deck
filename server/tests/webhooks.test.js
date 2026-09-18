const crypto = require('crypto');
const request = require('supertest');
const { app } = require('../src/index');
const { verifyGithubSignature } = require('../src/utils/cryptoUtils');

describe('GitHub Webhooks & Idempotency', () => {
  const secret = 'test_webhook_secret_key';

  it('should correctly verify valid HMAC SHA-256 signatures', () => {
    const payload = JSON.stringify({ action: 'opened', pull_request: { number: 10 } });
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const signature = `sha256=${hmac}`;

    const isValid = verifyGithubSignature(payload, signature, secret);
    expect(isValid).toBe(true);
  });

  it('should reject invalid HMAC SHA-256 signatures', () => {
    const payload = JSON.stringify({ action: 'opened' });
    const invalidSignature = 'sha256=badhash0000000000000000000000000000000000000000000000000000000000';

    const isValid = verifyGithubSignature(payload, invalidSignature, secret);
    expect(isValid).toBe(false);
  });

  it('should accept valid webhook requests with 202 Accepted', async () => {
    const deliveryId = `delivery-${Date.now()}-${Math.random()}`;
    const payload = {
      action: 'opened',
      pull_request: {
        id: 99991,
        number: 88,
        title: 'feat: Test PR Webhook',
        state: 'open',
        head: { sha: 'f9b3c4d5e6a7', ref: 'feature/test-branch' },
        base: { ref: 'main' },
        user: { login: 'octocat' }
      },
      repository: {
        id: 11111,
        name: 'test-repo',
        full_name: 'octocat/test-repo',
        owner: { login: 'octocat' },
        default_branch: 'main',
        clone_url: 'https://github.com/octocat/test-repo.git',
        html_url: 'https://github.com/octocat/test-repo'
      }
    };

    const rawPayload = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET || 'builddeck_webhook_secret_key_12345')
      .update(rawPayload)
      .digest('hex');

    const res = await request(app)
      .post('/api/webhooks/github')
      .set('x-github-delivery', deliveryId)
      .set('x-github-event', 'pull_request')
      .set('x-hub-signature-256', `sha256=${hmac}`)
      .send(payload)
      .expect(202);

    expect(res.body.status).toBe('accepted');
    expect(res.body.deliveryId).toBe(deliveryId);
  });

  it('should guarantee idempotency by ignoring duplicate delivery IDs', async () => {
    const duplicateDeliveryId = 'duplicate-test-delivery-id-001';
    const payload = {
      action: 'ping',
      zen: 'Responsive is better than fast.'
    };

    const rawPayload = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET || 'builddeck_webhook_secret_key_12345')
      .update(rawPayload)
      .digest('hex');

    // First delivery -> 202
    await request(app)
      .post('/api/webhooks/github')
      .set('x-github-delivery', duplicateDeliveryId)
      .set('x-github-event', 'ping')
      .set('x-hub-signature-256', `sha256=${hmac}`)
      .send(payload);

    // Duplicate delivery -> returns 200 with ignored status
    const duplicateRes = await request(app)
      .post('/api/webhooks/github')
      .set('x-github-delivery', duplicateDeliveryId)
      .set('x-github-event', 'ping')
      .set('x-hub-signature-256', `sha256=${hmac}`)
      .send(payload)
      .expect(200);

    expect(duplicateRes.body.status).toBe('ignored');
    expect(duplicateRes.body.message).toContain('Duplicate delivery ID');
  });
});
