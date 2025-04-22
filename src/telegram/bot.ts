import TelegramBot from 'node-telegram-bot-api';
import { ProductService } from '../services/product.service';
import { OrderService } from '../services/order.service';
import { NotificationService } from '../services/notification.service';
import { CartService } from '../services/cart.service';
import { Cart, CartItem } from '../entities';
import { config } from '../config';

export class TelegramBotService {
  private bot: TelegramBot;

  private userStates: Map<number, { state: string; data: any }> = new Map();

  constructor(
    private readonly productService: ProductService,
    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
    private readonly cartService: CartService,
  ) {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.initHandlers();
    this.setupCommandMenu();
  }

  private async setupCommandMenu() {
    await this.bot.setMyCommands([
      { command: '/products', description: 'Показать список товаров' },
      { command: '/cart', description: 'Показать корзину' }
    ]);
  }

  private initHandlers() {
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/products/, this.handleProducts.bind(this));
    this.bot.onText(/\/cart/, this.handleCart.bind(this));
    this.bot.onText(/\/checkout/, this.handleCheckout.bind(this));
    this.bot.onText(/\/remove_(\w+)/, this.handleRemoveFromCart.bind(this));

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

    await this.bot.sendMessage(chatId, '*Доступные товары:*', { parse_mode: 'Markdown' });

