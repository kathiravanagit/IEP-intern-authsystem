import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async ({
  userId = null,
  action,
  email = null,
  ip,
  userAgent,
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      email,
      ip,
      userAgent,
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};