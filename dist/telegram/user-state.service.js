"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStateService = void 0;
const constants_1 = require("./constants");
/**
 * u0421u0435u0440u0432u0438u0441 u0434u043bu044f u0443u043fu0440u0430u0432u043bu0435u043du0438u044f u0441u043eu0441u0442u043eu044fu043du0438u044fu043cu0438 u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu0435u0439 u0432 Telegram-u0431u043eu0442u0435
 */
class UserStateService {
    constructor() {
        this.userStates = new Map();
    }
    /**
     * u0423u0441u0442u0430u043du0430u0432u043bu0438u0432u0430u0435u0442 u0441u043eu0441u0442u043eu044fu043du0438u0435 u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f
     */
    setState(chatId, state) {
        this.userStates.set(chatId, state);
    }
    /**
     * u0423u0441u0442u0430u043du0430u0432u043bu0438u0432u0430u0435u0442 u0441u043eu0441u0442u043eu044fu043du0438u0435 u043eu0436u0438u0434u0430u043du0438u044f u043au043eu043bu0438u0447u0435u0441u0442u0432u0430 u0442u043eu0432u0430u0440u0430
     */
    setWaitingQuantityState(chatId, productId) {
        this.setState(chatId, {
            state: constants_1.USER_STATES.WAITING_QUANTITY,
            data: { productId },
        });
    }
    /**
     * u0423u0441u0442u0430u043du0430u0432u043bu0438u0432u0430u0435u0442 u0441u043eu0441u0442u043eu044fu043du0438u0435 u043eu0436u0438u0434u0430u043du0438u044f u0430u0434u0440u0435u0441u0430 u0434u043eu0441u0442u0430u0432u043au0438
     */
    setWaitingAddressState(chatId) {
        this.setState(chatId, {
            state: constants_1.USER_STATES.WAITING_ADDRESS,
            data: {},
        });
    }
    /**
     * u0423u0441u0442u0430u043du0430u0432u043bu0438u0432u0430u0435u0442 u0441u043eu0441u0442u043eu044fu043du0438u0435 u043eu0436u0438u0434u0430u043du0438u044f u043au043eu043du0442u0430u043au0442u043du043eu0439 u0438u043du0444u043eu0440u043cu0430u0446u0438u0438
     */
    setWaitingContactInfoState(chatId, productId, quantity) {
        this.setState(chatId, {
            state: constants_1.USER_STATES.WAITING_CONTACT_INFO,
            data: { productId, quantity },
        });
    }
    /**
     * u041fu043eu043bu0443u0447u0430u0435u0442 u0442u0435u043au0443u0449u0435u0435 u0441u043eu0441u0442u043eu044fu043du0438u0435 u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f
     */
    getState(chatId) {
        return this.userStates.get(chatId);
    }
    /**
     * u0423u0434u0430u043bu044fu0435u0442 u0441u043eu0441u0442u043eu044fu043du0438u0435 u043fu043eu043bu044cu0437u043eu0432u0430u0442u0435u043bu044f
     */
    deleteState(chatId) {
        this.userStates.delete(chatId);
    }
}
exports.UserStateService = UserStateService;
