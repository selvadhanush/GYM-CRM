const { ModelWrapper } = require('./MongooseAdapter');
const User = new ModelWrapper('user');
module.exports = User;
