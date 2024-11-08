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

    @ApiProperty({ description: 'Видимость локации', default: true })
    @IsOptional()
    @IsBoolean()
    visible?: boolean;

    @ApiProperty({ description: 'Порядок отображения локации', default: 1 })
    @IsOptional()
    @IsBoolean()
    order?: boolean;
}
