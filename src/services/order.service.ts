import { Repository } from 'typeorm';
import {
  Order, OrderStatus, Product, OrderItem, User,
} from '../entities';

interface CreateOrderDto {
  userId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: string;
  contactPhone: string;
}

interface CreateOrderFromTelegramDto {
  productId: string;
  quantity: number;
  contactInfo: string;
  username: string;
}

interface CreateOrderFromCartDto {
  username: string;
  address: string;
}

export class OrderService {
  constructor(
    private orderRepository: Repository<Order>,
    private orderItemRepository: Repository<OrderItem>,
    private productRepository: Repository<Product>,
    private userRepository: Repository<User>,
  ) {}

  private async generateUniqueOrderNumber(): Promise<string> {
    let isUnique = false;
    let orderNumber = '';

    while (!isUnique) {
      // Генерируем 8-значный номер
      orderNumber = Math.floor(10000000 + Math.random() * 90000000).toString().substring(0, 8);

      // Проверяем уникальность
      const existingOrder = await this.orderRepository.findOne({ where: { orderNumber } });
      if (!existingOrder) {
        isUnique = true;
      }
    }

    return orderNumber;
  }

  async findAll(filters?: { status?: OrderStatus; userId?: string }): Promise<Order[]> {
    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('order.user', 'user');

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      query.andWhere('order.userId = :userId', { userId: filters.userId });
    }

