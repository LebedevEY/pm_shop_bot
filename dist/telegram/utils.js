"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsernameFromMessage = getUsernameFromMessage;
exports.createMessageWithUser = createMessageWithUser;
exports.formatErrorMessage = formatErrorMessage;
/**
 * Получает имя пользователя из сообщения Telegram
 */
function getUsernameFromMessage(msg) {
    return msg.from?.username || msg.from?.first_name || `user_${msg.chat.id}`;
}
/**
 * Создает объект сообщения с информацией о пользователе из callback-запроса
 */
function createMessageWithUser(query) {
    return {
        ...query.message,
        from: query.from,
    };
}
/**
 * Форматирует сообщение об ошибке
 */
function formatErrorMessage(error) {
    return error instanceof Error ? error.message : 'Неизвестная ошибка';
}
