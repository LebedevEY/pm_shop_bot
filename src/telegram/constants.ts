/**
 * Константы для сообщений бота
 */
export const MESSAGES = {
  WELCOME: 'Добро пожаловать в магазин PopMart! Используйте /products для просмотра товаров.',
  CART_EMPTY: 'Ваша корзина пуста. Используйте /products для просмотра товаров.',
  ORDER_CREATED: (orderNumber: string) => `Спасибо! Ваш заказ №${orderNumber} принят. Мы свяжемся с вами для подтверждения.`,
  ENTER_QUANTITY: 'Введите количество товара:',
  ENTER_ADDRESS: 'Введите адрес доставки:',
  ENTER_CONTACT_INFO: 'Введите контактную информацию (имя, телефон):',
  PRODUCT_ADDED: (quantity: number) => `Товар добавлен в корзину: ${quantity} шт.`,
  PRODUCT_REMOVED: 'Товар удален из корзины.',
  CART_CLEARED: 'Корзина очищена.',
  ERROR_GENERIC: 'Произошла ошибка. Попробуйте позже.',
  ERROR_ORDER: (error: string) => `Произошла ошибка при оформлении заказа: ${error}`,
  ERROR_CART: (error: string) => `Ошибка при работе с корзиной: ${error}`,
  UNKNOWN_COMMAND: 'Неизвестная команда. Используйте /products для просмотра товаров.',
};

/**
 * Константы для команд бота
 */
export const COMMANDS = {
  START: '/start',
  PRODUCTS: '/products',
  CART: '/cart',
  CHECKOUT: '/checkout',
  HELP: '/help',
};

/**
 * Константы для callback-данных
 */
export const CALLBACK_DATA = {
  BACK_TO_PRODUCTS: 'back_to_products',
  VIEW_CART: 'view_cart',
  CHECKOUT: 'checkout',
  PRODUCT_PREFIX: 'product:',
  ADD_TO_CART_PREFIX: 'add_to_cart:',
  REMOVE_FROM_CART_PREFIX: 'remove_from_cart:',
};

/**
 * Константы для состояний пользователя
 */
export const USER_STATES = {
  WAITING_QUANTITY: 'waiting_quantity',
  WAITING_ADDRESS: 'waiting_address',
  WAITING_CONTACT_INFO: 'waiting_contact_info',
};
