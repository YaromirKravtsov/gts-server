import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Application } from './application.model';
import { Training } from 'src/training/training.model';
import { Op } from 'sequelize';
import { Group } from 'src/group/group.model';
import { Location } from 'src/location/location.model';
import { TrainingDates } from 'src/training/trainig-dates.model';
import * as moment from 'moment-timezone';
@Injectable()
export class ApplicationService {
    constructor(@InjectModel(Application) private applicationRepository: typeof Application,
    @InjectModel(TrainingDates) private trainingDatesRepository: typeof TrainingDates,
) { }

    // Создание новой заявки
    async createApplication(dto: CreateApplicationDto) {
        const trainingDate = await this.trainingDatesRepository.findByPk(dto.trainingDatesId);

        if (!trainingDate) {
            throw new NotFoundException(`TrainingDates with ID ${dto.trainingDatesId} not found`);
        }

        // Создаем заявку
        const application = await this.applicationRepository.create(dto);
        return application;
    }

    // Получение заявок за месяц
    async getByMonthApplication(date: string) {
        const startDate = new Date(date);
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
    
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 1);
    
        const applications = await this.applicationRepository.findAll({
            include: [
                {
                    model: TrainingDates,
                    where: {
                        startDate: {
                            [Op.gte]: monthStart,
                            [Op.lt]: monthEnd,
                        },
                    },
                    include: [
                        {
                            model: Training,
                            attributes: ['startTime', 'endTime'],
                            include: [
                                { model: Group, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                                { model: Location, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                            ],
                        },
                    ],
                },
            ],
            order: [['trainingDates', 'startDate', 'ASC']], // Изменено на 'startDate'
        });
       
        // Форматируем результат в нужный вид
        return applications.map(application => ({
            id: application.id,
            trainingDatesId: application.trainingDatesId,
            playerName: application.playerName,
            startDate: moment.tz(application.trainingDates.startDate, 'Europe/Berlin').format(),
            endDate: moment.tz(application.trainingDates.endDate, 'Europe/Berlin').format() ,
            location: application.trainingDates.training.location,
            group: application.trainingDates.training.group,
        }));
    }
    
    //
    async geApplication(id: number) {
        console.log(id);

        const application = await this.applicationRepository.findOne({
            where: {id},
            include: [
                {
                    model: TrainingDates,
                    include: [
                        {
                            model: Training,
                            attributes: ['startTime', 'endTime'],
                            include: [
                                { model: Group, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                                { model: Location, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                            ],
                        },
                    ],
                },
            ],
           /*  order: [['trainingDates', 'startDate', 'ASC']], */
        });
       
        // Форматируем результат в нужный вид
        return {
            trainingDatesId: application.trainingDatesId,
            playerName: application.playerName,
            playerComment:application.playerComment ,
            playerPhone: application.playerPhone,
            startDate: moment.tz(application.trainingDates.startDate, 'Europe/Berlin').format(),
            endDate: moment.tz(application.trainingDates.endDate, 'Europe/Berlin').format() ,
            location: application.trainingDates.training.location,
            group: application.trainingDates.training.group,
        }
    }
    
    // 
    adjustTrainingDates(trainingDate: Date, time: Date):Date {
        const adjustedDate = new Date(
            trainingDate.getFullYear(),
            trainingDate.getMonth(),
            trainingDate.getDate(),
            time.getHours(),
            time.getMinutes(),
            time.getSeconds()
        );
        return adjustedDate;
    } 
    
}
