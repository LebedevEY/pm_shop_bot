import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { config } from './config';
import { setupProductRoutes } from './controllers/product.controller';
import { setupOrderRoutes } from './controllers/order.controller';
import { setupAuthRoutes } from './controllers/auth.controller';
import { setupUserRoutes } from './controllers/user.controller';
import { errorMiddleware } from './middleware/error.middleware';
import { TelegramBotService } from './telegram/bot';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { EmailService } from './services/email.service';
import { CartService } from './services/cart.service';
import {
  User, Product, Order, OrderItem, Notification, Cart, CartItem,
} from './entities';

async function bootstrap() {
  const appDataSource = new DataSource({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database,
    entities: [User, Product, Order, OrderItem, Notification, Cart, CartItem],
    synchronize: config.database.synchronize,
    logging: config.database.logging,
  });

  await appDataSource.initialize();
  console.log('База данных подключена');

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  // Создаем папку для загрузок, если её нет
  const uploadsDir = path.join(__dirname, 'public', 'uploads', 'products');
  const fs = require('fs');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use(express.urlencoded({ extended: true }));

  const userRepository = appDataSource.getRepository(User);
  const productRepository = appDataSource.getRepository(Product);
  const orderRepository = appDataSource.getRepository(Order);
  const orderItemRepository = appDataSource.getRepository(OrderItem);
  const notificationRepository = appDataSource.getRepository(Notification);
  const cartRepository = appDataSource.getRepository(Cart);
  const cartItemRepository = appDataSource.getRepository(CartItem);

  const userService = new UserService(userRepository);
  const productService = new ProductService(productRepository);
  const authService = new AuthService(userRepository);
  const emailService = new EmailService();
  const cartService = new CartService(cartRepository, cartItemRepository, productRepository);

  const orderService = new OrderService(
    orderRepository,
    orderItemRepository,
    productRepository,
    userRepository,
  );

  const telegramBotService = new TelegramBotService(
    productService,
    orderService,
    {} as NotificationService,
    cartService,
  );

  const notificationService = new NotificationService(
    notificationRepository,
    emailService,
    telegramBotService,
  );

  (telegramBotService as any).notificationService = notificationService;

  app.use('/api/auth', setupAuthRoutes(authService, userService));
  app.use('/api/products', setupProductRoutes(productService));
  app.use('/api/orders', setupOrderRoutes(orderService, notificationService));
  app.use('/api/users', setupUserRoutes(userService));

  app.use(errorMiddleware);

  await userService.createAdminIfNotExists();

  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Ошибка при запуске приложения:', error);
});
