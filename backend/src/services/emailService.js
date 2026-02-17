import { sendEmail } from '../config/email.js';
import { APP_NAME, CURRENT_YEAR } from '../config/constants.js';

// Send Login Confirmation Email
export const sendLoginConfirmationEmail = async (email, token) => {
  const confirmUrl = `${process.env.CLIENT_URL}/confirm-login?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 48px; }
        h2 { color: #1F2937; margin-bottom: 20px; }
        .button { display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .button:hover { background-color: #4338CA; }
        .info-box { background: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .link { color: #4F46E5; word-break: break-all; }
        .footer { margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 20px; }
        .warning { color: #DC2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo"></div>
          <h2>Confirm Your Login</h2>
        </div>
        
        <p>Hello,</p>
        <p>We received a login request for your account. To complete the login process, please click the button below:</p>
        
        <div style="text-align: center;">
          <a href="${confirmUrl}" class="button">Confirm Login</a>
        </div>
        
        <div class="info-box">
          <p style="margin: 0; font-size: 12px; color: #6B7280;">Or copy and paste this link in your browser:</p>
          <p style="margin: 8px 0 0 0;"><a href="${confirmUrl}" class="link">${confirmUrl}</a></p>
        </div>
        
        <p style="margin-top: 30px; color: #6B7280;">This link will expire in <strong>15 minutes</strong>.</p>
        
        <p class="warning">If you didn't request this login, please ignore this email and secure your account.</p>
        
        <div class="footer">
          <p><strong>${APP_NAME}</strong></p>
          <p>© ${CURRENT_YEAR} ${APP_NAME}. All rights reserved.</p>
          <p style="margin-top: 10px;">This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Confirm Your Login - ${APP_NAME}`,
    htmlContent,
  });
};

// Send OTP Email for Password Reset
export const sendPasswordResetEmail = async (email, otp) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 48px; }
        h2 { color: #1F2937; }
        .otp { font-size: 36px; font-weight: bold; color: #DC2626; letter-spacing: 8px; text-align: center; padding: 20px; background: #FEF2F2; border-radius: 8px; margin: 20px 0; border: 2px dashed #DC2626; }
        .footer { margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 20px; }
        .warning { color: #DC2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo"></div>
          <h2>Password Reset Request</h2>
        </div>
        
        <p>Hello,</p>
        <p>We received a request to reset your password. Use the following OTP code:</p>
        
        <div class="otp">${otp}</div>
        
        <p style="text-align: center; color: #6B7280;">Enter this code on the password reset page</p>
        
        <p style="margin-top: 30px; color: #6B7280;">This code will expire in <strong>5 minutes</strong>.</p>
        
        <p class="warning">If you didn't request this, please secure your account immediately!</p>
        
        <div class="footer">
          <p><strong>${APP_NAME}</strong></p>
          <p>© ${CURRENT_YEAR} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Password Reset Code - ${APP_NAME}`,
    htmlContent,
  });
};

// Send 2FA Enabled Notification
export const send2FAEnabledEmail = async (email) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .success { color: #059669; font-size: 48px; }
        h2 { color: #1F2937; }
        .footer { margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success"></div>
          <h2>Two-Factor Authentication Enabled</h2>
        </div>
        
        <p>Two-factor authentication (2FA) has been successfully enabled on your account.</p>
        <p>Your account is now more secure!</p>
        
        <p style="color: #DC2626; font-weight: bold; margin-top: 30px;">If you didn't enable 2FA, contact support immediately.</p>
        
        <div class="footer">
          <p>© ${CURRENT_YEAR} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Two-Factor Authentication Enabled',
    htmlContent,
  });
};