import { ApiProperty } from '@nestjs/swagger';

export class CreateTrainingDto {
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
        example: 1, 
        description: 'Repeat type: 1 for daily, 2 for weekly, 3 for monthly' 
    })
    repeat_type: number;

    @ApiProperty({ 
        example: 'Comment', 
        description: 'Admin Comment' 
    })
    adminComment: string;

    @ApiProperty({ 
        example: 1, 
        description: 'The ID of the group associated with the training' 
    })
    groupId: number;

    @ApiProperty({ 
        example: 1, 
        description: 'The ID of the location associated with the training' 
    })
    locationId: number;

    @ApiProperty({ 
        example: 1, 
        description: 'The ID of the location associated with the training' 
    })
    trainerId: number;
}
