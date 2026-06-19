const { ModelWrapper } = require('./MongooseAdapter');
const MaintenanceLog = new ModelWrapper('maintenanceLog');
module.exports = MaintenanceLog;
