const crypto = require('crypto');
const config = require('./env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from the environment secret
 */
function getKey() {
  const secret = config.CREDENTIAL_ENCRYPTION_KEY || 'default_secret_key_32_bytes_len!';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Encrypt sensitive credentials (tokens, secrets) at rest
 * @param {string} text 
 * @returns {string} encrypted string in format iv:authTag:encryptedData
 */
function encryptToken(text) {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt credential');
  }
}

/**
 * Decrypt sensitive credentials at rest
 * @param {string} encryptedText in format iv:authTag:encryptedData
 * @returns {string} decrypted plain text
 */
function decryptToken(encryptedText) {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Fallback for unencrypted legacy or plain values if any
      return encryptedText;
    }
    
    const [ivHex, authTagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt credential (AUTH_EXPIRED or key mismatch)');
  }
}

/**
 * Checks health of encryption configuration
 */
function checkEncryptionHealth() {
  try {
    const test = 'agentflow_health_check_payload';
    const encrypted = encryptToken(test);
    const decrypted = decryptToken(encrypted);
    return {
      healthy: decrypted === test,
      algorithm: ALGORITHM,
      keyLength: getKey().length * 8
    };
  } catch (err) {
    return {
      healthy: false,
      error: err.message
    };
  }
}

module.exports = {
  encryptToken,
  decryptToken,
  checkEncryptionHealth
};
