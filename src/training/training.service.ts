import { Get, HttpException, HttpStatus, Injectable, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Training } from './training.model';
import { CreateTrainingDto } from './dto/create-training-dto';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { Model, Op } from 'sequelize';
import { Group } from 'src/group/group.model';
import { Location } from 'src/location/location.model';
import { TrainingDates } from './trainig-dates.model';
import { DeleteTrainigDto } from './dto/delete-training';
import { UpdateTrainingDto } from './dto/update-trainig.dto';

@Injectable()
export class TrainingService {
    constructor(@InjectModel(Training) private trainingRepository: typeof Training,
        @InjectModel(TrainingDates) private trainingDatesRepository: typeof TrainingDates,
    ) { }

    // Создание пробных тренировок
    async createTraining(dto: CreateTrainingDto): Promise<Training> {
        const { startTime, endTime, repeat_type, groupId, locationId } = dto;

        // Создаем основную запись в Training
        const training = await this.trainingRepository.create({
            isTrail: true,
            startTime,
            endTime,
            repeatType: repeat_type,
            groupId,
            locationId,
        });

        const trainingDates = [];
        const currentStartDate = new Date(startTime);
        const currentEndDate = new Date(endTime);
        const finalDate = new Date(startTime);
        finalDate.setMonth(finalDate.getMonth() + 6); // Полгода вперед

        // Создаем записи в TrainingDates в зависимости от repeat_type
        while (currentStartDate <= finalDate) {
            trainingDates.push({
                trainingId: training.id,
                startDate: new Date(currentStartDate), // Устанавливаем startDate
                endDate: new Date(currentEndDate),     // Устанавливаем endDate
            });

            // Увеличиваем currentStartDate и currentEndDate в зависимости от типа повторения
            if (repeat_type === 1) {
                // Ежедневно
                currentStartDate.setDate(currentStartDate.getDate() + 1);
                currentEndDate.setDate(currentEndDate.getDate() + 1);
            } else if (repeat_type === 2) {
                // Еженедельно
                currentStartDate.setDate(currentStartDate.getDate() + 7);
                currentEndDate.setDate(currentEndDate.getDate() + 7);
            } else if (repeat_type === 3) {
                // Ежемесячно
                currentStartDate.setMonth(currentStartDate.getMonth() + 1);
                currentEndDate.setMonth(currentEndDate.getMonth() + 1);
            }
        }

        // Сохраняем записи в TrainingDates с полями startDate и endDate
        await this.trainingDatesRepository.bulkCreate(trainingDates);

        return training;
    }


    // Поиск пробных тренировок
    async searchTrainings(date: string, groupId: string, locationId: string, page: string) {
        const recordsPerPage = 10;
        const pageNumber = parseInt(page, 10) || 1;
        const offset = (pageNumber - 1) * recordsPerPage;

        const currentDate = new Date();
        const startDate = date ? new Date(date) : currentDate;
        if (startDate < currentDate) startDate.setTime(currentDate.getTime());

        // Получаем все trainingIds, соответствующие groupId и locationId, если указаны
        const trainingIds = await this.trainingRepository.findAll({
            where: {
                ...(groupId && { groupId: parseInt(groupId, 10) }),
                ...(locationId && { locationId: parseInt(locationId, 10) }),
            },
            attributes: ['id'], // выбираем только id
        }).then(trainings => trainings.map(training => training.id));

        // Сначала определяем общее количество тренировок, соответствующих критериям
        const totalTrainingsCount = await this.trainingDatesRepository.count({
            where: {
                trainingId: {
                    [Op.in]: trainingIds,
                },
                startDate: {
                    [Op.gte]: startDate,
                },
            },
        });

        // Рассчитываем общее количество страниц
        const totalPages = Math.ceil(totalTrainingsCount / recordsPerPage);

        // Получаем текущие записи
        const trainingDates = await this.trainingDatesRepository.findAll({
            where: {
                trainingId: {
                    [Op.in]: trainingIds,
                },
                startDate: {
                    [Op.gte]: startDate,
                },
            },
            limit: recordsPerPage,
            offset,
            order: [['startDate', 'ASC']], // Используем startDate для сортировки
            include: [
                {
                    model: Training,
                    include: [
                        { model: Group },
                        { model: Location },
                    ],
                },
            ],
        });

        // Группируем записи по дате
        const groupedByDate = trainingDates.reduce((acc, trainingDate) => {
            const date = new Date(trainingDate.startDate);

            const dateKey = date.toLocaleDateString('de-DE', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            });

            if (!acc[dateKey]) {
                acc[dateKey] = {
                    date: dateKey,
                    trainings: [],
                };
            }

            acc[dateKey].trainings.push(trainingDate);

            return acc;
        }, {});

