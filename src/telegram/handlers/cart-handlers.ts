import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import fs from 'fs';
import { CartService } from '../../services/cart.service';
import { getUsernameFromMessage, formatErrorMessage } from '../utils';
import { MESSAGES } from '../constants';
import { createCartKeyboard, createCartItemKeyboard } from '../keyboards';
import { UserStateService } from '../user-state.service';

/**
 * Обработчики команд, связанных с корзиной
 */
export class CartHandlers {
  constructor(
    private bot: TelegramBot,
    private cartService: CartService,
    private userStateService: UserStateService,
  ) {}

  /**
   * Обрабатывает команду /cart - показывает содержимое корзины
   */
  async handleCart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const username = getUsernameFromMessage(msg);
    
    try {
      const cart = await this.cartService.getCart(username);
      
      if (!cart || cart.items.length === 0) {
        await this.bot.sendMessage(chatId, MESSAGES.CART_EMPTY);
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
          // Путь к изображению может быть вида /uploads/products/filename.png
          // Нам нужно добавить путь к директории src/public
          let fullImagePath = '';
          
          if (item.product.imageUrl && item.product.imageUrl.startsWith('/')) {
            // Если путь начинается с /, то это относительный путь от корня public
            fullImagePath = path.join(__dirname, '../../../src/public', item.product.imageUrl);
          } else if (item.product.imageUrl) {
            // Иначе просто добавляем путь к директории uploads/products
            fullImagePath = path.join(__dirname, '../../../src/public/uploads/products', item.product.imageUrl);
          } else {
            // Если путь не указан, используем путь к тестовому изображению
            fullImagePath = path.join(__dirname, '../../../src/public/uploads/products/product-1745390311258-166903368.png');
          }
          
          // Проверяем существование файла и логируем путь
          const fileExists = fs.existsSync(fullImagePath);
          console.log(`Путь к изображению товара в корзине ${item.product.name}: ${fullImagePath}, файл ${fileExists ? 'существует' : 'не существует'}`);
          
          // Если файл не существует, попробуем использовать тестовое изображение
          if (!fileExists && item.product.imageUrl) {
            fullImagePath = path.join(__dirname, '../../../src/public/uploads/products/product-1745390311258-166903368.png');
            console.log(`Используем тестовое изображение: ${fullImagePath}`);
          }
          
          try {
            // Формируем сообщение для товара в корзине, избегая многострочных строк
            let itemCaption = item.product.name;
            itemCaption = itemCaption + '\nЦена: ' + Number(item.price).toFixed(2) + ' ₽';
            itemCaption = itemCaption + '\nКоличество: ' + item.quantity;
            itemCaption = itemCaption + '\nИтого: ' + itemTotal.toFixed(2) + ' ₽';
            
            await this.bot.sendPhoto(chatId, fullImagePath, {
              caption: itemCaption,
              reply_markup: createCartItemKeyboard(item.id),
            });
          } catch (photoError) {
            console.error(`Ошибка при отправке фото товара в корзине: ${formatErrorMessage(photoError)}`);
            // Если не удалось отправить фото, отправляем только информацию о товаре в общем сообщении
          }
        }
      }
      
      message += `*Общая сумма: ${totalAmount.toFixed(2)} ₽*`;
      
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: createCartKeyboard(),
      });
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_CART(errorMessage));
    }
  }

  /**
   * Обрабатывает удаление товара из корзины
   */
  async handleRemoveFromCart(msg: TelegramBot.Message, cartItemId: string): Promise<void> {
    const chatId = msg.chat.id;
    const username = getUsernameFromMessage(msg);
    
    try {
      const result = await this.cartService.removeFromCart(username, cartItemId);
      
      if (!result.success) {
        await this.bot.sendMessage(chatId, result.message);
        return;
      }
      
      await this.bot.sendMessage(chatId, MESSAGES.PRODUCT_REMOVED);
      
      // Показываем обновленную корзину
      await this.handleCart(msg);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_CART(errorMessage));
    }
  }

  /**
   * Обрабатывает добавление товара в корзину
   */
  async handleAddToCart(msg: TelegramBot.Message, productId: string, quantity: number): Promise<void> {
    const chatId = msg.chat.id;
    const username = getUsernameFromMessage(msg);
    
    try {
      const result = await this.cartService.addToCart(username, productId, quantity);
      
      if (!result.success) {
        await this.bot.sendMessage(chatId, result.message);
        return;
      }
      
      await this.bot.sendMessage(
        chatId,
        MESSAGES.PRODUCT_ADDED(quantity),
        { reply_markup: createCartKeyboard() },
      );
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_CART(errorMessage));
    }
  }

  /**
   * Обрабатывает очистку корзины
   */
  async handleClearCart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const username = getUsernameFromMessage(msg);
    
    try {
      const success = await this.cartService.clearCart(username);
      
      if (success) {
        await this.bot.sendMessage(chatId, MESSAGES.CART_CLEARED);
      } else {
        await this.bot.sendMessage(chatId, MESSAGES.CART_EMPTY);
      }
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_CART(errorMessage));
    }
  }
}