    // Отправляем каждый товар отдельным сообщением с изображением
    for (const product of products) {
      let message = `*${product.name}*
`;
      message += `Цена: *${Number(product.price).toFixed(2)} руб.*

`;

      if (product.description) {
        message += `${product.description}

`;
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: 'Заказать', callback_data: `add_to_cart:${product.id}` }],
        ],
      };

      if (product.imageUrl) {
        // Формируем путь к локальному файлу
        const fs = require('fs');
        const path = require('path');
        const localFilePath = path.join(__dirname, '..', 'public', product.imageUrl);
        
        try {
          // Проверяем существование файла
          if (fs.existsSync(localFilePath)) {
            // Отправляем файл напрямую
            await this.bot.sendPhoto(chatId, fs.createReadStream(localFilePath), {
              caption: message,
              parse_mode: 'Markdown',
              reply_markup: keyboard,
            });
          } else {
            console.error('Файл изображения не найден:', localFilePath);
            await this.bot.sendMessage(chatId, message, {
              parse_mode: 'Markdown',
              reply_markup: keyboard,
            });
          }
        } catch (error) {
          console.error('Ошибка при отправке изображения:', error);
          // Если не удалось отправить изображение, отправляем текстовое сообщение
          await this.bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          });
        }
      } else {
        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      }
    }
  }



  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    if (!query.message || !query.data) {
      return;
    }
    const chatId = query.message.chat.id;
    const { data } = query;

    if (data.startsWith('add_to_cart:')) {
      // Формат: add_to_cart:productId
      const productId = data.split(':')[1];
      // Запрашиваем количество товара для добавления в корзину
      this.userStates.set(chatId, {
        state: 'waiting_quantity',
        data: { productId }
      });
      await this.bot.sendMessage(
        chatId,
        'Введите количество товара:',
        { reply_markup: { force_reply: true } }
      );

    } else if (data === 'back_to_products') {
      // Имитируем команду /products
      await this.handleProducts({ ...query.message } as TelegramBot.Message);
    } else if (data === 'view_cart') {
      // Имитируем команду /cart
      await this.handleCart({ ...query.message } as TelegramBot.Message);
    } else if (data === 'checkout') {
      // Имитируем команду /checkout
      await this.handleCheckout({ ...query.message } as TelegramBot.Message);
    } else if (data.startsWith('remove_from_cart:')) {
      // Формат: remove_from_cart:cartItemId
      const cartItemId = data.split(':')[1];
      
      try {
        // Удаляем товар из корзины
        const result = await this.cartService.removeFromCart(chatId.toString(), cartItemId);
        
        if (result.success) {
          await this.bot.sendMessage(chatId, result.message);
          
          // Если мы находимся в режиме редактирования корзины, возвращаемся к нему
          if (data.includes('edit_cart')) {
            await this.handleEditCart({ ...query.message } as TelegramBot.Message);
          } else {
            // Иначе показываем обновленную корзину
            await this.handleCart({ ...query.message } as TelegramBot.Message);
          }
        } else {
          await this.bot.sendMessage(chatId, result.message);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        await this.bot.sendMessage(
          chatId,
          `Произошла ошибка при удалении товара из корзины: ${errorMessage}`
        );
      }
    } else if (data === 'confirm_order') {
      this.userStates.set(chatId, {
        state: 'waiting_address',
        data: {}
      });
      await this.bot.sendMessage(
        chatId,
        'Пожалуйста, введите адрес доставки:',
        { reply_markup: { force_reply: true } }
      );
    } else if (data === 'cancel_order') {
      await this.bot.sendMessage(
        chatId,
        'Заказ отменен. Используйте /products для просмотра товаров.'
      );
    } else if (data === 'edit_cart') {
      // Обрабатываем нажатие на кнопку 'Редактировать корзину'
      await this.handleEditCart({ ...query.message } as TelegramBot.Message);
    } else if (data.startsWith('edit_item_quantity:')) {
      // Формат: edit_item_quantity:cartItemId
      const cartItemId = data.split(':')[1];
      // Запрашиваем новое количество товара
      this.userStates.set(chatId, {
        state: 'waiting_new_quantity',
        data: { cartItemId }
      });
      await this.bot.sendMessage(
        chatId,
        'Введите новое количество товара:',
        { reply_markup: { force_reply: true } }
      );
    }
  }

  private async handleCart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    
    // Получаем имя пользователя из сообщения Telegram
    const username = msg.from?.username || msg.from?.first_name || `user_${chatId}`;
    
    // Получаем корзину пользователя
    const cart = await this.cartService.getCart(username);
    
    if (!cart || cart.items.length === 0) {
      await this.bot.sendMessage(
        chatId,
        'Ваша корзина пуста. Используйте /products для просмотра товаров.'
      );
      return;
    }
    
    try {
      // Формируем сообщение с содержимым корзины без использования Markdown
      let message = 'Ваша корзина:\n\n';    
      let totalAmount = 0;
      
      for (const item of cart.items) {
        const itemTotal = Number(item.price) * item.quantity;
        totalAmount += itemTotal;
        
        message += `${item.product.name}\n`;
        message += `Цена: ${Number(item.price).toFixed(2)} руб. x ${item.quantity} = ${itemTotal.toFixed(2)} руб.\n`;
      }
      
      message += `\nИтого: ${totalAmount.toFixed(2)} руб.`;
      
      // Создаем кнопки для оформления заказа, редактирования корзины или продолжения покупок
      const keyboard = {
        inline_keyboard: [
          [{ text: 'Оформить заказ', callback_data: 'checkout' }],
          [{ text: 'Редактировать корзину', callback_data: 'edit_cart' }],
          [{ text: 'Продолжить покупки', callback_data: 'back_to_products' }]
        ]
      };
      
      // Отправляем сообщение без использования Markdown
      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error(`Ошибка при отображении корзины: ${error}`);
      await this.bot.sendMessage(chatId, 'Произошла ошибка при отображении корзины. Попробуйте позже.');
    }
  }

  private async handleEditCart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    
    // Получаем имя пользователя из сообщения Telegram
    const username = msg.from?.username || msg.from?.first_name || `user_${chatId}`;
    
    // Получаем корзину пользователя
    const cart = await this.cartService.getCart(username);
    
    if (!cart || cart.items.length === 0) {
      await this.bot.sendMessage(
        chatId,
        'Ваша корзина пуста. Используйте /products для просмотра товаров.'
      );
      return;
    }
    
    await this.bot.sendMessage(
      chatId,
      'Выберите товар для редактирования:'
    );
    
    // Отправляем каждый товар отдельным сообщением с кнопками для удаления и изменения количества
    for (const item of cart.items) {
      const itemTotal = Number(item.price) * item.quantity;
      
      let message = `${item.product.name}
`;
      message += `Цена: ${Number(item.price).toFixed(2)} руб. x ${item.quantity} = ${itemTotal.toFixed(2)} руб.`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: 'Удалить', callback_data: `remove_from_cart:${item.id}` },
            { text: 'Изменить количество', callback_data: `edit_item_quantity:${item.id}` }
          ]
        ]
      };
      
      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard
      });
    }
    
    // Добавляем кнопку для возврата к корзине
    await this.bot.sendMessage(
      chatId,
      'Для возврата к корзине используйте команду /cart',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Вернуться к корзине', callback_data: 'view_cart' }]
          ]
        }
      }
    );
  }
  
  private async handleRemoveFromCart(msg: TelegramBot.Message, match: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    
    if (!match) {
      await this.bot.sendMessage(chatId, 'Ошибка: неверный формат команды');
      return;
    }
    
    const cartItemId = match[1];
    
    // Удаляем товар из корзины
    const result = await this.cartService.removeFromCart(chatId.toString(), cartItemId);
    
    if (!result.success) {
      await this.bot.sendMessage(chatId, result.message);
      return;
    }
    
    await this.bot.sendMessage(chatId, result.message);
    
    // Показываем обновленную корзину
    await this.handleCart(msg);
  }

  private async handleCheckout(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    
    // Получаем корзину пользователя
    const cart = await this.cartService.getCart(chatId.toString());
    
    if (!cart || cart.items.length === 0) {
      await this.bot.sendMessage(
        chatId,
        'Ваша корзина пуста. Используйте /products для просмотра товаров.'
      );
      return;
    }
    
    // Формируем сообщение с информацией о заказе
    let message = '*Информация о заказе:*\n\n';    
    let totalAmount = 0;
    
    for (const item of cart.items) {
      const itemTotal = Number(item.price) * item.quantity;
      totalAmount += itemTotal;
      
      message += `${item.product.name} - ${item.quantity} шт. x ${Number(item.price).toFixed(2)} руб. = ${itemTotal.toFixed(2)} руб.
`;
    }
    
    message += `
*Итого: ${totalAmount.toFixed(2)} руб.*

`;
    message += 'Пожалуйста, подтвердите заказ или вернитесь к корзине для внесения изменений.';
    
    // Создаем кнопки для подтверждения или отмены заказа
    const keyboard = {
      inline_keyboard: [
        [{ text: 'Подтвердить заказ', callback_data: 'confirm_order' }],
        [{ text: 'Вернуться к корзине', callback_data: 'view_cart' }],
        [{ text: 'Отменить заказ', callback_data: 'cancel_order' }]
      ]
    };
    
    await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleOrderProduct(msg: TelegramBot.Message, match: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    if (!match) {
      await this.bot.sendMessage(chatId, 'Ошибка: неверный формат команды');
      return;
    }
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

    if (userState.state === 'waiting_quantity') {
      // Проверяем, что введено число
      const quantity = parseInt(msg.text);
      
      if (isNaN(quantity) || quantity <= 0) {
        await this.bot.sendMessage(
          chatId,
          'Пожалуйста, введите корректное количество товара (целое число больше 0)'
        );
        return;
      }
      
      // Получаем имя пользователя из сообщения Telegram
      const username = msg.from?.username || msg.from?.first_name || `user_${chatId}`;
      
      // Добавляем товар в корзину
      const result = await this.cartService.addToCart(
        username,
        userState.data.productId,
        quantity
      );
      
      if (result.success) {
        await this.bot.sendMessage(
          chatId,
          `Товар добавлен в корзину: ${quantity} шт.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Перейти в корзину', callback_data: 'view_cart' }],
                [{ text: 'Продолжить покупки', callback_data: 'back_to_products' }]
              ]
            }
          }
        );
      } else {
        await this.bot.sendMessage(
          chatId,
          result.message
        );
      }
      
      // Сбрасываем состояние пользователя
      this.userStates.delete(chatId);
    } else if (userState.state === 'waiting_new_quantity') {
      // Проверяем, что введено число
      const quantity = parseInt(msg.text);
      
      if (isNaN(quantity) || quantity <= 0) {
        await this.bot.sendMessage(
          chatId,
          'Пожалуйста, введите корректное количество товара (целое число больше 0)'
        );
        return;
      }
      
      // Получаем имя пользователя из сообщения Telegram
      const username = msg.from?.username || msg.from?.first_name || `user_${chatId}`;
      
      // Получаем корзину пользователя
      const cart = await this.cartService.getCart(username);
      
      if (!cart) {
        await this.bot.sendMessage(
          chatId,
          'Корзина не найдена'
        );
        this.userStates.delete(chatId);
        return;
      }
      
      // Находим элемент корзины
      const cartItemId = userState.data.cartItemId;
      const cartItem = cart.items.find(item => item.id === cartItemId);
      
      if (!cartItem) {
        await this.bot.sendMessage(
          chatId,
          'Товар не найден в корзине'
        );
        this.userStates.delete(chatId);
        return;
      }
      
      try {
        // Обновляем количество товара в корзине
        // Для этого сначала удаляем товар из корзины, а затем добавляем его с новым количеством
        await this.cartService.removeFromCart(username, cartItemId);
        
        const result = await this.cartService.addToCart(
          username,
          cartItem.productId,
          quantity
        );
        
        if (result.success) {
          await this.bot.sendMessage(
            chatId,
            `Количество товара изменено на ${quantity} шт.`
          );
          
          // Показываем обновленную корзину
          await this.handleCart(msg);
        } else {
          await this.bot.sendMessage(
            chatId,
            result.message
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        await this.bot.sendMessage(
          chatId,
          `Произошла ошибка при изменении количества товара: ${errorMessage}`
        );
      }
      
      // Сбрасываем состояние пользователя
      this.userStates.delete(chatId);
    } else if (userState.state === 'waiting_address') {
      try {
        // Получаем имя пользователя из сообщения Telegram
        const username = msg.from?.username || msg.from?.first_name || `user_${chatId}`;
        
        // Получаем корзину пользователя
        const cart = await this.cartService.getCart(username);
        
        if (!cart || cart.items.length === 0) {
          await this.bot.sendMessage(
            chatId,
            'Ваша корзина пуста. Используйте /products для просмотра товаров.'
          );
          this.userStates.delete(chatId);
          return;
        }
        
        // Создаем заказ на основе корзины
        const order = await this.orderService.createOrderFromCart({
          telegramUserId: chatId.toString(),
          username: username,
          address: msg.text
        });
        
        // Очищаем корзину после создания заказа
        await this.cartService.clearCart(username);
        
        await this.bot.sendMessage(
          chatId,
          `Спасибо! Ваш заказ №${order.id} принят. Мы свяжемся с вами для подтверждения.`
        );
        
        // Уведомляем администратора о новом заказе
        await this.notificationService.notifyAdminAboutNewOrder(order);
        
        this.userStates.delete(chatId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        console.error(`Ошибка при создании заказа: ${errorMessage}`);
        await this.bot.sendMessage(
          chatId,
          `Произошла ошибка при оформлении заказа: ${errorMessage}`
        );
        this.userStates.delete(chatId);
      }
    } else if (userState.state === 'waiting_contact_info') {
      try {
        // Получаем имя пользователя из сообщения Telegram
        const username = msg.from?.username || msg.from?.first_name || `user_${chatId}`;
        
        const orderData = {
          productId: userState.data.productId,
          quantity: userState.data.quantity,
          contactInfo: msg.text,
          telegramUserId: chatId.toString(),
          username: username,
        };

        const order = await this.orderService.createOrderFromTelegram(orderData);

        await this.bot.sendMessage(
          chatId,
          `Спасибо! Ваш заказ №${order.id} принят. Мы свяжемся с вами для подтверждения.`
        );

        await this.notificationService.notifyAdminAboutNewOrder(order);

        this.userStates.delete(chatId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        await this.bot.sendMessage(
          chatId,
          `Произошла ошибка при оформлении заказа: ${errorMessage}`
        );
      }
    }
  }

  async notifyAdmin(message: string) {
    await this.bot.sendMessage(config.telegram.adminChatId, message, { parse_mode: 'Markdown' });
  }
}
