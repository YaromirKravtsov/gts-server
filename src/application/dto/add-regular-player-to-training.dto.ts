import { ApiProperty } from "@nestjs/swagger";

export class AddRegularPlayerToTraing {
    @ApiProperty({ 
     /*    example: 'John Doe', 
        description: 'Name of the player applying for the training'  */
    })
    readonly userId: number;

    @ApiProperty({ 
        /*    example: 'John Doe', 
           description: 'Name of the player applying for the training'  */
       })
    readonly trainingDatesId: number;
}