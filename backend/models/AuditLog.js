const { ModelWrapper } = require('./MongooseAdapter');
const AuditLog = new ModelWrapper('auditLog');
module.exports = AuditLog;
