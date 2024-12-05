import { ApiProperty } from "@nestjs/swagger";

export class DeleteUserDto{

    @ApiProperty({})
    readonly id:string;

}