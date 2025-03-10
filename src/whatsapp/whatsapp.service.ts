import { Injectable, OnModuleInit } from '@nestjs/common';
const { Client, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")

@Injectable()
export class WhatsAppService implements OnModuleInit {
  private client: typeof Client;

  constructor() {
    this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true, // Без графического интерфейса
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        takeoverOnConflict: true, 
        takeoverTimeoutMs: 0, // Отключаем автообновление страницы
      });
      

    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
    });

    this.client.on('message', async (msg) => {
      try {
        if (msg.from !== 'status@broadcast') {
          const contact = await msg.getContact();
          console.log(contact, msg.body)
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  onModuleInit() {
    this.client.initialize();
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    try {
      const contactId = phone.replace('+', '').trim() + "@c.us";
        await this.client.sendMessage(contactId, message);
        console.log(`Message sent to ${contactId}`);
    } catch (error) {
        console.error('Error sending message:', error);
        throw error; 
    }
}

  async createGroup(groupName: string, participants: string[]) {
    try {
      const group = await this.client['client'].createGroup(groupName, participants);
      console.log('Group created:', group);
      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async sendMessageToGroup(message: string) {
    const groupId = '120363347100599639@g.us';
    try {
      console.log('В группу')
      await this.client.sendMessage(groupId, message);
      console.log('Message sent to group:', groupId);
    } catch (error) {
      console.error('Error sending message to group:', error);
      throw error;
    }
  }
  
  async isWhatsAppRegistered(phone: string): Promise<boolean> {
    try {;
      const contactId = phone.replace('+', '').trim() + "@c.us";

      console.log(contactId)
      const contact = await this.client.getContactById(contactId);
      console.log(contact)
      return contact.isWAContact ;
    } catch (error) {
      console.error('Error checking WhatsApp registration:', error);
      return false;
    }
  }
  
  
}