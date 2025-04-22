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
        return res.status(400).json({ message: 'u041du0435u043eu0431u0445u043eu0434u0438u043cu043e u0443u043au0430u0437u0430u0442u044c u0438u043cu044f u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f u0438 u043fu0430u0440u043eu043bu044c' });
      }

      const user = await authService.validateUser(username, password);

      if (!user) {
        return res.status(401).json({ message: 'u041du0435u0432u0435u0440u043du043eu0435 u0438u043cu044f u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f u0438u043bu0438 u043fu0430u0440u043eu043bu044c' });
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
        return res.status(400).json({ message: 'u041du0435u043eu0431u0445u043eu0434u0438u043cu043e u0443u043au0430u0437u0430u0442u044c u0438u043cu044f u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f, email u0438 u043fu0430u0440u043eu043bu044c' });
      }

      const existingUser = await userService.findByUsername(username) || await userService.findByEmail(email);

      if (existingUser) {
        return res.status(400).json({ message: 'u041fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044c u0441 u0442u0430u043au0438u043c u0438u043cu0435u043du0435u043c u0438u043bu0438 email u0443u0436u0435 u0441u0443u0449u0435u0441u0442u0432u0443u0435u0442' });
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
