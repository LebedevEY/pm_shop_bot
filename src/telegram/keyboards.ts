import TelegramBot from 'node-telegram-bot-api';
import { Product } from '../entities';
import { CALLBACK_DATA } from './constants';

/**
 * Создает клавиатуру для деталей товара
 */
export function createProductKeyboard(product: Product): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Добавить в корзину', callback_data: `${CALLBACK_DATA.ADD_TO_CART_PREFIX}${product.id}` }],
      [{ text: 'Назад к списку', callback_data: CALLBACK_DATA.BACK_TO_PRODUCTS }],
    ],
  };
}

/**
 * Создает клавиатуру для корзины
 */
export function createCartKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Оформить заказ', callback_data: CALLBACK_DATA.CHECKOUT }],
      [{ text: 'Продолжить покупки', callback_data: CALLBACK_DATA.BACK_TO_PRODUCTS }],
    ],
  };
}

/**
 * Создает клавиатуру для элемента корзины
 */
export function createCartItemKeyboard(cartItemId: string): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Удалить', callback_data: `${CALLBACK_DATA.REMOVE_FROM_CART_PREFIX}${cartItemId}` }],
    ],
  };
}

/**
 * Создает клавиатуру для списка товаров
 */
export function createProductsListKeyboard(products: Product[]): TelegramBot.InlineKeyboardMarkup {
  const keyboard: TelegramBot.InlineKeyboardButton[][] = products.map(product => [
    { text: product.name, callback_data: `${CALLBACK_DATA.PRODUCT_PREFIX}${product.id}` },
  ]);
  
  keyboard.push([{ text: 'Перейти в корзину', callback_data: CALLBACK_DATA.VIEW_CART }]);
  
  return { inline_keyboard: keyboard };
}

/**
 * Создает клавиатуру после добавления товара в корзину
 */
export function createAfterAddToCartKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Перейти в корзину', callback_data: CALLBACK_DATA.VIEW_CART }],
      [{ text: 'Продолжить покупки', callback_data: CALLBACK_DATA.BACK_TO_PRODUCTS }],
    ],
  };
}
