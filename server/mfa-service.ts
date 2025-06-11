import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerification {
  isValid: boolean;
  usedBackupCode?: boolean;
}

export class MFAService {
  private static readonly APP_NAME = 'JACC';
  private static readonly BACKUP_CODES_COUNT = 10;

  /**
   * Generate MFA setup for a user
   */
  static async generateMFASetup(userEmail: string): Promise<MFASetup> {
    // Generate a secret for TOTP
    const secret = authenticator.generateSecret();
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Create QR code URL for authenticator apps
    const otpauth = authenticator.keyuri(userEmail, this.APP_NAME, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify TOTP token or backup code
   */
  static verifyMFA(
    token: string, 
    secret: string, 
    backupCodes: string[] = []
  ): MFAVerification {
    // First try TOTP verification
    const isValidTOTP = authenticator.verify({
      token: token.replace(/\s/g, ''), // Remove spaces
      secret
    });

    if (isValidTOTP) {
      return { isValid: true };
    }

    // If TOTP fails, check backup codes
    const normalizedToken = token.replace(/\s/g, '').toLowerCase();
    const isBackupCode = backupCodes.some(code => 
      code.toLowerCase() === normalizedToken
    );

    return {
      isValid: isBackupCode,
      usedBackupCode: isBackupCode
    };
  }

  /**
   * Generate backup codes for account recovery
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Remove used backup code from the list
   */
  static removeUsedBackupCode(backupCodes: string[], usedCode: string): string[] {
    const normalizedUsedCode = usedCode.replace(/\s/g, '').toLowerCase();
    return backupCodes.filter(code => 
      code.toLowerCase() !== normalizedUsedCode
    );
  }

  /**
   * Generate new backup codes (when old ones are running low)
   */
  static generateNewBackupCodes(): string[] {
    return this.generateBackupCodes();
  }

  /**
   * Validate secret format
   */
  static isValidSecret(secret: string): boolean {
    return typeof secret === 'string' && secret.length >= 16;
  }

  /**
   * Format backup codes for display
   */
  static formatBackupCodes(codes: string[]): string[] {
    return codes.map(code => {
      // Insert space in middle for readability (e.g., "ABCD 1234")
      return code.length === 8 ? 
        `${code.slice(0, 4)} ${code.slice(4)}` : 
        code;
    });
  }
}