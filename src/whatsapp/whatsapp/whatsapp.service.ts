import { Injectable, OnModuleInit } from '@nestjs/common';
const { Client, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")

@Injectable()
export class WhatsAppService implements OnModuleInit {
  private client: typeof Client;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
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

  async sendMessage(phone: string, message: string) {
    try {
      await this.client.sendMessage(phone, message);
    } catch (error) {
      console.error('Error sending message:', error);
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
  
}
