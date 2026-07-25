const crypto = require('crypto');
const logger = require('../lib/logger');

const requestId = (req, res, next) => {
    req.id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    req.log = logger.child({
        requestId: req.id,
        userId: req.user?.id || req.user?._id?.toString(),
    });
    res.setHeader('X-Request-ID', req.id);
    next();
};

module.exports = requestId;
