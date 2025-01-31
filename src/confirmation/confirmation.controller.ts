import { Controller, Get, HttpException, HttpStatus, Param, Res } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Response } from 'express';
import { ConfirmationService } from './confirmation.service';

@Controller('confirmations')
export class ConfirmationController {
    constructor(private confirmationService: ConfirmationService) { }
    @Get('/email/:key')
    async confirmEmail(@Param() { key }) {
        try {
            return await this.confirmationService.confirmEmail(key)
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Internal Server Error',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    @Get('/trail/trainig/:key')
    async confirmTrailTrainig(@Param() { key }, @Res() res: Response) {
        try {
            await this.confirmationService.confirmTrailTrainig(key);
            return res.redirect(302, process.env.FRONT_URL + '?action=showSuccessTrainingRegistration'); 
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Internal Server Error',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
