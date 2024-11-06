import { ApiProperty } from "@nestjs/swagger";
import { CreateTrainingDto } from "./create-training-dto";

export class UpdateTrainingDto {
    @ApiProperty({ 
        example: '2023-11-01T10:00:00Z', 
        description: 'The start time of the training in ISO format' 
    })
    startTime: Date;

    @ApiProperty({ 
        example: '2023-11-01T11:00:00Z', 
        description: 'The end time of the training in ISO format' 
    })
    endTime: Date;
    @ApiProperty({ 
        example: '1', 
        description: 'TrainigDateId' 
    })
    trainingDatesId?: number;
}
