import TelegramBot from 'node-telegram-bot-api';

/**
 * Получает имя пользователя из сообщения Telegram
 */
export function getUsernameFromMessage(msg: TelegramBot.Message): string {
  return msg.from?.username || msg.from?.first_name || `user_${msg.chat.id}`;
}

/**
 * Создает объект сообщения с информацией о пользователе из callback-запроса
 */
export function createMessageWithUser(query: TelegramBot.CallbackQuery): TelegramBot.Message {
  return {
    ...query.message,
    from: query.from,
  } as TelegramBot.Message;
}

/**
 * Форматирует сообщение об ошибке
 */
export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Неизвестная ошибка';
}
