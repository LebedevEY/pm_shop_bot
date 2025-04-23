import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import fs from 'fs';
import { ProductService } from '../../services/product.service';
import { getUsernameFromMessage, formatErrorMessage } from '../utils';
import { MESSAGES, CALLBACK_DATA } from '../constants';
import { createProductKeyboard, createProductsListKeyboard } from '../keyboards';
import { UserStateService } from '../user-state.service';

/**
 * Обработчики команд, связанных с товарами
 */
export class ProductHandlers {
  constructor(
    private bot: TelegramBot,
    private productService: ProductService,
    private userStateService: UserStateService,
  ) {}

  /**
   * Обрабатывает команду /products - показывает список товаров с фото и информацией
   */
  async handleProducts(msg: TelegramBot.Message): Promise<void> {
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
        const nameText = '*' + product.name + '*';
        const descriptionText = product.description;
        const priceText = 'Цена: ' + product.price + ' ₽';
        
        let stockText = '';
        if (product.stockQuantity > 0) {
          stockText = 'В наличии: ' + product.stockQuantity + ' шт.';
        } else {
          stockText = 'Нет в наличии';
        }
        
        // Формируем сообщение, избегая многострочных строк
        let message = nameText;
        message = message + '\n\n' + descriptionText;
        message = message + '\n\n' + priceText;
        message = message + '\n' + stockText;
        
        // Создаем клавиатуру с кнопкой добавления в корзину
        const keyboard: TelegramBot.InlineKeyboardMarkup = {
          inline_keyboard: []
        };
        
        // Добавляем кнопку добавления в корзину, если товар в наличии
        if (product.stockQuantity > 0) {
          keyboard.inline_keyboard.push([
            { text: 'Добавить в корзину', callback_data: CALLBACK_DATA.ADD_TO_CART_PREFIX + product.id }
          ]);
        }
        
        // Добавляем кнопку для просмотра корзины после последнего товара
        if (product === products[products.length - 1]) {
          keyboard.inline_keyboard.push([
            { text: 'Перейти в корзину', callback_data: CALLBACK_DATA.VIEW_CART }
          ]);
        }
        
        // Отправляем сообщение с фото, если оно есть
        if (product.imageUrl) {
          // Преобразуем относительный путь в полный путь к файлу
          // Путь к изображению может быть вида /uploads/products/filename.png
          // Нам нужно добавить путь к директории src/public
          let fullImagePath = '';
          
          if (product.imageUrl && product.imageUrl.startsWith('/')) {
            // Если путь начинается с /, то это относительный путь от корня public
            fullImagePath = path.join(__dirname, '../../../src/public', product.imageUrl);
          } else if (product.imageUrl) {
            // Иначе просто добавляем путь к директории uploads/products
            fullImagePath = path.join(__dirname, '../../../src/public/uploads/products', product.imageUrl);
          } else {
            // Если путь не указан, используем путь к тестовому изображению
            fullImagePath = path.join(__dirname, '../../../src/public/uploads/products/product-1745390311258-166903368.png');
          }
          
          // Проверяем существование файла и логируем путь
          const fileExists = fs.existsSync(fullImagePath);
          console.log(`Путь к изображению товара ${product.name}: ${fullImagePath}, файл ${fileExists ? 'существует' : 'не существует'}`);
          
          // Если файл не существует, попробуем использовать тестовое изображение
          if (!fileExists && product.imageUrl) {
            fullImagePath = path.join(__dirname, '../../../src/public/uploads/products/product-1745390311258-166903368.png');
            console.log(`Используем тестовое изображение: ${fullImagePath}`);
          }
          
          try {
            await this.bot.sendPhoto(chatId, fullImagePath, {
              caption: message,
              parse_mode: 'Markdown',
              reply_markup: keyboard,
            });
          } catch (photoError) {
            console.error('Ошибка при отправке фото товара: ' + formatErrorMessage(photoError));
            // Если не удалось отправить фото, отправляем только текст
            await this.bot.sendMessage(chatId, message, { 
              parse_mode: 'Markdown',
              reply_markup: keyboard,
            });
          }
        } else {
          // Если фото нет, отправляем только текстовое сообщение
          await this.bot.sendMessage(chatId, message, { 
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          });
        }
      }
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, 'Ошибка при получении списка товаров: ' + errorMessage);
    }
  }

  /**
   * Обрабатывает запрос на просмотр деталей товара
   */
  async handleProductDetails(msg: TelegramBot.Message, productId: string): Promise<void> {
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
      } else {
        message += '\nНет в наличии';
      }
      
      const options: TelegramBot.SendMessageOptions = {
        parse_mode: 'Markdown',
        reply_markup: createProductKeyboard(product),
      };
      
      if (product.imageUrl) {
        // Преобразуем относительный путь в полный путь к файлу
        const fullImagePath = path.join(__dirname, '../../..', 'public', product.imageUrl);
        
        try {
          await this.bot.sendPhoto(chatId, fullImagePath, {
            caption: message,
            parse_mode: 'Markdown',
            reply_markup: options.reply_markup,
          });
        } catch (photoError) {
          console.error(`Ошибка при отправке фото товара: ${formatErrorMessage(photoError)}`);
          // Если не удалось отправить фото, отправляем только текст
          await this.bot.sendMessage(chatId, message, options);
        }
      } else {
        await this.bot.sendMessage(chatId, message, options);
      }
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, `Ошибка при получении информации о товаре: ${errorMessage}`);
    }
  }

  /**
   * Начинает процесс добавления товара в корзину
   */
  async startAddToCartFlow(msg: TelegramBot.Message, productId: string): Promise<void> {
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
      
      await this.bot.sendMessage(
        chatId,
        MESSAGES.ENTER_QUANTITY,
        { reply_markup: { force_reply: true } },
      );
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, `Ошибка при добавлении товара в корзину: ${errorMessage}`);
    }
  }
}
