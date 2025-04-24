"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStateService = void 0;
const constants_1 = require("./constants");
/**
 * Сервис для управления состояниями пользователей в Telegram-боте
 */
class UserStateService {
    constructor() {
        this.userStates = new Map();
    }
    /**
     * Устанавливает состояние пользователя
     */
    setState(chatId, state) {
        this.userStates.set(chatId, state);
    }
    /**
     * Устанавливает состояние ожидания количества товара
     */
    setWaitingQuantityState(chatId, productId) {
        this.setState(chatId, {
            state: constants_1.USER_STATES.WAITING_QUANTITY,
            data: { productId },
        });
    }
    /**
     * Устанавливает состояние ожидания адреса доставки
     */
    setWaitingAddressState(chatId) {
        this.setState(chatId, {
            state: constants_1.USER_STATES.WAITING_ADDRESS,
            data: {},
        });
    }
    /**
     * Устанавливает состояние ожидания контактной информации
     */
    setWaitingContactInfoState(chatId, productId, quantity) {
        this.setState(chatId, {
            state: constants_1.USER_STATES.WAITING_CONTACT_INFO,
            data: { productId, quantity },
        });
    }
    /**
     * Получает текущее состояние пользователя
     */
    getState(chatId) {
        return this.userStates.get(chatId);
    }
    /**
     * Удаляет состояние пользователя
     */
    deleteState(chatId) {
        this.userStates.delete(chatId);
    }
}
exports.UserStateService = UserStateService;
