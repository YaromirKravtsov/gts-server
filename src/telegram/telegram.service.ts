// src/telegram/telegram.service.ts
import { Injectable, Logger } from '@nestjs/common';


// Импортируем библиотеку через require
const TelegramBot = require('node-telegram-bot-api');

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly bot: any;
  private readonly chatId: string;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
    }
    // Создаем экземпляр бота с polling: false (т.к. мы будем использовать его только для отправки сообщений)
    this.bot = new TelegramBot(token, { polling: false });

    this.chatId = process.env.TELEGRAM_CHAT_ID;
    if (!this.chatId) {
      throw new Error('TELEGRAM_CHAT_ID is not set in environment variables');
    }
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
      this.logger.log(`Сообщение успешно отправлено в чат ${this.chatId}`);
    } catch (error) {
      this.logger.error('Ошибка отправки сообщения в Telegram', error);
    }
  }
}
