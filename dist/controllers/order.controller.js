"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
exports.setupOrderRoutes = setupOrderRoutes;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const roles_middleware_1 = require("../middleware/roles.middleware");
const user_entity_1 = require("../entities/user.entity");
const order_entity_1 = require("../entities/order.entity");
exports.orderRouter = (0, express_1.Router)();
function setupOrderRoutes(orderService, notificationService) {
    exports.orderRouter.get('/', auth_middleware_1.authMiddleware, async (req, res, next) => {
        try {
            const filters = {};
            if (req.query.status) {
                filters.status = req.query.status;
            }
            if (req.user.role !== user_entity_1.UserRole.ADMIN) {
                filters.userId = req.user.id;
            }
            const orders = await orderService.findAll(filters);
            res.json(orders);
        }
        catch (error) {
            next(error);
        }
    });
    exports.orderRouter.get('/:id', auth_middleware_1.authMiddleware, async (req, res, next) => {
        try {
            const order = await orderService.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Заказ не найден' });
            }
            if (req.user.role !== user_entity_1.UserRole.ADMIN && order.userId !== req.user.id) {
                return res.status(403).json({ message: 'Доступ запрещен' });
            }
            res.json(order);
        }
        catch (error) {
            next(error);
        }
    });
    exports.orderRouter.post('/', auth_middleware_1.authMiddleware, async (req, res, next) => {
        try {
            const orderData = {
                ...req.body,
                userId: req.user.id,
            };
            const order = await orderService.create(orderData);
            await notificationService.notifyAdminAboutNewOrder(order);
            res.status(201).json(order);
        }
        catch (error) {
            next(error);
        }
    });
    exports.orderRouter.patch('/:id/status', auth_middleware_1.authMiddleware, (0, roles_middleware_1.rolesMiddleware)([user_entity_1.UserRole.ADMIN]), async (req, res, next) => {
        try {
            const { status } = req.body;
            if (!Object.values(order_entity_1.OrderStatus).includes(status)) {
                return res.status(400).json({ message: 'Некорректный статус заказа' });
            }
            const order = await orderService.updateStatus(req.params.id, status);
            if (!order) {
                return res.status(404).json({ message: 'Заказ не найден' });
            }
            res.json(order);
        }
        catch (error) {
            next(error);
        }
    });
    return exports.orderRouter;
}
