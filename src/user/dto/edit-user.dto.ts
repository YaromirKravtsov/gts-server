import { ApiProperty } from "@nestjs/swagger";
import { RegisterUserDto } from "./register-user-dto";
import { IsNumber, IsOptional, IsString } from "class-validator";


export class EditUserDto extends RegisterUserDto{
    @ApiProperty({ required: false }) 
    @IsOptional()
    @IsNumber()
    id:number;

    @ApiProperty({ required: false }) 
    @IsOptional()
    @IsString({ message: 'Comment muss eine Zeichenfolge sein' })
    adminComment: string;
}