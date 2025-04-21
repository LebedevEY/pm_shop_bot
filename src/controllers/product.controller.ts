import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { rolesMiddleware } from '../middleware/roles.middleware';
import { UserRole } from '../entities/user.entity';

export const productRouter = Router();

export function setupProductRoutes(productService: ProductService) {
  productRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isActive = req.query.active === 'true' ? true : 
                      req.query.active === 'false' ? false : undefined;
      
      const products = await productService.findAll({ isActive });
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  productRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: 'u0422u043eu0432u0430u0440 u043du0435 u043du0430u0439u0434u0435u043d' });
      }
      
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  productRouter.post(
    '/',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const product = await productService.create(req.body);
        res.status(201).json(product);
      } catch (error) {
        next(error);
      }
    }
  );

  productRouter.put(
    '/:id',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const product = await productService.update(req.params.id, req.body);
        
        if (!product) {
          return res.status(404).json({ message: 'u0422u043eu0432u0430u0440 u043du0435 u043du0430u0439u0434u0435u043d' });
        }
        
        res.json(product);
      } catch (error) {
        next(error);
      }
    }
  );

  productRouter.delete(
    '/:id',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await productService.delete(req.params.id);
        
        if (!result) {
          return res.status(404).json({ message: 'u0422u043eu0432u0430u0440 u043du0435 u043du0430u0439u0434u0435u043d' });
        }
        
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    }
  );

  return productRouter;
}
