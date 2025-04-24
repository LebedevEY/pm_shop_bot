"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
exports.setupUserRoutes = setupUserRoutes;
// @ts-nocheck
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const roles_middleware_1 = require("../middleware/roles.middleware");
const user_entity_1 = require("../entities/user.entity");
exports.userRouter = (0, express_1.Router)();
function setupUserRoutes(userService) {
    exports.userRouter.get('/', auth_middleware_1.authMiddleware, (0, roles_middleware_1.rolesMiddleware)([user_entity_1.UserRole.ADMIN]), async (req, res, next) => {
        try {
            const users = await userService.findAll();
            res.json(users);
        }
        catch (error) {
            next(error);
        }
    });
    exports.userRouter.get('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.rolesMiddleware)([user_entity_1.UserRole.ADMIN]), async (req, res, next) => {
        try {
            const user = await userService.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            res.json(user);
        }
        catch (error) {
            next(error);
        }
    });
    exports.userRouter.patch('/:id/block', auth_middleware_1.authMiddleware, (0, roles_middleware_1.rolesMiddleware)([user_entity_1.UserRole.ADMIN]), async (req, res, next) => {
        try {
            const user = await userService.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            if (user.role === user_entity_1.UserRole.ADMIN) {
                return res.status(403).json({ message: 'Нельзя заблокировать администратора' });
            }
            user.isBlocked = true;
            await userService.update(user);
            res.json(user);
        }
        catch (error) {
            next(error);
        }
    });
    exports.userRouter.patch('/:id/unblock', auth_middleware_1.authMiddleware, (0, roles_middleware_1.rolesMiddleware)([user_entity_1.UserRole.ADMIN]), async (req, res, next) => {
        try {
            const user = await userService.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            user.isBlocked = false;
            await userService.update(user);
            res.json(user);
        }
        catch (error) {
            next(error);
        }
    });
    return exports.userRouter;
}
