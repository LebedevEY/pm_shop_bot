"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const entities_1 = require("../entities");
const config_1 = require("../config");
class NotificationService {
    constructor(notificationRepository, emailService, telegramBotService) {
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.telegramBotService = telegramBotService;
    }
    async notifyAdminAboutNewOrder(order) {
        const adminEmail = config_1.config.admin.email;
        let message = `*Новый заказ #${order.id}*\n\n`;
        message += `Дата: ${order.createdAt.toLocaleString()}\n`;
        message += `Сумма: ${order.totalAmount} руб.\n\n`;
        message += 'Товары:\n';
        for (const item of order.orderItems) {
            message += `- ${item.product.name} x${item.quantity} = ${item.price * item.quantity} руб.\n`;
        }
        message += `\nКонтактная информация:\nАдрес: ${order.shippingAddress}\nТелефон: ${order.contactPhone}`;
        try {
            await this.telegramBotService.notifyAdmin(message);
            await this.notificationRepository.save({
                type: entities_1.NotificationType.TELEGRAM,
                recipient: 'admin',
                content: message,
                status: entities_1.NotificationStatus.SENT,
            });
        }
        catch (error) {
            await this.notificationRepository.save({
                type: entities_1.NotificationType.TELEGRAM,
                recipient: 'admin',
                content: message,
                status: entities_1.NotificationStatus.FAILED,
            });
        }
        try {
            await this.emailService.sendOrderNotification(adminEmail, order);
            await this.notificationRepository.save({
                type: entities_1.NotificationType.EMAIL,
                recipient: adminEmail,
                content: `Order #${order.id} notification`,
                status: entities_1.NotificationStatus.SENT,
            });
        }
        catch (error) {
            await this.notificationRepository.save({
                type: entities_1.NotificationType.EMAIL,
                recipient: adminEmail,
                content: `Order #${order.id} notification`,
                status: entities_1.NotificationStatus.FAILED,
            });
        }
    }
}
exports.NotificationService = NotificationService;
