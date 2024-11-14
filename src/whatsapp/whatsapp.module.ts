import { Module } from '@nestjs/common';
import { GroupService } from './group/group.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp/whatsapp.service';

@Module({
  providers: [WhatsAppService, GroupService],
  controllers: [WhatsappController],
  exports: [WhatsAppService], 
})
export class WhatsappModule {}
