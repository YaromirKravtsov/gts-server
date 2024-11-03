import { ApiProperty } from "@nestjs/swagger";
import { CreateTrainingDto } from "./create-training-dto";

export class UpdateTrainingDto extends CreateTrainingDto {
    @ApiProperty({ 
        example: 1, 
        description: 'The ID of the training date to update' 
    })
    trainingDatesId: number;
}
