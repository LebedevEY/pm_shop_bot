import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Не указан токен авторизации' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Некорректный формат токена' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
};
