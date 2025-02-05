import { Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
    constructor(private telegramService: TelegramService){}
    @Post()
    async sendMessage(){
        console.log('send')
        this.telegramService.sendMessage('sdsd')
    }
}
