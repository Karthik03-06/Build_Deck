const { runCleanupCycle } = require('../src/workers/cleanupWorker');

describe('Automated Cleanup Worker', () => {
  it('should run a cleanup sweep without unhandled exceptions', async () => {
    // Should safely inspect database and Docker state
    await expect(runCleanupCycle()).resolves.not.toThrow();
  });
});
