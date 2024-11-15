import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
    @ApiProperty({ 
        example: 'John Doe', 
        description: 'Name of the player applying for the training' 
    })
    playerName: string;

    @ApiProperty({ 
        example: '+123456789', 
        description: 'Phone number of the player' 
    })
    playerPhone: string;

    @ApiProperty({ 
        example: 'Looking forward to the training!', 
        description: 'Optional comment from the player',
        required: false
    })
    playerComment?: string;

    @ApiProperty({ 
        example: 1, 
        description: 'ID of the training date this application is associated with' 
    })
    trainingDatesId: number;
}
