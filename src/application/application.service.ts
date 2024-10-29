import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Application } from './application.model';
import { Training } from 'src/training/training.model';
import { Op } from 'sequelize';
import { Group } from 'src/group/group.model';
import { Location } from 'src/location/location.model';

@Injectable()
export class ApplicationService {
    constructor(@InjectModel(Application) private applicationRepository: typeof Application) { }

    async createApplication(dto: CreateApplicationDto) {
        try {
            const application = await this.applicationRepository.create(dto)
            return application.id;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getByMonthApplication(date: string) {
        try {
            // Преобразуем строку в объект Date и находим начало и конец месяца
            const requestedDate = new Date(date);
            const startOfMonth = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), 1);
            const endOfMonth = new Date(requestedDate.getFullYear(), requestedDate.getMonth() + 1, 0); // Последний день месяца

            // Получаем все заявки в этом месяце
            const applications = await this.applicationRepository.findAll({
                where: {
                    date: {
                        [Op.between]: [startOfMonth, endOfMonth],
                    },
                },
                include: [
                    {
                        model: Training, // Подгружаем связанную тренировку
                        attributes: ['startTime', 'endTime', 'groupId', 'locationId'],
                        include: [
                            {
                                model: Group, // Подгружаем связанную тренировку
                                attributes: ['groupName', 'id','color'],
                            },
                            {
                                model: Location, // Подгружаем связанную тренировку
                                attributes: ['locationName', 'id'],
                            },
                        ]
                    }
                ],
                order: [['date', 'ASC']], // Сортируем по дате заявки
            });

            return applications;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
