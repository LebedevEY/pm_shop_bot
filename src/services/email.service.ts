import * as nodemailer from 'nodemailer';
import { Order } from '../entities';
import { config } from '../config';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }

  async sendOrderNotification(to: string, order: Order): Promise<void> {
    const subject = `Новый заказ #${order.id}`;

    let html = `<h1>Новый заказ #${order.id}</h1>`;
    html += `<p>Дата: ${order.createdAt.toLocaleString()}</p>`;
    html += `<p>Сумма: ${order.totalAmount} руб.</p>`;

    html += '<h2>Товары:</h2>';
    html += '<ul>';
    for (const item of order.orderItems) {
      html += `<li>${item.product.name} x${item.quantity} = ${item.price * item.quantity} руб.</li>`;
    }
    html += '</ul>';

    html += '<h2>Контактная информация:</h2>';
    html += `<p>Адрес: ${order.shippingAddress}</p>`;
    html += `<p>Телефон: ${order.contactPhone}</p>`;

    await this.transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });
  }
}
