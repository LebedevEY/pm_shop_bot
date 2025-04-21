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
      return res.status(401).json({ message: 'u041du0435 u0443u043au0430u0437u0430u043d u0442u043eu043au0435u043d u0430u0432u0442u043eu0440u0438u0437u0430u0446u0438u0438' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'u041du0435u043au043eu0440u0440u0435u043au0442u043du044bu0439 u0444u043eu0440u043cu0430u0442 u0442u043eu043au0435u043du0430' });
    }
    
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'u041du0435u0434u0435u0439u0441u0442u0432u0438u0442u0435u043bu044cu043du044bu0439 u0442u043eu043au0435u043d' });
  }
};