    return query.orderBy('order.createdAt', 'DESC').getMany();
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['orderItems', 'orderItems.product', 'user'],
    });
  }

  async create(orderData: CreateOrderDto): Promise<Order> {
    const products = await Promise.all(
      orderData.items.map((item) => this.productRepository.findOne({ where: { id: item.productId } })),
    );

    const totalAmount = orderData.items.reduce((sum, item, index) => {
      const product = products[index];
      if (!product) throw new Error(`Товар с ID ${item.productId} не найден`);
      if (product.stockQuantity < item.quantity) {
        throw new Error(`Недостаточно товара ${product.name} на складе`);
      }
      return sum + (product.price * item.quantity);
    }, 0);

    // Генерируем уникальный номер заказа
    const orderNumber = await this.generateUniqueOrderNumber();

    const order = this.orderRepository.create({
      userId: orderData.userId,
      orderNumber, // Добавляем номер заказа
      status: OrderStatus.PENDING,
      totalAmount,
      shippingAddress: orderData.shippingAddress,
      contactPhone: orderData.contactPhone,
    });

    const savedOrder = await this.orderRepository.save(order);

    const orderItems = orderData.items.map((item, index) => {
      const product = products[index];
      if (!product) throw new Error(`Товар с ID ${item.productId} не найден`);

      return this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    });

    await this.orderItemRepository.save(orderItems);

    await Promise.all(orderData.items.map(async (item, index) => {
      const product = products[index];
      if (!product) return;

      product.stockQuantity -= item.quantity;
      await this.productRepository.save(product);
    }));

    return this.findById(savedOrder.id) as Promise<Order>;
  }

  async createOrderFromTelegram(orderData: CreateOrderFromTelegramDto): Promise<Order> {
    // Проверяем, есть ли пользователь с таким именем
    let user = await this.userRepository.findOne({ where: { username: orderData.username } });

    if (!user) {
      // Создаем временного пользователя для заказа
      user = await this.userRepository.save({
        username: orderData.username,
        email: `${orderData.username.replace(/\s+/g, '_')}@telegram.com`,
        password: Math.random().toString(36).slice(-8),
        telegramId: orderData.username, // Используем имя пользователя как telegramId
      });
    }

    const product = await this.productRepository.findOne({ where: { id: orderData.productId } });

    if (!product) {
      throw new Error(`Товар с ID ${orderData.productId} не найден`);
    }

    if (product.stockQuantity < orderData.quantity) {
      throw new Error(`Недостаточно товара ${product.name} на складе`);
    }

    const contactInfo = this.parseContactInfo(orderData.contactInfo);

    const totalAmount = product.price * orderData.quantity;

    // Генерируем уникальный номер заказа
    const orderNumber = await this.generateUniqueOrderNumber();

    const order = this.orderRepository.create({
      userId: orderData.username, // Используем имя пользователя вместо Telegram ID
      orderNumber, // Добавляем номер заказа
      status: OrderStatus.PENDING,
      totalAmount,
      shippingAddress: contactInfo.address,
      contactPhone: contactInfo.phone,
    });

    const savedOrder = await this.orderRepository.save(order);

    const orderItem = this.orderItemRepository.create({
      orderId: savedOrder.id,
      productId: orderData.productId,
      quantity: orderData.quantity,
      price: product.price,
    });

    await this.orderItemRepository.save(orderItem);

    product.stockQuantity -= orderData.quantity;
    await this.productRepository.save(product);

    return this.findById(savedOrder.id) as Promise<Order>;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    await this.orderRepository.update(id, { status });
    return this.findById(id);
  }

  private parseContactInfo(contactInfo: string): { name: string; address: string; phone: string } {
    const nameMatch = contactInfo.match(/Имя:\s*(.+)/i);
    const addressMatch = contactInfo.match(/Адрес:\s*(.+)/i);
    const phoneMatch = contactInfo.match(/Телефон:\s*(.+)/i);

    return {
      name: nameMatch ? nameMatch[1].trim() : '',
      address: addressMatch ? addressMatch[1].trim() : '',
      phone: phoneMatch ? phoneMatch[1].trim() : '',
    };
  }

  async createOrderFromCart(orderData: CreateOrderFromCartDto): Promise<Order> {
    console.log(`Создание заказа из корзины для пользователя: ${orderData.username}`);

    // Проверяем, есть ли пользователь с таким именем
    let user = await this.userRepository.findOne({ where: { username: orderData.username } });

    if (!user) {
      // Создаем временного пользователя для заказа
      user = await this.userRepository.save({
        username: orderData.username,
        email: `${orderData.username.replace(/\s+/g, '_')}@telegram.com`,
        password: Math.random().toString(36).slice(-8),
        telegramId: orderData.username, // Используем имя пользователя как telegramId
      });
      console.log(`Создан новый пользователь для Telegram: ${orderData.username}`);
    }

    // Получаем репозитории для работы с корзиной
    const cartRepository = this.orderRepository.manager.getRepository('Cart');

    // Получаем корзину пользователя
    const cart = await cartRepository.findOne({
      where: { userId: orderData.username, isCompleted: false },
      relations: ['items', 'items.product'],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Корзина пуста или не найдена');
    }

    // Рассчитываем общую сумму заказа
    let totalAmount = 0;
    for (const item of cart.items) {
      totalAmount += Number(item.price) * item.quantity;
    }

    // Генерируем уникальный номер заказа
    const orderNumber = await this.generateUniqueOrderNumber();

    // Создаем заказ
    const order = this.orderRepository.create({
      userId: orderData.username,
      orderNumber, // Добавляем номер заказа
      status: OrderStatus.PENDING,
      totalAmount,
      shippingAddress: orderData.address,
      contactPhone: 'Не указан',
    });

    const savedOrder = await this.orderRepository.save(order);
    console.log(`Создан заказ №${savedOrder.id} для пользователя: ${orderData.username}`);

    // Добавляем товары в заказ
    for (const item of cart.items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });

      if (!product) {
        console.error(`Товар с ID ${item.productId} не найден`);
        continue;
      }

      if (product.stockQuantity < item.quantity) {
        console.error(`Недостаточно товара ${product.name} на складе`);
        continue;
      }

      // Создаем элемент заказа
      const orderItem = this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
      });

      await this.orderItemRepository.save(orderItem);
      console.log(`Добавлен товар ${product.name} (${item.quantity} шт.) в заказ №${savedOrder.id}`);

      // Уменьшаем количество товара на складе
      product.stockQuantity -= item.quantity;
      await this.productRepository.save(product);
    }

    // Возвращаем заказ с полной информацией
    const createdOrder = await this.findById(savedOrder.id);
    if (!createdOrder) {
      throw new Error(`Не удалось найти созданный заказ №${savedOrder.id}`);
    }

    return createdOrder;
  }
}
