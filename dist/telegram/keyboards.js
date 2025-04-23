"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductKeyboard = createProductKeyboard;
exports.createCartKeyboard = createCartKeyboard;
exports.createCartItemKeyboard = createCartItemKeyboard;
exports.createProductsListKeyboard = createProductsListKeyboard;
exports.createAfterAddToCartKeyboard = createAfterAddToCartKeyboard;
const constants_1 = require("./constants");
/**
 * Создает клавиатуру для деталей товара
 */
function createProductKeyboard(product) {
    return {
        inline_keyboard: [
            [{ text: 'Добавить в корзину', callback_data: `${constants_1.CALLBACK_DATA.ADD_TO_CART_PREFIX}${product.id}` }],
            [{ text: 'Назад к списку', callback_data: constants_1.CALLBACK_DATA.BACK_TO_PRODUCTS }],
        ],
    };
}
/**
 * Создает клавиатуру для корзины
 */
function createCartKeyboard() {
    return {
        inline_keyboard: [
            [{ text: 'Оформить заказ', callback_data: constants_1.CALLBACK_DATA.CHECKOUT }],
            [{ text: 'Продолжить покупки', callback_data: constants_1.CALLBACK_DATA.BACK_TO_PRODUCTS }],
        ],
    };
}
/**
 * Создает клавиатуру для элемента корзины
 */
function createCartItemKeyboard(cartItemId) {
    return {
        inline_keyboard: [
            [{ text: 'Удалить', callback_data: `${constants_1.CALLBACK_DATA.REMOVE_FROM_CART_PREFIX}${cartItemId}` }],
        ],
    };
}
/**
 * Создает клавиатуру для списка товаров
 */
function createProductsListKeyboard(products) {
    const keyboard = products.map(product => [
        { text: product.name, callback_data: `${constants_1.CALLBACK_DATA.PRODUCT_PREFIX}${product.id}` },
    ]);
    keyboard.push([{ text: 'Перейти в корзину', callback_data: constants_1.CALLBACK_DATA.VIEW_CART }]);
    return { inline_keyboard: keyboard };
}
/**
 * Создает клавиатуру после добавления товара в корзину
 */
function createAfterAddToCartKeyboard() {
    return {
        inline_keyboard: [
            [{ text: 'Перейти в корзину', callback_data: constants_1.CALLBACK_DATA.VIEW_CART }],
            [{ text: 'Продолжить покупки', callback_data: constants_1.CALLBACK_DATA.BACK_TO_PRODUCTS }],
        ],
    };
}