        return {
            trainings: Object.values(groupedByDate),
            totalPages, // Возвращаем общее количество страниц
            currentPage: pageNumber,
        };
    }

    // Получение тренровок на месяц для админа 
    async getTrainingsForMonth(date: string) {
        console.log(date);
        const startDate = new Date(date);
        const year = startDate.getFullYear();
        const month = startDate.getMonth();

        // Определяем начало и конец месяца
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 1);
        console.log(monthStart, monthEnd)
        // Выполняем запрос на получение тренировок за указанный месяц
        const trainingDates = await this.trainingDatesRepository.findAll({
            where: {
                startDate: {
                    [Op.gte]: monthStart,
                    [Op.lt]: monthEnd,
                },
            },
            attributes: ['id', 'startDate', 'endDate'], // Используем startDate и endDate
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
            order: [['startDate', 'ASC']], // Сортировка по startDate
        });

        // Форматируем результат, чтобы вернуть нужные поля в виде плоского объекта
        return trainingDates.map(trainingDate => ({
            trainingDatesId: trainingDate.id,
            startTime: trainingDate.startDate,
            endTime: trainingDate.endDate,
            group: trainingDate.training.group,
            location: trainingDate.training.location,
        }));
    }


    // Получения записи конкретной тренировки 
    async getTraining(trainingDatesId: number): Promise<any> {
        const trainingDate = await this.trainingDatesRepository.findOne({
            where: { id: trainingDatesId },
            include: [
                {
                    model: Training,
                    include: [
                        { model: Group },
                        { model: Location },
                    ],
                },
            ],
        });

        if (!trainingDate) {
            throw new NotFoundException(`TrainingDates with ID ${trainingDatesId} not found`);
        }
        /*   const date = trainingDate.startD; */
        const training = trainingDate.training.toJSON(); // Преобразуем в простой объект

        // Корректируем startTime и endTime
        const trainingWithRightDates = {
            ...training,
            startTime: trainingDate.startDate,
            endTime: trainingDate.endDate,
        };

        return trainingWithRightDates;

    }

    //  Удаление одной записи по trainingDatesId из TrainingDates
    async deleteTrainingDate(dto: DeleteTrainigDto): Promise<{ message: string }> {
        const { trainingDatesId, reason } = dto;
        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId);

        if (!trainingDate) {
            throw new NotFoundException(`TrainingDates with ID ${trainingDatesId} not found`);
        }

        await trainingDate.destroy();

        //TODO нотификация whatsApp об отмене тренировки c выводом причины клиенту 

        return { message: `TrainingDates with ID ${trainingDatesId} has been deleted` };
    }

    // Удаление всех записей по trainingId из TrainingDates и удаление самой Training
    async deleteTrainingAndDates(dto: DeleteTrainigDto): Promise<{ message: string }> {
        console.log(dto)
        const { trainingDatesId, reason } = dto
        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId);

        if (!trainingDate) {
            throw new NotFoundException(`Training with ID ${trainingDatesId} not found`);
        }
        const trainingId = trainingDate.trainingId
        console.log(trainingDate)
        console.log(trainingId)
        await this.trainingDatesRepository.destroy({
            where: { trainingId },
        });
        await this.trainingRepository.destroy({
            where: { id: trainingId },
        });

        // TODO нотификация whatsApp об отмене тренировки c выводом причины клиенту 

        return { message: `Training and all related TrainingDates with ID ${trainingDatesId} have been deleted` };
    }

    async update(dto: UpdateTrainingDto) {
        const { trainingDatesId, startTime, endTime } = dto;
        const trainigDates = await this.trainingDatesRepository.findByPk(trainingDatesId);

        if (!trainigDates) {
            throw new NotFoundException(`Training with ID ${trainingDatesId} not found`);
        }

        await this.trainingDatesRepository.update(
            {
                startDate: startTime, // Новое значение для startTime
                endDate: endTime,
            },
            {
                where: { id: trainingDatesId } // Условие фильтрации, которое определяет, какие записи обновить
            }
        );
        return { message: `Training and all related TrainingDates with ID ${trainingDatesId} have been updated` };
    }

    // TODO p1 Пределать что бы обновлялось только время, без даты!!!
    async updateAll(dto: UpdateTrainingDto) {
        const { trainingDatesId, startTime, endTime } = dto;
        console.log(trainingDatesId, startTime, endTime)
        const trainigDates = await this.trainingDatesRepository.findByPk(trainingDatesId);
        
        if (!trainigDates) {
            throw new NotFoundException(`Training with ID ${trainingDatesId} not found`);
        }
        
        await this.trainingDatesRepository.update(
            {
                startDate: startTime, // Новое значение для startTime
                endDate: endTime,
            },
            {
                where: { trainingId: trainigDates.trainingId } // Условие фильтрации, которое определяет, какие записи обновить
            }
        );
        return { message: `Training and all related TrainingDates with ID ${trainigDates.trainingId} have been updated` };

    }

    adjustTrainingDates(trainingDate: Date, time: Date): Date {
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
