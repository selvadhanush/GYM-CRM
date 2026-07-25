const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    let message = err.message || 'Something went wrong';
    let code = err.code || 'INTERNAL_ERROR';

    // Handle Mongoose CastError (Invalid ID)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found';
        code = 'RESOURCE_NOT_FOUND';
    }

    // Handle Mongoose ValidationError
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
        code = 'VALIDATION_ERROR';
    }

    // Handle Duplicate Key Error
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered';
        code = 'DUPLICATE_KEY_ERROR';
    }

    // Handle Prisma P2002 (Unique constraint failed)
    if (err.code === 'P2002') {
        statusCode = 400;
        message = `Unique constraint failed on field(s): ${(err.meta?.target || []).join(', ')}`;
        code = 'PRISMA_UNIQUE_CONSTRAINT_ERROR';
    }

    // Handle Prisma P2025 (Record not found)
    if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Requested record not found';
        code = 'PRISMA_NOT_FOUND';
    }

    const env = require('../config/env');

    res.status(statusCode).json({
        success: false,
        code,
        message,
        stack: env.isProduction ? null : err.stack,
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
