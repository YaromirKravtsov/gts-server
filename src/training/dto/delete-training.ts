import { ApiProperty } from "@nestjs/swagger";

export class DeleteTrainigDto {
    @ApiProperty({ 
        example: 1, 
        description: 'The ID of the training date to delete' 
    })
    trainingDatesId: number;

    @ApiProperty({ 
        example: 'The training is no longer needed', 
        description: 'The reason for deleting the training date' 
    })
    reason: string;
}
