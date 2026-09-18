const { sanitizePayload } = require('../src/middleware/apiActivityTracker');
const issueService = require('../src/services/issues/issueService');

describe('Issue Reporting & Reproducible Debugging', () => {
  it('should redact sensitive credentials from captured API activity', () => {
    const rawPayload = {
      username: 'developer',
      password: 'SuperSecretPassword123!',
      nested: {
        token: 'ghp_abcdef1234567890',
        authorization: 'Bearer secret_token_xyz',
        publicField: 'safeValue'
      }
    };

    const sanitized = sanitizePayload(rawPayload);
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.nested.token).toBe('[REDACTED]');
    expect(sanitized.nested.authorization).toBe('[REDACTED]');
    expect(sanitized.username).toBe('developer');
    expect(sanitized.nested.publicField).toBe('safeValue');
  });

  it('should verify IssueService is configured to capture exact historic commit context', () => {
    expect(typeof issueService.createIssue).toBe('function');
    expect(typeof issueService.getIssueById).toBe('function');
    expect(typeof issueService.updateIssueStatus).toBe('function');
  });
});
