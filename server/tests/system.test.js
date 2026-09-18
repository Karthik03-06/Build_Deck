const request = require('supertest');
const { app } = require('../src/index');

describe('System and Core API Endpoints', () => {
  it('GET /api/system/metrics should return dashboard metrics and recent activity', async () => {
    const res = await request(app).get('/api/system/metrics').expect(200);
    expect(res.body.metrics).toBeDefined();
    expect(res.body.metrics.activePullRequests).toBeDefined();
    expect(res.body.metrics.runningPreviews).toBeDefined();
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });

  it('GET /api/system/settings should return runtime settings and limits', async () => {
    const res = await request(app).get('/api/system/settings').expect(200);
    expect(res.body.previewDomain).toBeDefined();
    expect(res.body.resourceLimits).toBeDefined();
    expect(res.body.resourceLimits.memoryLimit).toBeDefined();
  });

  it('GET /api/repos should return list of tracked repositories', async () => {
    const res = await request(app).get('/api/repos').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0].fullName).toBeDefined();
      expect(res.body[0].openPrCount).toBeDefined();
      expect(res.body[0].activePreviewCount).toBeDefined();
    }
  });

  it('GET /api/system/health should return service health states', async () => {
    const res = await request(app).get('/api/system/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body.services).toBeDefined();
    expect(res.body.services.traefik).toBeDefined();
    expect(res.body.services.realtime).toBeDefined();
  });
});
