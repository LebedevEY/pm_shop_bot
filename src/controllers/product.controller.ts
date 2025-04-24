// @ts-nocheck - отключаем проверку типов для всего файла из-за несовместимости типов в multer
import {
  Router, Request, Response, NextFunction,
} from 'express';
import * as path from 'path';
import { ProductService } from '../services/product.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { rolesMiddleware } from '../middleware/roles.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { UserRole } from '../entities/user.entity';

export const productRouter = Router();

export function setupProductRoutes(productService: ProductService) {
  productRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isActive = req.query.active === 'true' ? true
        : req.query.active === 'false' ? false : undefined;

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
        return res.status(404).json({ message: 'Товар не найден' });
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
    uploadMiddleware.single('image'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const productData = req.body;
        
        // Преобразуем строковые значения 'true'/'false' в булевы значения
        if (productData.isActive !== undefined) {
          productData.isActive = productData.isActive === 'true';
        }
        
        if (req.file) {
          const relativePath = path.join('/public/uploads/products', path.basename(req.file.path));
          productData.imageUrl = relativePath;
        }
        
        const product = await productService.create(productData);
        res.status(201).json(product);
      } catch (error) {
        next(error);
      }
    },
  );

  // Обработчик обновления товара
  productRouter.put(
    '/:id',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    uploadMiddleware.single('image'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const productData = req.body;
        
        // Преобразуем строковые значения 'true'/'false' в булевы значения
        if (productData.isActive !== undefined) {
          productData.isActive = productData.isActive === 'true';
        }
        
        if (req.file) {
          const relativePath = path.join('/public/uploads/products', path.basename(req.file.path));
          productData.imageUrl = relativePath;
        }
        
        console.log('Отправляем данные в сервис продуктов:', productData);
        const product = await productService.update(req.params.id, productData);
        console.log('Результат обновления товара:', product);

        if (!product) {
          console.log('Товар не найден');
          return res.status(404).json({ message: 'Товар не найден' });
        }

        console.log('Успешно обновлен товар:', product);
        res.json(product);
      } catch (error) {
        next(error);
      }
    },
  );

  productRouter.delete(
    '/:id',
    authMiddleware,
    rolesMiddleware([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await productService.delete(req.params.id);

        if (!result) {
          return res.status(404).json({ message: 'Товар не найден' });
        }

        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    },
  );

  return productRouter;
}
