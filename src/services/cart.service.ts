import { Repository } from 'typeorm';
import { Cart, CartItem, Product } from '../entities';

export class CartService {
  constructor(
    private readonly cartRepository: Repository<Cart>,
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly productRepository: Repository<Product>,
  ) {}

  async getOrCreateCart(username: string): Promise<Cart> {
    if (!username) {
      throw new Error('Не указано имя пользователя');
    }
    
    // Ищем активную корзину пользователя
    let cart = await this.cartRepository.findOne({
      where: { userId: username, isCompleted: false },
      relations: ['items', 'items.product'],
    });

    // Если корзины нет, создаем новую
    if (!cart) {
      cart = this.cartRepository.create({ userId: username });
      await this.cartRepository.save(cart);
      console.log(`Создана новая корзина для пользователя: ${username}`);
    }

    return cart;
  }

  async addToCart(username: string, productId: string, quantity: number): Promise<{ success: boolean; message: string; cart?: Cart | null }> {
    // Проверяем наличие обязательных параметров
    if (!username) {
      return { success: false, message: 'Не указано имя пользователя' };
    }
    
    if (!productId) {
      return { success: false, message: 'Не указан ID товара' };
    }
    
    if (!quantity || quantity <= 0) {
      return { success: false, message: 'Указано некорректное количество товара' };
    }
    
    console.log(`Попытка добавления товара в корзину: username=${username}, productId=${productId}, quantity=${quantity}`);
    
    // Проверяем наличие товара и его количество
    const product = await this.productRepository.findOne({ where: { id: productId } });
    
    if (!product) {
      return { success: false, message: 'Товар не найден' };
    }
    
    if (!product.isActive) {
      return { success: false, message: 'Товар недоступен для заказа' };
    }
    
    if (product.stockQuantity < quantity) {
      return { 
        success: false, 
        message: `Недостаточно товара. Доступно: ${product.stockQuantity} шт.` 
      };
    }
    
    try {
      // Получаем или создаем корзину
      const cart = await this.getOrCreateCart(username);
      console.log(`Добавление товара в корзину для пользователя: ${username}, товар ID: ${productId}, количество: ${quantity}`);
    
      // Проверяем, есть ли уже такой товар в корзине
      let cartItem = await this.cartItemRepository.findOne({
        where: { cartId: cart.id, productId }
      });
      
      if (cartItem) {
        // Обновляем количество, если товар уже в корзине
        cartItem.quantity += quantity;
        await this.cartItemRepository.save(cartItem);
      } else {
        // Добавляем новый товар в корзину
        cartItem = this.cartItemRepository.create({
          cartId: cart.id,
          productId,
          quantity,
          price: product.price
        });
        await this.cartItemRepository.save(cartItem);
      }
      
      // Получаем обновленную корзину со всеми товарами
      const updatedCart = await this.cartRepository.findOne({
        where: { id: cart.id },
        relations: ['items', 'items.product'],
      });
      
      return { 
        success: true, 
        message: 'Товар добавлен в корзину', 
        cart: updatedCart || null 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`Ошибка при добавлении товара в корзину для пользователя ${username}: ${errorMessage}`);
      return {
        success: false,
        message: `Ошибка при добавлении товара в корзину: ${errorMessage}`
      };
    }
  }

  async getCart(username: string): Promise<Cart | null> {
    if (!username) {
      console.error('Попытка получить корзину без указания имени пользователя');
      return null;
    }
    
    try {
      const cart = await this.cartRepository.findOne({
        where: { userId: username, isCompleted: false },
        relations: ['items', 'items.product'],
      });
      
      if (cart) {
        console.log(`Найдена корзина для пользователя: ${username}, количество товаров: ${cart.items.length}`);
      } else {
        console.log(`Корзина не найдена для пользователя: ${username}`);
      }
      
      return cart;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`Ошибка при получении корзины для пользователя ${username}: ${errorMessage}`);
      return null;
    }
  }

  async clearCart(username: string): Promise<boolean> {
    if (!username) {
      console.error('Попытка очистить корзину без указания имени пользователя');
      return false;
    }
    
    try {
      // Получаем корзину пользователя
      const cart = await this.getCart(username);
      
      if (!cart) {
        console.log(`Корзина не найдена для пользователя: ${username}`);
        return false;
      }
      
      // Удаляем все элементы корзины
      if (cart.items && cart.items.length > 0) {
        await this.cartItemRepository.delete({ cartId: cart.id });
        console.log(`Удалено ${cart.items.length} товаров из корзины пользователя ${username}`);
      }
      
      // Отмечаем корзину как завершенную
      cart.isCompleted = true;
      await this.cartRepository.save(cart);
      
      console.log(`Корзина пользователя ${username} успешно очищена и помечена как завершенная`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`Ошибка при очистке корзины для пользователя ${username}: ${errorMessage}`);
      return false;
    }
  }

  async removeFromCart(username: string, cartItemId: string): Promise<{ success: boolean; message: string; cart?: Cart | null }> {
    if (!username) {
      return { success: false, message: 'Не указано имя пользователя' };
    }
    
    if (!cartItemId) {
      return { success: false, message: 'Не указан ID товара в корзине' };
    }
    
    console.log(`Попытка удаления товара из корзины: username=${username}, cartItemId=${cartItemId}`);
    
    try {
      const cart = await this.getCart(username);
      
      if (!cart) {
        return { success: false, message: 'Корзина не найдена' };
      }
      
      // Проверяем, принадлежит ли элемент корзины данному пользователю
      const cartItem = await this.cartItemRepository.findOne({
        where: { id: cartItemId, cartId: cart.id }
      });
      
      if (!cartItem) {
        return { success: false, message: 'Товар не найден в корзине' };
      }
      
      // Удаляем элемент из корзины
      await this.cartItemRepository.remove(cartItem);
      console.log(`Товар удален из корзины: username=${username}, cartItemId=${cartItemId}`);
      
      // Получаем обновленную корзину
      const updatedCart = await this.getCart(username);
      
      return { 
        success: true, 
        message: 'Товар удален из корзины', 
        cart: updatedCart || null 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error(`Ошибка при удалении товара из корзины для пользователя ${username}: ${errorMessage}`);
      return {
        success: false,
        message: `Ошибка при удалении товара из корзины: ${errorMessage}`
      };
    }
  }

  async completeCart(telegramUserId: string): Promise<Cart | null> {
    const cart = await this.getCart(telegramUserId);
    
    if (!cart || cart.items.length === 0) {
      return null;
    }
    
    // Помечаем корзину как завершенную
    cart.isCompleted = true;
    await this.cartRepository.save(cart);
    
    return cart;
  }

  // Метод для расчета общей суммы корзины
  calculateCartTotal(cart: Cart): number {
    if (!cart || !cart.items || cart.items.length === 0) {
      return 0;
    }
    
    return cart.items.reduce((total, item) => {
      return total + (Number(item.price) * item.quantity);
    }, 0);
  }
}
