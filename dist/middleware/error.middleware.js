"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errorMiddleware = (error, req, res, _next) => {
    console.error(error.stack);
    res.status(500).json({
        message: 'Произошла ошибка на сервере',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
};
exports.errorMiddleware = errorMiddleware;
