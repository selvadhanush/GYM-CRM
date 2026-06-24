const { ModelWrapper } = require('./MongooseAdapter');
const Payroll = new ModelWrapper('payroll');
module.exports = Payroll;
