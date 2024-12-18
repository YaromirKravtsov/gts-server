import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { GroupService } from './group/group.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('WhatsApp') // Название группы для Swagger
@Controller('whatsapp')
export class WhatsappController {

    constructor(
        private readonly whatsappService: WhatsAppService,
        private readonly groupService: GroupService,
    ) {}

    @Post('send')
    @ApiOperation({ summary: 'Send a WhatsApp message with or without a file' })
    @ApiBody({
        description: 'Send WhatsApp message data',
        schema: {
            type: 'object',
            properties: {
                to: { type: 'string', example: '+1234567890' },
                text: { type: 'string', example: 'Hello, this is a test message.' },
                isSendFile: { type: 'boolean', example: true },
            },
        },
    })
    async sendMessage(@Body() body: SendMessageDto): Promise<string> {
        const { to, text, isSendFile } = body;

        if (!to || !text) {
            throw new BadRequestException('Recipient ("to") and message text ("text") are required.');
        }

        try {
            await this.whatsappService.sendMessage(to, text, isSendFile);
            return 'Message sent successfully!';
        } catch (error) {
            throw new BadRequestException(`Failed to send message: ${error.message}`);
        }
    }

/* 
    @Post('send-message')
    @ApiOperation({ summary: 'Send a message to a phone number' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                phone: { type: 'string', example: '123456789@c.us' },
                message: { type: 'string', example: 'Hello, this is a test message.' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Message sent successfully' })
    async sendMessage(
        @Body('phone') phone: string,
        @Body('message') message: string
    ) {
        await this.whatsappService.sendMessage(phone, message);
        return { status: 'Message sent' };
    } */

   /*  @Post('create-group')
    @ApiOperation({ summary: 'Create a WhatsApp group' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                groupName: { type: 'string', example: 'Test Group' },
                participants: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['123456789@c.us', '987654321@c.us'],
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Group created successfully' })
    async createGroup(
        @Body('groupName') groupName: string,
        @Body('participants') participants: string[],
    ) {
        const group = await this.groupService.createGroup(groupName, participants);
        return { status: 'Group created', group };
    } */
/* 
    @Post('send-group-message')
    @ApiOperation({ summary: 'Send a message to a WhatsApp group' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Hello, group!' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Message sent to group successfully' })
    async sendMessageToGroup(
        @Body('message') message: string,
    ) {
        await this.groupService.sendMessageToGroup(message);
        return { status: 'Message sent to group' };
    } */
}
