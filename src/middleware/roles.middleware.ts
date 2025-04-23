import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities';

export const rolesMiddleware = (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Необходима авторизация' });
  }

  const userRole = req.user.role;

  if (!roles.includes(userRole)) {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }

  next();
};
