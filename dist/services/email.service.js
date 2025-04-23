"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer = __importStar(require("nodemailer"));
const config_1 = require("../config");
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config_1.config.smtp.host,
            port: config_1.config.smtp.port,
            secure: config_1.config.smtp.secure,
            auth: {
                user: config_1.config.smtp.user,
                pass: config_1.config.smtp.password,
            },
        });
    }
    async sendOrderNotification(to, order) {
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
            from: config_1.config.smtp.from,
            to,
            subject,
            html,
        });
    }
}
exports.EmailService = EmailService;
