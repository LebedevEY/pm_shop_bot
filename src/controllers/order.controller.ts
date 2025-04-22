import {
  Router, Request, Response, NextFunction,
} from 'express';
import { OrderService } from '../services/order.service';
import { NotificationService } from '../services/notification.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { rolesMiddleware } from '../middleware/roles.middleware';
import { UserRole } from '../entities/user.entity';
import { OrderStatus } from '../entities/order.entity';

export const orderRouter = Router();

export function setupOrderRoutes(orderService: OrderService, notificationService: NotificationService) {
  orderRouter.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const filters: { status?: OrderStatus; userId?: string } = {};

        if (req.query.status) {
          filters.status = req.query.status as OrderStatus;
        }

        if (req.user.role !== UserRole.ADMIN) {
          filters.userId = req.user.id;
        }

        const orders = await orderService.findAll(filters);
        res.json(orders);
      } catch (error) {
        next(error);
      }
    },
  );

  orderRouter.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const order = await orderService.findById(req.params.id);

        if (!order) {
          return res.status(404).json({ message: 'Заказ не найден' });
        }

        if (req.user.role !== UserRole.ADMIN && order.userId !== req.user.id) {
          return res.status(403).json({ message: 'Доступ запрещен' });
        }

        res.json(order);
      } catch (error) {
        next(error);
      }
    },
  );

  orderRouter.post(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orderData = {
          ...req.body,
          userId: req.user.id,
        };

        const order = await orderService.create(orderData);

        await notificationService.notifyAdminAboutNewOrder(order);

        res.status(201).json(order);
      } catch (error) {
        next(error);
      }
    },
  );

  orderRouter.patch(
    '/:id/status',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { status } = req.body;

        if (!Object.values(OrderStatus).includes(status)) {
          return res.status(400).json({ message: 'Некорректный статус заказа' });
        }

        const order = await orderService.updateStatus(req.params.id, status);

        if (!order) {
          return res.status(404).json({ message: 'Заказ не найден' });
        }

        res.json(order);
      } catch (error) {
        next(error);
      }
    },
  );

  return orderRouter;
}
