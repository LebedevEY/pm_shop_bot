import TelegramBot from 'node-telegram-bot-api';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { getUsernameFromMessage, formatErrorMessage } from '../utils';
import { MESSAGES, USER_STATES } from '../constants';
import { UserState, UserStateService } from '../user-state.service';
import { OrderHandlers } from './order-handlers';
import { CartHandlers } from './cart-handlers';
import { createAfterAddToCartKeyboard } from '../keyboards';

/**
 * Обработчики состояний пользователя
 */
export class StateHandlers {
  constructor(
    private bot: TelegramBot,
    private userStateService: UserStateService,
    private productService: ProductService,
    private cartService: CartService,
    private cartHandlers: CartHandlers,
    private orderHandlers: OrderHandlers,
  ) {}

  /**
   * Обрабатывает сообщения в зависимости от текущего состояния пользователя
   */
  async handleState(msg: TelegramBot.Message, userState: UserState): Promise<void> {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    switch (userState.state) {
      case USER_STATES.WAITING_QUANTITY:
        await this.handleWaitingQuantity(msg, text, userState);
        break;
      case USER_STATES.WAITING_ADDRESS:
        await this.handleWaitingAddress(msg, text);
        break;
      case USER_STATES.WAITING_CONTACT_INFO:
        await this.orderHandlers.handleCreateOrderFromProduct(msg, text);
        break;
      default:
        await this.bot.sendMessage(chatId, MESSAGES.UNKNOWN_COMMAND);
        this.userStateService.deleteState(chatId);
    }
  }

  /**
   * Обрабатывает состояние ожидания количества товара
   */
  private async handleWaitingQuantity(msg: TelegramBot.Message, text: string, userState: UserState): Promise<void> {
    const chatId = msg.chat.id;
    const username = getUsernameFromMessage(msg);

    try {
      // Проверяем, что введено число
      const quantity = parseInt(text, 10);

      if (isNaN(quantity) || quantity <= 0) {
        await this.bot.sendMessage(
          chatId,
          'Пожалуйста, введите корректное количество товара (целое число больше 0)',
        );
        return;
      }

      // Добавляем товар в корзину
      const result = await this.cartService.addToCart(
        username,
        userState.data.productId,
        quantity,
      );

      if (result.success) {
        await this.bot.sendMessage(
          chatId,
          `Товар добавлен в корзину: ${quantity} шт.`,
          {
            reply_markup: createAfterAddToCartKeyboard(),
          },
        );
      } else {
        await this.bot.sendMessage(chatId, result.message);
      }

      this.userStateService.deleteState(chatId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_CART(errorMessage));
      this.userStateService.deleteState(chatId);
    }
  }

  /**
   * Обрабатывает состояние ожидания адреса доставки
   */
  private async handleWaitingAddress(msg: TelegramBot.Message, text: string): Promise<void> {
    await this.orderHandlers.handleCreateOrderFromCart(msg, text);
  }
}
