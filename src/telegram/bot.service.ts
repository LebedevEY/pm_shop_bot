import TelegramBot from 'node-telegram-bot-api';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { NotificationService } from '../services/notification.service';
import { createMessageWithUser } from './utils';
import { COMMANDS, CALLBACK_DATA, MESSAGES } from './constants';
import { UserStateService } from './user-state.service';
import { ProductHandlers } from './handlers/product-handlers';
import { CartHandlers } from './handlers/cart-handlers';
import { OrderHandlers } from './handlers/order-handlers';
import { StateHandlers } from './handlers/state-handlers';

/**
 * Основной сервис для работы с Telegram-ботом
 */
export class TelegramBotService {
  private readonly bot: TelegramBot;

  private readonly userStateService: UserStateService;

  private productHandlers: ProductHandlers;

  private readonly cartHandlers: CartHandlers;

  private readonly orderHandlers: OrderHandlers;

  private stateHandlers: StateHandlers;

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private cartService: CartService,
    private notificationService: NotificationService,
    token: string,
  ) {
    this.bot = new TelegramBot(token, { polling: true });
    this.userStateService = new UserStateService();

    // Инициализация обработчиков
    this.productHandlers = new ProductHandlers(this.bot, this.productService, this.userStateService);
    this.cartHandlers = new CartHandlers(this.bot, this.cartService, this.userStateService);
    this.orderHandlers = new OrderHandlers(
      this.bot,
      this.orderService,
      this.cartService,
      this.notificationService,
      this.userStateService,
    );
    this.stateHandlers = new StateHandlers(
      this.bot,
      this.userStateService,
      this.productService,
      this.cartService,
      this.cartHandlers,
      this.orderHandlers,
    );

    this.setupEventHandlers();
    this.setupCommands();
  }

  /**
   * Настраивает обработчики событий бота
   */
  private setupEventHandlers(): void {
    this.bot.on('message', this.handleMessage.bind(this));
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    console.log('Telegram бот запущен и готов к работе!');
  }

  /**
   * Настраивает меню команд бота
   */
  private setupCommands(): void {
    this.bot.setMyCommands([
      { command: COMMANDS.START, description: 'Начать работу с ботом' },
      { command: COMMANDS.PRODUCTS, description: 'Показать список товаров' },
      { command: COMMANDS.CART, description: 'Показать корзину' },
      { command: COMMANDS.CHECKOUT, description: 'Оформить заказ' },
      { command: COMMANDS.HELP, description: 'Помощь' },
    ]);
  }

  /**
   * Обрабатывает входящие сообщения
   */
  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
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
  private async handleCommand(msg: TelegramBot.Message): Promise<void> {
    const command = msg.text?.split(' ')[0];

    switch (command) {
      case COMMANDS.START:
        await this.handleStart(msg);
        break;
      case COMMANDS.PRODUCTS:
        await this.productHandlers.handleProducts(msg);
        break;
      case COMMANDS.CART:
        await this.cartHandlers.handleCart(msg);
        break;
      case COMMANDS.CHECKOUT:
        await this.orderHandlers.handleCheckout(msg);
        break;
      case COMMANDS.HELP:
        await this.handleHelp(msg);
        break;
      default:
        await this.bot.sendMessage(msg.chat.id, MESSAGES.UNKNOWN_COMMAND);
    }
  }

  /**
   * Обрабатывает callback-запросы (нажатия на кнопки)
   */
  private async handleCallbackQuery(query: TelegramBot.CallbackQuery): Promise<void> {
    if (!query.data) return;

    const { data } = query;
    const messageWithUser = createMessageWithUser(query);
    const chatId = query.message?.chat.id;

    if (!chatId) return;

    // Обработка различных типов callback-запросов
    if (data.startsWith(CALLBACK_DATA.PRODUCT_PREFIX)) {
      const productId = data.split(':')[1];
      await this.productHandlers.handleProductDetails(messageWithUser, productId);
    } else if (data === CALLBACK_DATA.BACK_TO_PRODUCTS) {
      await this.productHandlers.handleProducts(messageWithUser);
    } else if (data === CALLBACK_DATA.VIEW_CART) {
      await this.cartHandlers.handleCart(messageWithUser);
    } else if (data === CALLBACK_DATA.CHECKOUT) {
      await this.orderHandlers.handleCheckout(messageWithUser);
    } else if (data.startsWith(CALLBACK_DATA.ADD_TO_CART_PREFIX)) {
      const productId = data.split(':')[1];
      await this.productHandlers.startAddToCartFlow(messageWithUser, productId);
    } else if (data.startsWith(CALLBACK_DATA.REMOVE_FROM_CART_PREFIX)) {
      const cartItemId = data.split(':')[1];
      await this.cartHandlers.handleRemoveFromCart(messageWithUser, cartItemId);
    }

    await this.bot.answerCallbackQuery(query.id);
  }

  /**
   * Обрабатывает команду /start
   */
  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, MESSAGES.WELCOME);
  }

  /**
   * Обрабатывает команду /help
   */
  private async handleHelp(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const helpMessage = [
      '*Доступные команды:*',
      `${COMMANDS.START} - Начать работу с ботом`,
      `${COMMANDS.PRODUCTS} - Показать список товаров`,
      `${COMMANDS.CART} - Показать корзину`,
      `${COMMANDS.CHECKOUT} - Оформить заказ`,
      `${COMMANDS.HELP} - Показать эту справку`,
    ].join('\n');

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Отправляет уведомление администратору
   */
  async notifyAdmin(message: string): Promise<void> {
    try {
      const adminChatId = process.env.ADMIN_CHAT_ID;

      if (!adminChatId) {
        console.error('ADMIN_CHAT_ID не настроен в переменных окружения');
        return;
      }

      await this.bot.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Ошибка при отправке уведомления администратору:', error);
    }
  }
}
