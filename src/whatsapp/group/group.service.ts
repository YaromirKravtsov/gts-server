import { Injectable } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class GroupService {
  constructor(private readonly whatsappService: WhatsAppService) {}

  async createGroup(groupName: string, participants: string[]) {
    try {
      const group = await this.whatsappService['client'].createGroup(groupName, participants);
      console.log('Group created:', group);
      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async sendMessageToGroup(message: string) {
    const groupId = '120363347100599639@g.us'
    try {
      await this.whatsappService['client'].sendMessage(groupId, message);
    } catch (error) {
      console.error('Error sending message to group:', error);
      throw error;
    }
  }
}
