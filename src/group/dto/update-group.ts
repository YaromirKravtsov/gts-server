import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";


export class UpdateGroupDto{
    @ApiProperty()
    @IsInt()
    id: number;

    @ApiProperty({ required: false, description: 'Название группы' })
    @IsOptional()
    @IsString()
    groupName?: string;

    @ApiProperty({ required: false, description: 'URL группы' })
    @IsOptional()
    @IsString()
    groupUrl?: string;

    @ApiProperty({ required: false, description: 'Цвет группы' })
    @IsOptional()
    @IsString()
    color?: string;




    
}