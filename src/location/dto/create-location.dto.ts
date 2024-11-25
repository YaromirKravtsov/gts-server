import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateLocationDto {
    @ApiProperty({ description: 'Название локации' })
    @IsString()
    locationName: string;

    @ApiProperty({ description: 'URL локации', required: false })
    @IsOptional()
    @IsString()
    locationUrl?: string;

}