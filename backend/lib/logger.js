const pino = require('pino');
const env = require('../config/env');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: !env.isProduction
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
});

module.exports = logger;
