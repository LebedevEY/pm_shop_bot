import TelegramBot from 'node-telegram-bot-api';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { getUsernameFromMessage, formatErrorMessage } from '../utils';
import { MESSAGES } from '../constants';
import { UserStateService } from '../user-state.service';

/**
 * Обработчики команд, связанных с заказами
 */
export class OrderHandlers {
  constructor(
    private bot: TelegramBot,
    private orderService: OrderService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private userStateService: UserStateService,
  ) {}

  /**
   * Обрабатывает команду /checkout - начинает процесс оформления заказа
   */
  async handleCheckout(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const username = getUsernameFromMessage(msg);

    try {
      // Получаем корзину пользователя
      const cart = await this.cartService.getCart(username);

      if (!cart || cart.items.length === 0) {
        await this.bot.sendMessage(chatId, MESSAGES.CART_EMPTY);
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
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, `Ошибка при оформлении заказа: ${errorMessage}`);
    }
  }

  /**
   * Обрабатывает создание заказа из корзины
   */
  async handleCreateOrderFromCart(msg: TelegramBot.Message, address: string): Promise<void> {
    const chatId = msg.chat.id;
    const username = getUsernameFromMessage(msg);

    try {
      // Получаем корзину пользователя
      const cart = await this.cartService.getCart(username);

      if (!cart || cart.items.length === 0) {
        await this.bot.sendMessage(chatId, MESSAGES.CART_EMPTY);
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

      await this.bot.sendMessage(
        chatId,
        MESSAGES.ORDER_CREATED(order.orderNumber || 'без номера'),
      );

      // Уведомляем администратора о новом заказе
      await this.notificationService.notifyAdminAboutNewOrder(order);

      this.userStateService.deleteState(chatId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      console.error(`Ошибка при создании заказа: ${errorMessage}`);
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_ORDER(errorMessage));
      this.userStateService.deleteState(chatId);
    }
  }

  /**
   * Обрабатывает создание заказа напрямую из товара
   */
  async handleCreateOrderFromProduct(msg: TelegramBot.Message, contactInfo: string): Promise<void> {
    const chatId = msg.chat.id;
    const username = getUsernameFromMessage(msg);
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

      await this.bot.sendMessage(
        chatId,
        MESSAGES.ORDER_CREATED(order.orderNumber || 'без номера'),
      );

      await this.notificationService.notifyAdminAboutNewOrder(order);

      this.userStateService.deleteState(chatId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.bot.sendMessage(chatId, MESSAGES.ERROR_ORDER(errorMessage));
      this.userStateService.deleteState(chatId);
    }
  }
}
