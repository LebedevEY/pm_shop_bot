import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { config } from './config';
import { setupProductRoutes } from './controllers/product.controller';
import { setupOrderRoutes } from './controllers/order.controller';
import { setupAuthRoutes } from './controllers/auth.controller';
import { errorMiddleware } from './middleware/error.middleware';
import { TelegramBotService } from './telegram/bot';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { EmailService } from './services/email.service';
import { User, Product, Order, OrderItem, Notification } from './entities';

async function bootstrap() {
  const appDataSource = new DataSource({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database,
    entities: [User, Product, Order, OrderItem, Notification],
    synchronize: config.database.synchronize,
    logging: config.database.logging,
  });
  
  await appDataSource.initialize();
  console.log('База данных подключена');
  
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  const userRepository = appDataSource.getRepository(User);
  const productRepository = appDataSource.getRepository(Product);
  const orderRepository = appDataSource.getRepository(Order);
  const orderItemRepository = appDataSource.getRepository(OrderItem);
  const notificationRepository = appDataSource.getRepository(Notification);
  
  const userService = new UserService(userRepository);
  const productService = new ProductService(productRepository);
  const authService = new AuthService(userRepository);
  const emailService = new EmailService();
  
  const orderService = new OrderService(
    orderRepository,
    orderItemRepository,
    productRepository,
    userRepository
  );
  
  const telegramBotService = new TelegramBotService(
    productService,
    orderService,
    null
  );
  
  const notificationService = new NotificationService(
    notificationRepository,
    emailService,
    telegramBotService
  );
  
  telegramBotService['notificationService'] = notificationService;
  
  app.use('/api/auth', setupAuthRoutes(authService, userService));
  app.use('/api/products', setupProductRoutes(productService));
  app.use('/api/orders', setupOrderRoutes(orderService, notificationService));
  
  app.use(errorMiddleware);
  
  await userService.createAdminIfNotExists();
  
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
}

bootstrap().catch(error => {
  console.error('Ошибка при запуске приложения:', error);
});
