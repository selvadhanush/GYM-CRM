const AuditLog = require('../models/AuditLog');
const logger = require('../lib/logger');

/**
 * Log an audit event.
 * Call from any controller: await logAudit(req, 'MEMBER_UPDATED', 'Member', member._id, `Updated ${member.name}`)
 */
const logAudit = async (req, action, entity = '', entityId = '', details = '', entityName = '') => {
    try {
        if (!req.user?.gymId) return; // Skip if no gym context
        await AuditLog.create({
            gymId: req.user.gymId,
            userId: req.user._id,
            userName: req.user.name || 'Unknown',
            userEmail: req.user.email || '',
            userRole: req.user.role || '',
            action,
            entity,
            entityId: entityId?.toString() || '',
            entityName,
            details,
            ip: req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || ''
        });
    } catch (err) {
        // Never let audit logging crash the main request
        logger.warn({ err }, 'Audit log failed (non-fatal)');
    }
};

module.exports = { logAudit };
