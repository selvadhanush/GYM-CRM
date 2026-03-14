const mongoose = require('mongoose');

const auditLogSchema = mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'System' },
    userEmail: { type: String, default: '' },
    userRole: { type: String, default: '' },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN', 'LOGOUT',
            'MEMBER_CREATED', 'MEMBER_UPDATED', 'MEMBER_DELETED',
            'PAYMENT_ADDED', 'PAYMENT_DELETED',
            'EXPENSE_ADDED', 'EXPENSE_DELETED',
            'PLAN_CREATED', 'PLAN_UPDATED', 'PLAN_DELETED',
            'CLASS_CREATED', 'CLASS_DELETED',
            'LEAD_CREATED', 'LEAD_UPDATED', 'LEAD_DELETED',
            'FREEZE_APPLIED', 'FREEZE_REMOVED',
            'BRANCH_CREATED', 'BRANCH_UPDATED', 'BRANCH_DELETED',
            'OTHER'
        ]
    },
    entity: { type: String, default: '' },     // e.g. 'Member', 'Payment'
    entityId: { type: String, default: '' },   // ID of the affected document
    entityName: { type: String, default: '' }, // Human readable name (e.g. member name)
    details: { type: String, default: '' },    // Short description of what changed
    ip: { type: String, default: '' },
}, { timestamps: true });

auditLogSchema.index({ gymId: 1, createdAt: -1 });
auditLogSchema.index({ gymId: 1, action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
