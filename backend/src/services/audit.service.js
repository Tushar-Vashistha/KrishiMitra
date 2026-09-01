const prisma = require('../config/db');
const logger = require('../utils/logger');

const logAction = ({ userId, action, entity, entityId, metadata }) => {
  // Fire and forget audit logging to avoid blocking HTTP response thread
  setImmediate(async () => {
    try {
      // Clone metadata and sanitize any potential sensitive values
      let sanitizedMetadata = null;
      if (metadata) {
        const cloned = JSON.parse(JSON.stringify(metadata));
        const sensitiveKeys = ['password', 'token', 'secret', 'aadhaar', 'accountNumber', 'otp', 'accessToken', 'refreshToken'];
        
        const sanitize = (obj) => {
          for (const key in obj) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
              obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              sanitize(obj[key]);
            }
          }
        };
        
        sanitize(cloned);
        sanitizedMetadata = JSON.stringify(cloned);
      }

      await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action,
          entity,
          entityId: entityId ? String(entityId) : null,
          metadata: sanitizedMetadata,
        },
      });

      logger.info(`Audit Log: User ${userId || 'SYSTEM'} performed ${action} on ${entity} (${entityId || 'N/A'})`);
    } catch (error) {
      logger.error(`Failed to create audit log: ${error.message}`);
    }
  });
};

module.exports = {
  logAction,
};
