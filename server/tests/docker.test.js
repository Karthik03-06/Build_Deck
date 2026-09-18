const dockerService = require('../src/services/docker/dockerService');

describe('Docker Service Architecture & Container Orchestration', () => {
  it('should have all required Docker lifecycle methods implemented', () => {
    expect(typeof dockerService.buildImage).toBe('function');
    expect(typeof dockerService.createContainer).toBe('function');
    expect(typeof dockerService.startContainer).toBe('function');
    expect(typeof dockerService.stopContainer).toBe('function');
    expect(typeof dockerService.removeContainer).toBe('function');
    expect(typeof dockerService.inspectContainer).toBe('function');
    expect(typeof dockerService.getLogsStream).toBe('function');
    expect(typeof dockerService.getContainerStats).toBe('function');
    expect(typeof dockerService.healthCheck).toBe('function');
    expect(typeof dockerService.cleanupOrphans).toBe('function');
  });

  it('should verify connection check does not crash when Docker daemon is not running', async () => {
    const status = await dockerService.checkConnection();
    expect(status).toBeDefined();
    expect(typeof status.connected).toBe('boolean');
  });
});
