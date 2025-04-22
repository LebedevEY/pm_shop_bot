import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType } from '../entities/notification.entity';
import { Order } from '../entities/order.entity';
import { EmailService } from './email.service';
import { config } from '../config';

export class NotificationService {
  constructor(
    private notificationRepository: Repository<Notification>,
    private emailService: EmailService,
    private telegramBotService: any,
  ) {}

  async notifyAdminAboutNewOrder(order: Order): Promise<void> {
    const adminEmail = config.admin.email;

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
        type: NotificationType.TELEGRAM,
        recipient: 'admin',
        content: message,
        status: NotificationStatus.SENT,
      });
    } catch (error) {
      await this.notificationRepository.save({
        type: NotificationType.TELEGRAM,
        recipient: 'admin',
        content: message,
        status: NotificationStatus.FAILED,
      });
    }

    try {
      await this.emailService.sendOrderNotification(adminEmail, order);

      await this.notificationRepository.save({
        type: NotificationType.EMAIL,
        recipient: adminEmail,
        content: `Order #${order.id} notification`,
        status: NotificationStatus.SENT,
      });
    } catch (error) {
      await this.notificationRepository.save({
        type: NotificationType.EMAIL,
        recipient: adminEmail,
        content: `Order #${order.id} notification`,
        status: NotificationStatus.FAILED,
      });
    }
  }
}
