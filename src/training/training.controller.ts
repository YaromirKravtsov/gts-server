import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto } from './dto/create-training-dto';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { Training } from './training.model';
import { DeleteTrainigDto } from './dto/delete-training';
import { UpdateTrainingDto } from './dto/update-trainig.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Trainings') // Группировка всех маршрутов контроллера в разделе "Trainings"
@Controller('trainings')
export class TrainingController {
    constructor(private trainingService: TrainingService) { }

    /**
     * Создание новой тренировки
     */
    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create a new training' })
    @ApiResponse({ status: 201, description: 'The training has been successfully created.', type: Training })
    @ApiBody({ type: CreateTrainingDto })
    async create(@Body() createTrainingDto: CreateTrainingDto): Promise<Training> {
        return this.trainingService.createTraining(createTrainingDto);
    }

    /**
     * Поиск тренировок с фильтрацией
     */
    @Get()
    @ApiOperation({ summary: 'Search for trainings with filters' })
    @ApiQuery({ name: 'date', required: false, description: 'Start date for filtering' })
    @ApiQuery({ name: 'groupId', required: false, description: 'ID of the group for filtering' })
    @ApiQuery({ name: 'locationId', required: false, description: 'ID of the location for filtering' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
    @ApiResponse({ status: 200, description: 'List of trainings matching the criteria.' })
    async searchTrinings(
        @Query('date') date: string,
        @Query('groupId') groupId: string,
        @Query('locationId') locationId: string,
        @Query('page') page: string,
    ) {
        return await this.trainingService.searchTrainings(date, groupId, locationId, page);
    }

    /**
     * Получение тренировок за указанный месяц
     */
    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiBearerAuth()
    @Get('date')
    @ApiOperation({ summary: 'Get trainings for a specific month' })
    @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format to define the month' })
    @ApiResponse({ status: 200, description: 'List of trainings for the specified month.' })
    async getTrainingsForMonth(@Query('date') date: string) {
        return await this.trainingService.getTrainingsForMonth(date);
    }

    /**
     * Получение тренировки по ID
     */
    @Get('/:id')
    @ApiOperation({ summary: 'Get a training by ID' })
    @ApiParam({ name: 'id', description: 'ID of the training' })
    @ApiResponse({ status: 200, description: 'Details of the specified training.', type: Training })
    async getTraining(@Param() { id }): Promise<any> {
        return await this.trainingService.getTraining(parseInt(id));
    }

    /**
     * Удаление одной записи тренировки по `trainingDatesId`
     */
    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Delete('/delete-training-date')
    @ApiOperation({ summary: 'Delete a single training date by trainingDatesId' })
    @ApiBody({ type: DeleteTrainigDto })
    @ApiResponse({ status: 200, description: 'The training date has been deleted successfully.' })
    async deleteTrainingDate(@Body() dto: DeleteTrainigDto) {
        return await this.trainingService.deleteTrainingDate(dto);
    }

    /**
     * Удаление всех записей тренировки и самой тренировки по `trainingDatesId`
     */
    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Delete('/delete-training-and-dates')
    @ApiOperation({ summary: 'Delete all training dates and the training itself by trainingDatesId' })
    @ApiBody({ type: DeleteTrainigDto })
    @ApiResponse({ status: 200, description: 'The training and all related dates have been deleted successfully.' })
    async deleteTrainingAndDates(@Body() dto: DeleteTrainigDto) {
        return await this.trainingService.deleteTrainingAndDates(dto);
    }

    /**
     * Обновление одной тренировки
     */
    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Put('/one')
    @ApiOperation({ summary: 'Update a single training' })
    @ApiBody({ type: UpdateTrainingDto })
    @ApiResponse({ status: 200, description: 'The training has been updated successfully.' })
    async update(@Body() dto: UpdateTrainingDto) {
        return await this.trainingService.update(dto);
    }

    /**
     * Обновление всех тренировок с аналогичными характеристиками
     */
    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Put('/all')
    @ApiOperation({ summary: 'Update all trainings with similar attributes' })
    @ApiBody({ type: UpdateTrainingDto })
    @ApiResponse({ status: 200, description: 'All related trainings have been updated successfully.' })
    async updateAll(@Body() dto: UpdateTrainingDto) {
        return await this.trainingService.updateAll(dto);
    }
}
