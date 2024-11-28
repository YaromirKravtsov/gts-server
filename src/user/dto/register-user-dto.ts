import { ApiProperty } from "@nestjs/swagger";
import { IsString,MaxLength } from "class-validator";


export class RegisterUserDto {
    @IsString({ message: 'Имя должно быть строкой' })
    @MaxLength(10, { message: 'username не может быть больше 10' })
    @ApiProperty({})
    readonly username:string;
    
    @ApiProperty({})
    @IsString({ message: 'Имя должно быть строкой' })
    @MaxLength(10, { message: 'password не может быть больше 10' })
    readonly password:string;
    
}

