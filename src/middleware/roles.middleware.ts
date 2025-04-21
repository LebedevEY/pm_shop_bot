import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/user.entity';

export const rolesMiddleware = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'u041du0435u043eu0431u0445u043eu0434u0438u043cu0430 u0430u0432u0442u043eu0440u0438u0437u0430u0446u0438u044f' });
    }
    
    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'u0414u043eu0441u0442u0443u043f u0437u0430u043fu0440u0435u0449u0435u043d' });
    }
    
    next();
  };
};
