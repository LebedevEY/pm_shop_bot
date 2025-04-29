"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductHandlers = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("../utils");
const constants_1 = require("../constants");
const keyboards_1 = require("../keyboards");
/**
 * Обработчики команд, связанных с товарами
 */
class ProductHandlers {
    constructor(bot, productService, userStateService) {
        this.bot = bot;
        this.productService = productService;
        this.userStateService = userStateService;
    }
    /**
     * Обрабатывает команду /products - показывает список товаров с фото и информацией
     */
    async handleProducts(msg) {
        const chatId = msg.chat.id;
        try {
            const products = await this.productService.findAll({ isActive: true });
            if (products.length === 0) {
                await this.bot.sendMessage(chatId, 'В данный момент нет доступных товаров.');
                return;
            }
            // Отправляем приветственное сообщение
            await this.bot.sendMessage(chatId, 'Наши товары:');
            // Отправляем каждый товар отдельным сообщением с фото и информацией
            for (const product of products) {
                // Формируем сообщение с информацией о товаре
                const nameText = `*${product.name}*`;
                const descriptionText = product.description;
                const priceText = `Цена: ${product.price} ₽`;
                // Формируем сообщение, избегая многострочных строк
                let message = nameText;
                message = `${message}\n\n${descriptionText}`;
                message = `${message}\n\n${priceText}`;
                // Создаем клавиатуру с кнопкой добавления в корзину
                const keyboard = {
                    inline_keyboard: [],
                };
                // Добавляем кнопку добавления в корзину, если товар в наличии
                if (product.stockQuantity > 0) {
                    keyboard.inline_keyboard.push([
                        { text: 'Добавить в корзину', callback_data: constants_1.CALLBACK_DATA.ADD_TO_CART_PREFIX + product.id },
                    ]);
                }
                // Добавляем кнопку для просмотра корзины после последнего товара
                if (product === products[products.length - 1]) {
                    keyboard.inline_keyboard.push([
                        { text: 'Перейти в корзину', callback_data: constants_1.CALLBACK_DATA.VIEW_CART },
                    ]);
                }
                // Отправляем сообщение с фото, если оно есть
                if (product.imageUrl) {
                    // Преобразуем относительный путь в полный путь к файлу
                    // Путь к изображению может быть вида /uploads/products/filename.png
                    // Нам нужно добавить путь к директории src/public
                    const fullImagePath = path_1.default.join(__dirname, '..', product.imageUrl);
                    console.log(fullImagePath);
                    // Проверяем существование файла и логируем путь
                    const fileExists = fs_1.default.existsSync(fullImagePath);
                    console.log(`Путь к изображению товара ${product.name}: ${fullImagePath}, файл ${fileExists ? 'существует' : 'не существует'}`);
                    try {
                        await this.bot.sendPhoto(chatId, fullImagePath, {
                            caption: message,
                            parse_mode: 'Markdown',
                            reply_markup: keyboard,
                        });
                    }
                    catch (photoError) {
                        console.error(`Ошибка при отправке фото товара: ${(0, utils_1.formatErrorMessage)(photoError)}`);
                        // Если не удалось отправить фото, отправляем только текст
                        await this.bot.sendMessage(chatId, message, {
                            parse_mode: 'Markdown',
                            reply_markup: keyboard,
                        });
                    }
                }
                else {
                    // Если фото нет, отправляем только текстовое сообщение
                    await this.bot.sendMessage(chatId, message, {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard,
                    });
                }
            }
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, `Ошибка при получении списка товаров: ${errorMessage}`);
        }
    }
    /**
     * Обрабатывает запрос на просмотр деталей товара
     */
    async handleProductDetails(msg, productId) {
        const chatId = msg.chat.id;
        try {
            const product = await this.productService.findById(productId);
            if (!product) {
                await this.bot.sendMessage(chatId, 'Товар не найден.');
                return;
            }
            if (!product.isActive) {
                await this.bot.sendMessage(chatId, 'Товар недоступен для заказа.');
                return;
            }
            let message = `*${product.name}*\n\n${product.description}\n\nЦена: ${product.price} ₽`;
            if (product.stockQuantity > 0) {
                message += `\nВ наличии: ${product.stockQuantity} шт.`;
            }
            else {
                message += '\nНет в наличии';
            }
            const options = {
                parse_mode: 'Markdown',
                reply_markup: (0, keyboards_1.createProductKeyboard)(product),
            };
            if (product.imageUrl) {
                // Преобразуем относительный путь в полный путь к файлу
                const fullImagePath = path_1.default.join(__dirname, '../../..', 'public', product.imageUrl);
                try {
                    await this.bot.sendPhoto(chatId, fullImagePath, {
                        caption: message,
                        parse_mode: 'Markdown',
                        reply_markup: options.reply_markup,
                    });
                }
                catch (photoError) {
                    console.error(`Ошибка при отправке фото товара: ${(0, utils_1.formatErrorMessage)(photoError)}`);
                    // Если не удалось отправить фото, отправляем только текст
                    await this.bot.sendMessage(chatId, message, options);
                }
            }
            else {
                await this.bot.sendMessage(chatId, message, options);
            }
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, `Ошибка при получении информации о товаре: ${errorMessage}`);
        }
    }
    /**
     * Начинает процесс добавления товара в корзину
     */
    async startAddToCartFlow(msg, productId) {
        const chatId = msg.chat.id;
        try {
            const product = await this.productService.findById(productId);
            if (!product) {
                await this.bot.sendMessage(chatId, 'Товар не найден.');
                return;
            }
            if (!product.isActive) {
                await this.bot.sendMessage(chatId, 'Товар недоступен для заказа.');
                return;
            }
            if (product.stockQuantity <= 0) {
                await this.bot.sendMessage(chatId, 'Товар отсутствует на складе.');
                return;
            }
            // Устанавливаем состояние ожидания количества товара
            this.userStateService.setWaitingQuantityState(chatId, productId);
            await this.bot.sendMessage(chatId, constants_1.MESSAGES.ENTER_QUANTITY, { reply_markup: { force_reply: true } });
        }
        catch (error) {
            const errorMessage = (0, utils_1.formatErrorMessage)(error);
            await this.bot.sendMessage(chatId, `Ошибка при добавлении товара в корзину: ${errorMessage}`);
        }
    }
}
exports.ProductHandlers = ProductHandlers;
