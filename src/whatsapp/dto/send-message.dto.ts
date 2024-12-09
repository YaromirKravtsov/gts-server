import { ApiBody } from "@nestjs/swagger";

export class SendMessageDto {
    to: string;
    text: string;
    isSendFile?: boolean;
}
