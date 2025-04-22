import TelegramBot from 'node-telegram-bot-api';
import { ProductService } from '../services/product.service';
import { OrderService } from '../services/order.service';
import { NotificationService } from '../services/notification.service';
import { config } from '../config';

export class TelegramBotService {
  private bot: TelegramBot;

  private userStates: Map<number, { state: string; data: any }> = new Map();

  constructor(
    private readonly productService: ProductService,
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
  ) {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.initHandlers();
  }

  private initHandlers() {
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/products/, this.handleProducts.bind(this));
    this.bot.onText(/\/product_(\w+)/, this.handleProductDetails.bind(this));
    this.bot.onText(/\/order_(\w+)/, this.handleOrderProduct.bind(this));

    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    this.bot.on('message', this.handleMessage.bind(this));
  }

  private async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(
      chatId,
      'Добро пожаловать в наш магазин! Используйте /products для просмотра товаров.',
    );
  }

  private async handleProducts(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const products = await this.productService.findAll({ isActive: true });

    if (products.length === 0) {
      await this.bot.sendMessage(chatId, 'Товары не найдены');
      return;
    }

    let message = 'Доступные товары:\n\n';

    for (const product of products) {
      message += `${product.name} - ${product.price} руб.\n`;
      message += `/product_${product.id} - подробнее\n\n`;
    }

    await this.bot.sendMessage(chatId, message);
  }

  private async handleProductDetails(msg: TelegramBot.Message, match: RegExpExecArray) {
    const chatId = msg.chat.id;
    const productId = match[1];

    const product = await this.productService.findById(productId);

    if (!product) {
      await this.bot.sendMessage(chatId, 'Товар не найден');
      return;
    }

    let message = `*${product.name}*\n\n`;
    message += `${product.description}\n\n`;
    message += `Цена: ${product.price} руб.\n`;
    message += `В наличии: ${product.stockQuantity} шт.\n\n`;

    const keyboard = {
      inline_keyboard: [
        [{ text: 'Заказать', callback_data: `order:${product.id}` }],
      ],
    };

    if (product.imageUrl) {
      await this.bot.sendPhoto(chatId, product.imageUrl, {
        caption: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else {
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  }

  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const chatId = query.message.chat.id;
    const { data } = query;

    if (data.startsWith('order:')) {
      const productId = data.split(':')[1];
      await this.bot.sendMessage(
        chatId,
        `Для заказа товара, пожалуйста, введите /order_${productId}`,
      );
    }
  }

  private async handleOrderProduct(msg: TelegramBot.Message, match: RegExpExecArray) {
    const chatId = msg.chat.id;
    const productId = match[1];

    const product = await this.productService.findById(productId);

    if (!product) {
      await this.bot.sendMessage(chatId, 'Товар не найден');
      return;
    }

    this.userStates.set(chatId, {
      state: 'waiting_contact_info',
      data: { productId, quantity: 1 },
    });

    await this.bot.sendMessage(
      chatId,
      'Пожалуйста, введите ваше имя, адрес доставки и номер телефона в формате:\nИмя: Иван\nАдрес: г. Москва, ул. Примерная, д. 1\nТелефон: +7 999 123-45-67',
    );
  }

  private async handleMessage(msg: TelegramBot.Message) {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userState = this.userStates.get(chatId);

    if (!userState) return;

    if (userState.state === 'waiting_contact_info') {
      try {
        const orderData = {
          productId: userState.data.productId,
          quantity: userState.data.quantity,
          contactInfo: msg.text,
          telegramUserId: chatId.toString(),
        };

        const order = await this.orderService.createOrderFromTelegram(orderData);

        await this.bot.sendMessage(
          chatId,
          `Спасибо! Ваш заказ №${order.id} принят. Мы свяжемся с вами для подтверждения.`,
        );

        await this.notificationService.notifyAdminAboutNewOrder(order);

        this.userStates.delete(chatId);
      } catch (error) {
        await this.bot.sendMessage(
          chatId,
          `Произошла ошибка при оформлении заказа: ${error.message}`,
        );
      }
    }
  }

  async notifyAdmin(message: string) {
    await this.bot.sendMessage(config.telegram.adminChatId, message, { parse_mode: 'Markdown' });
  }
}
