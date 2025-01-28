import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString,MaxLength, MinLength } from "class-validator";


export class RegisterUserDto {
    @IsString({ message: 'Der Name muss eine Zeichenfolge sein' })
    @ApiProperty({})
    readonly username:string;

    @ApiProperty({ required: false }) 
    @IsString({ message: 'Telefon muss eine Zeichenfolge sein' })
    @IsOptional()
/*     @MinLength(7, { message: 'Das Telefonnummer darf nicht kleiner als 7 sein' }) */
    readonly phone?:string;

    @ApiProperty({ required: false }) 
    @IsOptional()
    @IsString({ message: 'Email muss eine Zeichenfolge sein' })
    readonly email?:string;

    @ApiProperty({ required: false }) 
    testMonthFileUrl?: string

    @ApiProperty({ required: false }) 
    @IsOptional()
    @IsString({ message: 'Email muss eine Zeichenfolge sein' })
    readonly role?: string;
}

