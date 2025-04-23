"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBotService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const utils_1 = require("./utils");
const constants_1 = require("./constants");
const user_state_service_1 = require("./user-state.service");
const product_handlers_1 = require("./handlers/product-handlers");
const cart_handlers_1 = require("./handlers/cart-handlers");
const order_handlers_1 = require("./handlers/order-handlers");
const state_handlers_1 = require("./handlers/state-handlers");
/**
 * Основной сервис для работы с Telegram-ботом
 */
class TelegramBotService {
    constructor(productService, orderService, cartService, notificationService, token) {
        this.productService = productService;
        this.orderService = orderService;
        this.cartService = cartService;
        this.notificationService = notificationService;
        this.bot = new node_telegram_bot_api_1.default(token, { polling: true });
        this.userStateService = new user_state_service_1.UserStateService();
        // Инициализация обработчиков
        this.productHandlers = new product_handlers_1.ProductHandlers(this.bot, this.productService, this.userStateService);
        this.cartHandlers = new cart_handlers_1.CartHandlers(this.bot, this.cartService, this.userStateService);
        this.orderHandlers = new order_handlers_1.OrderHandlers(this.bot, this.orderService, this.cartService, this.notificationService, this.userStateService);
        this.stateHandlers = new state_handlers_1.StateHandlers(this.bot, this.userStateService, this.productService, this.cartService, this.cartHandlers, this.orderHandlers);
        this.setupEventHandlers();
        this.setupCommands();
    }
    /**
     * Настраивает обработчики событий бота
     */
    setupEventHandlers() {
        this.bot.on('message', this.handleMessage.bind(this));
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
        console.log('Telegram бот запущен и готов к работе!');
    }
    /**
     * Настраивает меню команд бота
     */
    setupCommands() {
        this.bot.setMyCommands([
            { command: constants_1.COMMANDS.START, description: 'Начать работу с ботом' },
            { command: constants_1.COMMANDS.PRODUCTS, description: 'Показать список товаров' },
            { command: constants_1.COMMANDS.CART, description: 'Показать корзину' },
            { command: constants_1.COMMANDS.CHECKOUT, description: 'Оформить заказ' },
            { command: constants_1.COMMANDS.HELP, description: 'Помощь' },
        ]);
    }
    /**
     * Обрабатывает входящие сообщения
     */
    async handleMessage(msg) {
        const chatId = msg.chat.id;
        const userState = this.userStateService.getState(chatId);
        // Обработка команд
        if (msg.text?.startsWith('/')) {
            await this.handleCommand(msg);
            return;
        }
        // Обработка состояний
        if (userState) {
            await this.stateHandlers.handleState(msg, userState);
            return;
        }
        // Обработка обычных сообщений
        await this.bot.sendMessage(chatId, 'Используйте команды для взаимодействия с ботом. Например, /products для просмотра товаров.');
    }
    /**
     * Обрабатывает команды бота
     */
    async handleCommand(msg) {
        const command = msg.text?.split(' ')[0];
        switch (command) {
            case constants_1.COMMANDS.START:
                await this.handleStart(msg);
                break;
            case constants_1.COMMANDS.PRODUCTS:
                await this.productHandlers.handleProducts(msg);
                break;
            case constants_1.COMMANDS.CART:
                await this.cartHandlers.handleCart(msg);
                break;
            case constants_1.COMMANDS.CHECKOUT:
                await this.orderHandlers.handleCheckout(msg);
                break;
            case constants_1.COMMANDS.HELP:
                await this.handleHelp(msg);
                break;
            default:
                await this.bot.sendMessage(msg.chat.id, constants_1.MESSAGES.UNKNOWN_COMMAND);
        }
    }
    /**
     * Обрабатывает callback-запросы (нажатия на кнопки)
     */
    async handleCallbackQuery(query) {
        if (!query.data)
            return;
        const { data } = query;
        const messageWithUser = (0, utils_1.createMessageWithUser)(query);
        const chatId = query.message?.chat.id;
        if (!chatId)
            return;
        // Обработка различных типов callback-запросов
        if (data.startsWith(constants_1.CALLBACK_DATA.PRODUCT_PREFIX)) {
            const productId = data.split(':')[1];
            await this.productHandlers.handleProductDetails(messageWithUser, productId);
        }
        else if (data === constants_1.CALLBACK_DATA.BACK_TO_PRODUCTS) {
            await this.productHandlers.handleProducts(messageWithUser);
        }
        else if (data === constants_1.CALLBACK_DATA.VIEW_CART) {
            await this.cartHandlers.handleCart(messageWithUser);
        }
        else if (data === constants_1.CALLBACK_DATA.CHECKOUT) {
            await this.orderHandlers.handleCheckout(messageWithUser);
        }
        else if (data.startsWith(constants_1.CALLBACK_DATA.ADD_TO_CART_PREFIX)) {
            const productId = data.split(':')[1];
            await this.productHandlers.startAddToCartFlow(messageWithUser, productId);
        }
        else if (data.startsWith(constants_1.CALLBACK_DATA.REMOVE_FROM_CART_PREFIX)) {
            const cartItemId = data.split(':')[1];
            await this.cartHandlers.handleRemoveFromCart(messageWithUser, cartItemId);
        }
        await this.bot.answerCallbackQuery(query.id);
    }
    /**
     * Обрабатывает команду /start
     */
    async handleStart(msg) {
        const chatId = msg.chat.id;
        await this.bot.sendMessage(chatId, constants_1.MESSAGES.WELCOME);
    }
    /**
     * Обрабатывает команду /help
     */
    async handleHelp(msg) {
        const chatId = msg.chat.id;
        const helpMessage = [
            '*Доступные команды:*',
            `${constants_1.COMMANDS.START} - Начать работу с ботом`,
            `${constants_1.COMMANDS.PRODUCTS} - Показать список товаров`,
            `${constants_1.COMMANDS.CART} - Показать корзину`,
            `${constants_1.COMMANDS.CHECKOUT} - Оформить заказ`,
            `${constants_1.COMMANDS.HELP} - Показать эту справку`,
        ].join('\n');
        await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    }
    /**
     * Отправляет уведомление администратору
     */
    async notifyAdmin(message) {
        try {
            const adminChatId = process.env.ADMIN_CHAT_ID;
            if (!adminChatId) {
                console.error('ADMIN_CHAT_ID не настроен в переменных окружения');
                return;
            }
            await this.bot.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });
        }
        catch (error) {
            console.error('Ошибка при отправке уведомления администратору:', error);
        }
    }
}
exports.TelegramBotService = TelegramBotService;
