"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartHandlers = void 0;
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const constants_1 = require("../constants");
const keyboards_1 = require("../keyboards");
/**
 * Обработчики команд, связанных с корзиной
 */
class CartHandlers {
    constructor(bot, cartService, userStateService) {
        this.bot = bot;
        this.cartService = cartService;
        this.userStateService = userStateService;
    }
    /**
     * Обрабатывает команду /cart - показывает содержимое корзины
     */
    async handleCart(msg) {
        const chatId = msg.chat.id;
        const username = (0, utils_1.getUsernameFromMessage)(msg);
        try {
            const cart = await this.cartService.getCart(username);
            if (!cart || cart.items.length === 0) {
                await this.bot.sendMessage(chatId, constants_1.MESSAGES.CART_EMPTY);
                return;
            }
            let totalAmount = 0;
            let message = '*Ваша корзина:*\n\n';
            for (const item of cart.items) {
                const itemTotal = Number(item.price) * item.quantity;
                totalAmount += itemTotal;
                message += `${item.product.name}\n`;
                message += `Цена: ${Number(item.price).toFixed(2)} ₽ x ${item.quantity} = ${itemTotal.toFixed(2)} ₽\n\n`;
                // Отправляем изображение товара, если оно есть
                if (item.product.imageUrl) {
                    // Преобразуем относительный путь в полный путь к файлу
                    const fullImagePath = path_1.default.join(__dirname, '../../../src/public', item.product.imageUrl);
                    try {
                        // Формируем сообщение для товара в корзине, избегая многострочных строк
                        let itemCaption = item.product.name;
                        itemCaption = itemCaption + '\nЦена: ' + Number(item.price).toFixed(2) + ' ₽';
                        itemCaption = itemCaption + '\nКоличество: ' + item.quantity;
                        itemCaption = itemCaption + '\nИтого: ' + itemTotal.toFixed(2) + ' ₽';
                        await this.bot.sendPhoto(chatId, fullImagePath, {
                            caption: itemCaption,
                            reply_markup: (0, keyboards_1.createCartItemKeyboard)(item.id),
                        });
                    }
                    catch (photoError) {
                        console.error(`Ошибка при отправке фото товара в корзине: ${(0, utils_1.formatErrorMessage)(photoError)}`);
                        // Если не удалось отправить фото, отправляем только информацию о товаре в общем сообщении
                    }
                }
            }
            message += `*Общая сумма: ${totalAmount.toFixed(2)} ₽*`;
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: (0, keyboards_1.createCartKeyboard)(),
            });
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ERROR_CART(errorMessage));
        }
    }
    /**
     * Обрабатывает удаление товара из корзины
     */
    async handleRemoveFromCart(msg, cartItemId) {
        const chatId = msg.chat.id;
        const username = (0, utils_1.getUsernameFromMessage)(msg);
        try {
            const result = await this.cartService.removeFromCart(username, cartItemId);
            if (!result.success) {
                await this.bot.sendMessage(chatId, result.message);
                return;
            }
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.PRODUCT_REMOVED);
            // Показываем обновленную корзину
            await this.handleCart(msg);
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ERROR_CART(errorMessage));
        }
    }
    /**
     * Обрабатывает добавление товара в корзину
     */
    async handleAddToCart(msg, productId, quantity) {
        const chatId = msg.chat.id;
        const username = (0, utils_1.getUsernameFromMessage)(msg);
        try {
            const result = await this.cartService.addToCart(username, productId, quantity);
            if (!result.success) {
                await this.bot.sendMessage(chatId, result.message);
                return;
            }
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.PRODUCT_ADDED(quantity), { reply_markup: (0, keyboards_1.createCartKeyboard)() });
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ERROR_CART(errorMessage));
        }
    }
    /**
     * Обрабатывает очистку корзины
     */
    async handleClearCart(msg) {
        const chatId = msg.chat.id;
        const username = (0, utils_1.getUsernameFromMessage)(msg);
        try {
            const success = await this.cartService.clearCart(username);
            if (success) {
                await this.bot.sendMessage(chatId, constants_1.MESSAGES.CART_CLEARED);
            }
            else {
                await this.bot.sendMessage(chatId, constants_1.MESSAGES.CART_EMPTY);
            }
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ERROR_CART(errorMessage));
        }
    }
}
exports.CartHandlers = CartHandlers;
