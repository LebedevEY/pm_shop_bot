import {
  Router, Request, Response, NextFunction,
} from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

export const authRouter = Router();

export function setupAuthRoutes(authService: AuthService, userService: UserService) {
  authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Необходимо указать имя пользователя и пароль' });
      }

      const user = await authService.validateUser(username, password);

      if (!user) {
        return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
      }

      const result = await authService.login(user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Необходимо указать имя пользователя, email и пароль' });
      }

      const existingUser = await userService.findByUsername(username) || await userService.findByEmail(email);

      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким именем или email уже существует' });
      }

      const user = await authService.register(req.body);

      const result = await authService.login(user);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  return authRouter;
}
