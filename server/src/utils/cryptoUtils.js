const crypto = require('crypto');

/**
 * Validates GitHub HMAC SHA-256 webhook signature using constant-time comparison
 * @param {string|Buffer} payload Raw request body
 * @param {string} signature Header 'x-hub-signature-256'
 * @param {string} secret Configured GITHUB_WEBHOOK_SECRET
 * @returns {boolean}
 */
function verifyGithubSignature(payload, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');

  const providedHash = parts[1];

  if (expectedHash.length !== providedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(providedHash, 'hex')
  );
}

/**
 * Encrypts sensitive string using AES-256-CBC
 * @param {string} text 
 * @param {string} keySecret 
 * @returns {string} iv:hex
 */
function encryptToken(text, keySecret) {
  if (!text) return null;
  const secretKey = crypto.createHash('sha256').update(keySecret || 'builddeck-default-secret-key').digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts AES-256-CBC encrypted token
 * @param {string} encryptedText iv:hex
 * @param {string} keySecret 
 * @returns {string}
 */
function decryptToken(encryptedText, keySecret) {
  if (!encryptedText || !encryptedText.includes(':')) return null;
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    const secretKey = crypto.createHash('sha256').update(keySecret || 'builddeck-default-secret-key').digest();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

module.exports = {
  verifyGithubSignature,
  encryptToken,
  decryptToken
};
