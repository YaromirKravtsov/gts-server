import { Body, Controller, Get, HttpException, HttpStatus, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TokenService } from 'src/token/token.service';
import { CreateTrainigDto } from './dto/create-training-dto';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';

@Controller('trainings')
export class TrainingController {

    constructor(private trainingService: TrainingService) { }


    @Post()
    @Roles(['admin'])
    @UseGuards(RoleGuard)
    async createTraining(@Body() dto: CreateTrainigDto) {
        try {
            return await this.trainingService.createTraining(dto)
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @Get()
    async searchTrinings(
        @Query('date') date: string,
        @Query('groupId') groupId: string,
        @Query('locationId') locationId: string,
        @Query('page') page: string,
    ) {

        try {
            return await this.trainingService.searchTrainings(date, groupId, locationId, page)
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Get('date')
    async getTrainingsForMonth(
        @Query('date') date: string
    ) {
        try {
            return await this.trainingService.getTrainingsForMonth(date)

        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }


    @Get('/:id')
    async getTraining(@Param() {id} ){
        try {
         
            return await this.trainingService.getTraining(parseInt(id))

        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
