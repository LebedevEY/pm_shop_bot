"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const typeorm_1 = require("typeorm");
const config_1 = require("./config");
const product_controller_1 = require("./controllers/product.controller");
const order_controller_1 = require("./controllers/order.controller");
const auth_controller_1 = require("./controllers/auth.controller");
const user_controller_1 = require("./controllers/user.controller");
const error_middleware_1 = require("./middleware/error.middleware");
const bot_service_1 = require("./telegram/bot.service");
const product_service_1 = require("./services/product.service");
const order_service_1 = require("./services/order.service");
const user_service_1 = require("./services/user.service");
const auth_service_1 = require("./services/auth.service");
const notification_service_1 = require("./services/notification.service");
const email_service_1 = require("./services/email.service");
const cart_service_1 = require("./services/cart.service");
const entities_1 = require("./entities");
async function bootstrap() {
    const appDataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: config_1.config.database.host,
        port: config_1.config.database.port,
        username: config_1.config.database.username,
        password: config_1.config.database.password,
        database: config_1.config.database.database,
        entities: [entities_1.User, entities_1.Product, entities_1.Order, entities_1.OrderItem, entities_1.Notification, entities_1.Cart, entities_1.CartItem],
        synchronize: config_1.config.database.synchronize,
        logging: config_1.config.database.logging,
    });
    await appDataSource.initialize();
    console.log('База данных подключена');
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.static(path.join(__dirname, 'public')));
    // Создаем папку для загрузок, если её нет
    const uploadsDir = path.join(__dirname, 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    app.use(express_1.default.urlencoded({ extended: true }));
    const userRepository = appDataSource.getRepository(entities_1.User);
    const productRepository = appDataSource.getRepository(entities_1.Product);
    const orderRepository = appDataSource.getRepository(entities_1.Order);
    const orderItemRepository = appDataSource.getRepository(entities_1.OrderItem);
    const notificationRepository = appDataSource.getRepository(entities_1.Notification);
    const cartRepository = appDataSource.getRepository(entities_1.Cart);
    const cartItemRepository = appDataSource.getRepository(entities_1.CartItem);
    const userService = new user_service_1.UserService(userRepository);
    const productService = new product_service_1.ProductService(productRepository);
    const authService = new auth_service_1.AuthService(userRepository);
    const emailService = new email_service_1.EmailService();
    const cartService = new cart_service_1.CartService(cartRepository, cartItemRepository, productRepository);
    const orderService = new order_service_1.OrderService(orderRepository, orderItemRepository, productRepository, userRepository);
    // Сначала создаем NotificationService без TelegramBotService
    const notificationService = new notification_service_1.NotificationService(notificationRepository, emailService, null);
    // Создаем TelegramBotService с правильными аргументами
    const telegramBotService = new bot_service_1.TelegramBotService(productService, orderService, cartService, notificationService, process.env.TELEGRAM_BOT_TOKEN || '');
    // Устанавливаем ссылку на TelegramBotService в NotificationService
    notificationService.telegramBotService = telegramBotService;
    app.use('/api/auth', (0, auth_controller_1.setupAuthRoutes)(authService, userService));
    app.use('/api/products', (0, product_controller_1.setupProductRoutes)(productService));
    app.use('/api/orders', (0, order_controller_1.setupOrderRoutes)(orderService, notificationService));
    app.use('/api/users', (0, user_controller_1.setupUserRoutes)(userService));
    app.use(error_middleware_1.errorMiddleware);
    await userService.createAdminIfNotExists();
    const PORT = config_1.config.port;
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
    });
}
bootstrap().catch((error) => {
    console.error('Ошибка при запуске приложения:', error);
});
