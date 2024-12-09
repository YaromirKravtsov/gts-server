import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateLocationDto {
    @ApiProperty({ description: 'ID локации' })
    @IsInt()
    id: number;

    @ApiProperty({ description: 'Название локации', required: false })
    @IsOptional()
    @IsString()
    locationName?: string;

    @ApiProperty({ description: 'URL локации', required: false })
    @IsOptional()
    @IsString()
    locationUrl?: string;

    @ApiProperty({ description: 'Видимость локации', required: false })
    @IsOptional()
    @IsBoolean()
    visible?: boolean;

    @ApiProperty({ description: 'Порядок отображения локации', required: false })
    @IsOptional()
    @IsInt()
    order?: number;




    
}
