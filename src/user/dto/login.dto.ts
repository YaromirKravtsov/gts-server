import { ApiProperty } from '@nestjs/swagger';
export class LoginDto{
    @ApiProperty({ example: 'admin', description: 'Start time of the training' })
    username: string;
    @ApiProperty({ example: 'admin', description: 'Start time of the training' })
    password:string;
}