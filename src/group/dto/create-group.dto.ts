import { ApiProperty } from "@nestjs/swagger";

export class CreateGroupDto{
    @ApiProperty()
    groupName: string;
    @ApiProperty()
    groupUrl: string;
    @ApiProperty()
    color:string;
}