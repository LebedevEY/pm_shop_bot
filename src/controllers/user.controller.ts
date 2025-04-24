// @ts-nocheck
import {
  Router, Request, Response, NextFunction,
} from 'express';
import { UserService } from '../services/user.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { rolesMiddleware } from '../middleware/roles.middleware';
import { UserRole } from '../entities/user.entity';

export const userRouter = Router();

export function setupUserRoutes(userService: UserService) {
  userRouter.get(
    '/',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const users = await userService.findAll();
        res.json(users);
      } catch (error) {
        next(error);
      }
    },
  );

  userRouter.get(
    '/:id',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await userService.findById(req.params.id);

        if (!user) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(user);
      } catch (error) {
        next(error);
      }
    },
  );

  userRouter.patch(
    '/:id/block',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await userService.findById(req.params.id);

        if (!user) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (user.role === UserRole.ADMIN) {
          return res.status(403).json({ message: 'Нельзя заблокировать администратора' });
        }

        user.isBlocked = true;
        await userService.update(user);

        res.json(user);
      } catch (error) {
        next(error);
      }
    },
  );

  userRouter.patch(
    '/:id/unblock',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await userService.findById(req.params.id);

        if (!user) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }

        user.isBlocked = false;
        await userService.update(user);

        res.json(user);
      } catch (error) {
        next(error);
      }
    },
  );

  return userRouter;
}
