const { ModelWrapper } = require('./MongooseAdapter');
const Payment = new ModelWrapper('payment');
module.exports = Payment;
