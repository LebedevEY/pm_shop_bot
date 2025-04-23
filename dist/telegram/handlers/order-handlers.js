"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderHandlers = void 0;
const utils_1 = require("../utils");
const constants_1 = require("../constants");
/**
 * Обработчики команд, связанных с заказами
 */
class OrderHandlers {
    constructor(bot, orderService, cartService, notificationService, userStateService) {
        this.bot = bot;
        this.orderService = orderService;
        this.cartService = cartService;
        this.notificationService = notificationService;
        this.userStateService = userStateService;
    }
    /**
     * Обрабатывает команду /checkout - начинает процесс оформления заказа
     */
    async handleCheckout(msg) {
        const chatId = msg.chat.id;
        const username = (0, utils_1.getUsernameFromMessage)(msg);
        try {
            // Получаем корзину пользователя
            const cart = await this.cartService.getCart(username);
            if (!cart || cart.items.length === 0) {
                await this.bot.sendMessage(chatId, constants_1.MESSAGES.CART_EMPTY);
                return;
            }
            // Формируем сообщение с информацией о заказе
            let message = '*Информация о заказе:*\n\n';
            let totalAmount = 0;
            for (const item of cart.items) {
                const itemTotal = Number(item.price) * item.quantity;
                totalAmount += itemTotal;
                message += `${item.product.name}\n`;
                message += `Цена: ${Number(item.price).toFixed(2)} ₽ x ${item.quantity} = ${itemTotal.toFixed(2)} ₽\n\n`;
            }
            message += `*Общая сумма: ${totalAmount.toFixed(2)} ₽*\n\n`;
            message += 'Для оформления заказа, пожалуйста, введите адрес доставки:';
            // Устанавливаем состояние ожидания адреса доставки
            this.userStateService.setWaitingAddressState(chatId);
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: { force_reply: true },
            });
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, `Ошибка при оформлении заказа: ${errorMessage}`);
        }
    }
    /**
     * Обрабатывает создание заказа из корзины
     */
    async handleCreateOrderFromCart(msg, address) {
        const chatId = msg.chat.id;
        const username = (0, utils_1.getUsernameFromMessage)(msg);
        try {
            // Получаем корзину пользователя
            const cart = await this.cartService.getCart(username);
            if (!cart || cart.items.length === 0) {
                await this.bot.sendMessage(chatId, constants_1.MESSAGES.CART_EMPTY);
                this.userStateService.deleteState(chatId);
                return;
            }
            // Создаем заказ на основе корзины
            const order = await this.orderService.createOrderFromCart({
                username,
                address,
            });
            // Очищаем корзину после создания заказа
            await this.cartService.clearCart(username);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ORDER_CREATED(order.orderNumber || 'без номера'));
            // Уведомляем администратора о новом заказе
            await this.notificationService.notifyAdminAboutNewOrder(order);
            this.userStateService.deleteState(chatId);
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            console.error(`Ошибка при создании заказа: ${errorMessage}`);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ERROR_ORDER(errorMessage));
            this.userStateService.deleteState(chatId);
        }
    }
    /**
     * Обрабатывает создание заказа напрямую из товара
     */
    async handleCreateOrderFromProduct(msg, contactInfo) {
        const chatId = msg.chat.id;
        const username = (0, utils_1.getUsernameFromMessage)(msg);
        const userState = this.userStateService.getState(chatId);
        if (!userState || userState.state !== 'waiting_contact_info' || !userState.data.productId || !userState.data.quantity) {
            await this.bot.sendMessage(chatId, 'Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте снова.');
            this.userStateService.deleteState(chatId);
            return;
        }
        try {
            const orderData = {
                productId: userState.data.productId,
                quantity: userState.data.quantity,
                contactInfo,
                username,
            };
            const order = await this.orderService.createOrderFromTelegram(orderData);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ORDER_CREATED(order.orderNumber || 'без номера'));
            await this.notificationService.notifyAdminAboutNewOrder(order);
            this.userStateService.deleteState(chatId);
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ERROR_ORDER(errorMessage));
            this.userStateService.deleteState(chatId);
        }
    }
}
exports.OrderHandlers = OrderHandlers;
