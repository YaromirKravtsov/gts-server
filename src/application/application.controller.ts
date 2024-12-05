import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AddRegularPlayerToTraing } from './dto/add-regular-player-to-training.dto';

@ApiTags('Applications') // Группирует все маршруты контроллера в разделе "Applications" в Swagger
@Controller('applications')
export class ApplicationController {

    constructor(private applicationService: ApplicationService) { }

    /**
     * Создание новой заявки
     */

    @Post('/new-player')
    @ApiOperation({ summary: 'Create a new application' })
    @ApiBody({ type: CreateApplicationDto })
    @ApiResponse({ status: 201, description: 'The application has been successfully created.' })
    async createApplication(@Body() dto: CreateApplicationDto) {
        try {
            return await this.applicationService.createApplication(dto);
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Internal Server Error',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiBearerAuth()
    @Post('/regular')
    @ApiOperation({ summary: 'Add regular player to training(only to this one)' })
    @ApiBody({ type: AddRegularPlayerToTraing })
    @ApiResponse({ status: 201, description: 'The application has been successfully created.' })
    async addRegularPlayerToTraining(@Body() dto: AddRegularPlayerToTraing) {
        try {
            return await this.applicationService.addRegularPlayerToTraining(dto);
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Internal Server Error',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiBearerAuth()
    @Post('/add-regular-to-all')
    @ApiOperation({ summary: 'Add regular player to training for all trainigs of this type' })
    @ApiQuery({ name: 'applicationId' })
    @ApiQuery({ name: 'trainingId' })
    async addRegularPlayerToAllTraining(@Query('userId') userId, @Query('trainingId') trainingId) {
        try {
            return await this.applicationService.addRegularPlayerToAllTraining({ userId, trainingId });
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Internal Server Error',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiBearerAuth()
    @Delete('/delete-player-anmeldung/:applicationId')
    @ApiOperation({ summary: 'delete player anmeldung(only to this one)' })
    @ApiParam({ name: 'applicationId' })
    async deletePlayerApplication(@Param() { applicationId }) {
        try {
            return await this.applicationService.deletePlayerApplication(applicationId);
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Internal Server Error',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }




    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiBearerAuth()
    @Delete('/delete-all-player-anmeldungen')
    @ApiOperation({ summary: 'delete player anmeldung for all trainigs of this type' })
    @ApiQuery({ name: 'trainingId' })
    @ApiQuery({ name: 'userId' })
    async deleteAllPlayerApplicationToThisTraining(@Query('trainingId') trainingId, @Query('userId') userId) {
        try {
            return await this.applicationService.deleteAllPlayerApplicationToThisTraining({ trainingId, userId });
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Internal Server Error',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }



    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiBearerAuth()
    @Put('/isPresent/:applicationId')
    @ApiOperation({ summary: 'Set isPresent of application other value' })
    @ApiParam({ name: 'applicationId' })
    async putIsPresent(@Param() {applicationId}) {
        try {
            return await this.applicationService.putIsPresent(applicationId);
        } catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Internal Server Error',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    /**
     * Получение заявок за указанный месяц
     */
    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiBearerAuth()
    @Get()
    @ApiOperation({ summary: 'Get applications for a specific month' })
    @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format to define the month' })
    @ApiResponse({ status: 200, description: 'List of applications for the specified month.' })
    async getByMonthApplication(@Query('date') date: string) {
        try {
            return await this.applicationService.getByMonthApplication(date);
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Получение заявки по ID
     */
    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiBearerAuth()
    @Get('/:id')
    @ApiOperation({ summary: 'Get an application by ID' })
    @ApiParam({ name: 'id', description: 'ID of the application' })
    @ApiResponse({ status: 200, description: 'Details of the specified application.' })
    async geApplication(@Param() { id }) {
        return this.applicationService.geApplication(id);
    }

    /**
    * Удалить заявку ID
    */
   //TODO 
    @Delete()
    @ApiOperation({ summary: 'Удалить заявку по ID, имени и телефону игрока' })
    @ApiQuery({ name: 'id', type: String, description: 'ID заявки', required: true })
    @ApiQuery({ name: 'playerName', type: String, description: 'Имя игрока', required: true })
    @ApiQuery({ name: 'playerPhone', type: String, description: 'Телефон игрока', required: true })
    async delete(
        @Query('id') id: string,
        @Query('playerName') playerName: string,
        @Query('playerPhone') playerPhone: string
    ) {
        try {
            return await this.applicationService.deleteApplication(id, playerName, playerPhone);
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }
}
