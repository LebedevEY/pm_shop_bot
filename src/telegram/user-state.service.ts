import { USER_STATES } from './constants';

export interface UserState {
  state: string;
  data: Record<string, any>;
}

/**
 * Сервис для управления состояниями пользователей в Telegram-боте
 */
export class UserStateService {
  private userStates = new Map<number, UserState>();

  /**
   * Устанавливает состояние пользователя
   */
  setState(chatId: number, state: UserState): void {
    this.userStates.set(chatId, state);
  }

  /**
   * Устанавливает состояние ожидания количества товара
   */
  setWaitingQuantityState(chatId: number, productId: string): void {
    this.setState(chatId, {
      state: USER_STATES.WAITING_QUANTITY,
      data: { productId },
    });
  }

  /**
   * Устанавливает состояние ожидания адреса доставки
   */
  setWaitingAddressState(chatId: number): void {
    this.setState(chatId, {
      state: USER_STATES.WAITING_ADDRESS,
      data: {},
    });
  }

  /**
   * Устанавливает состояние ожидания контактной информации
   */
  setWaitingContactInfoState(chatId: number, productId: string, quantity: number): void {
    this.setState(chatId, {
      state: USER_STATES.WAITING_CONTACT_INFO,
      data: { productId, quantity },
    });
  }

  /**
   * Получает текущее состояние пользователя
   */
  getState(chatId: number): UserState | undefined {
    return this.userStates.get(chatId);
  }

  /**
   * Удаляет состояние пользователя
   */
  deleteState(chatId: number): void {
    this.userStates.delete(chatId);
  }
}
