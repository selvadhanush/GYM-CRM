const { ModelWrapper } = require('./MongooseAdapter');
const Expense = new ModelWrapper('expense');
module.exports = Expense;
