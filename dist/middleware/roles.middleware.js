"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesMiddleware = void 0;
const rolesMiddleware = (roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Необходима авторизация' });
    }
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }
    next();
};
exports.rolesMiddleware = rolesMiddleware;
