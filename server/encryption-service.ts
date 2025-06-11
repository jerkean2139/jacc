import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  static encrypt(text: string, key: Buffer): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAutoPadding(true);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt data encrypted with AES-256-GCM
   */
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: Buffer): string {
    const decipher = crypto.createDecipher(this.ALGORITHM, key);
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate a secure encryption key
   */
  static generateKey(): Buffer {
    return crypto.randomBytes(this.KEY_LENGTH);
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  static deriveKey(password: string, salt: Buffer, iterations: number = 100000): Buffer {
    return crypto.pbkdf2Sync(password, salt, iterations, this.KEY_LENGTH, 'sha256');
  }

  /**
   * Generate salt for key derivation
   */
  static generateSalt(): Buffer {
    return crypto.randomBytes(16);
  }

  /**
   * Hash sensitive data using SHA-256
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt database fields that contain sensitive information
   */
  static encryptSensitiveField(data: string): string {
    const key = this.getEncryptionKey();
    const encrypted = this.encrypt(data, key);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt database fields that contain sensitive information
   */
  static decryptSensitiveField(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const data = JSON.parse(encryptedData);
    return this.decrypt(data, key);
  }

  /**
   * Get encryption key from environment variables
   */
  private static getEncryptionKey(): Buffer {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY environment variable not set');
    }
    return Buffer.from(keyHex, 'hex');
  }
}