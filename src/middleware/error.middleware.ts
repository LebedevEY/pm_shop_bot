import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (error: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(error.stack);

  res.status(500).json({
    message: 'Произошла ошибка на сервере',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
};
