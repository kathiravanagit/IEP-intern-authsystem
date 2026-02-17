import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { APP_NAME } from '../config/constants.js';

// Generate 2FA secret
export const generateTwoFactorSecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${email})`,
    issuer: APP_NAME,
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
};

// Generate QR code image
export const generateQRCode = async (otpauthUrl) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

// Verify TOTP token
export const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
};

// Generate backup codes
export const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Hash backup codes for storage
export const hashBackupCodes = async (codes) => {
  const hashedCodes = await Promise.all(
    codes.map((code) => bcrypt.hash(code, 10))
  );
  return hashedCodes;
};

// Verify backup code
export const verifyBackupCode = async (hashedCodes, inputCode) => {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isMatch = await bcrypt.compare(inputCode, hashedCodes[i]);
    if (isMatch) {
      return i;
    }
  }
  return -1;
};