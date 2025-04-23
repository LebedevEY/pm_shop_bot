"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateHandlers = void 0;
const utils_1 = require("../utils");
const constants_1 = require("../constants");
const keyboards_1 = require("../keyboards");
/**
 * Обработчики состояний пользователя
 */
class StateHandlers {
    constructor(bot, userStateService, productService, cartService, cartHandlers, orderHandlers) {
        this.bot = bot;
        this.userStateService = userStateService;
        this.productService = productService;
        this.cartService = cartService;
        this.cartHandlers = cartHandlers;
        this.orderHandlers = orderHandlers;
    }
    /**
     * Обрабатывает сообщения в зависимости от текущего состояния пользователя
     */
    async handleState(msg, userState) {
        const chatId = msg.chat.id;
        const text = msg.text || '';
        switch (userState.state) {
            case constants_1.USER_STATES.WAITING_QUANTITY:
                await this.handleWaitingQuantity(msg, text, userState);
                break;
            case constants_1.USER_STATES.WAITING_ADDRESS:
                await this.handleWaitingAddress(msg, text);
                break;
            case constants_1.USER_STATES.WAITING_CONTACT_INFO:
                await this.orderHandlers.handleCreateOrderFromProduct(msg, text);
                break;
            default:
                await this.bot.sendMessage(chatId, constants_1.MESSAGES.UNKNOWN_COMMAND);
                this.userStateService.deleteState(chatId);
        }
    }
    /**
     * Обрабатывает состояние ожидания количества товара
     */
    async handleWaitingQuantity(msg, text, userState) {
        const chatId = msg.chat.id;
        const username = (0, utils_1.getUsernameFromMessage)(msg);
        try {
            // Проверяем, что введено число
            const quantity = parseInt(text, 10);
            if (isNaN(quantity) || quantity <= 0) {
                await this.bot.sendMessage(chatId, 'Пожалуйста, введите корректное количество товара (целое число больше 0)');
                return;
            }
            // Добавляем товар в корзину
            const result = await this.cartService.addToCart(username, userState.data.productId, quantity);
            if (result.success) {
                await this.bot.sendMessage(chatId, `Товар добавлен в корзину: ${quantity} шт.`, {
                    reply_markup: (0, keyboards_1.createAfterAddToCartKeyboard)(),
                });
            }
            else {
                await this.bot.sendMessage(chatId, result.message);
            }
            this.userStateService.deleteState(chatId);
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ERROR_CART(errorMessage));
            this.userStateService.deleteState(chatId);
        }
    }
    /**
     * Обрабатывает состояние ожидания адреса доставки
     */
    async handleWaitingAddress(msg, text) {
        await this.orderHandlers.handleCreateOrderFromCart(msg, text);
    }
}
exports.StateHandlers = StateHandlers;
