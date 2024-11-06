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
import * as moment from 'moment-timezone';

@Injectable()
export class TrainingService {
    constructor(@InjectModel(Training) private trainingRepository: typeof Training,
        @InjectModel(TrainingDates) private trainingDatesRepository: typeof TrainingDates,
    ) { }

    // Проверка даты
    // Создание пробных тренировок
    async createTraining(dto: CreateTrainingDto) {
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

        // Устанавливаем начальные даты в Europe/Berlin, фиксируя время
        let currentStartDate = moment.tz(startTime, 'Europe/Berlin').utcOffset('+01:00', true);
        let currentEndDate = moment.tz(endTime, 'Europe/Berlin').utcOffset('+01:00', true);

        // Устанавливаем конечную дату на полгода вперед
        const finalDate = currentStartDate.clone().add(6, 'months');

        // Создаем записи в TrainingDates в зависимости от repeat_type
        while (currentStartDate.isSameOrBefore(finalDate)) {
            trainingDates.push({
                trainingId: training.id,
                startDate: currentStartDate.clone().utc().toDate(), // Сохраняем в UTC для согласованности
                endDate: currentEndDate.clone().utc().toDate(),     // Сохраняем в UTC для согласованности
            });

            // Увеличиваем currentStartDate и currentEndDate в зависимости от типа повторения
            if (repeat_type === 1) {
                // Ежедневно
                currentStartDate.add(1, 'day');
                currentEndDate.add(1, 'day');
            } else if (repeat_type === 2) {
                // Еженедельно
                currentStartDate.add(1, 'week');
                currentEndDate.add(1, 'week');
            } else if (repeat_type === 3) {
                // Ежемесячно
                currentStartDate.add(1, 'month');
                currentEndDate.add(1, 'month');
            }
        }

        // Сохраняем записи в TrainingDates с полями startDate и endDate
        await this.trainingDatesRepository.bulkCreate(trainingDates);

        return training;
    }


    // Переделать даты
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


            const trainingJson = trainingDate.training.toJSON(); // Преобразуем в простой объект

            // Корректируем startTime и endTime
            const trainingWithRightDates = {
                ...trainingJson,
                id: trainingDate.id,
                startTime: moment.tz(trainingDate.startDate, 'Europe/Berlin').format(),
                endTime: moment.tz(trainingDate.endDate, 'Europe/Berlin').format(),
            };

            acc[dateKey].trainings.push(trainingWithRightDates);

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

        const startDate = new Date(date);
        const year = startDate.getFullYear();
        const month = startDate.getMonth();

        // Определяем начало и конец месяца
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 1);
        console.log(monthStart, monthEnd);

        // Выполняем запрос на получение тренировок за указанный месяц
        const trainingDates = await this.trainingDatesRepository.findAll({
            where: {
                startDate: {
                    [Op.gte]: monthStart,
                    [Op.lt]: monthEnd,
                },
            },
            attributes: ['id', 'startDate', 'endDate'],
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
            order: [['startDate', 'ASC']],
        });
        console.log('dooooo')
        // Преобразуем даты к Europe/Berlin перед возвратом клиенту
        return trainingDates.map(trainingDate => {

            console.log("no" + trainingDate.startDate)
            console.log("no" + trainingDate.endDate)
            console.log("moment.tz" + moment.tz(trainingDate.startDate, 'Europe/Berlin').format())
            console.log("moment.tz" + moment.tz(trainingDate.endDate, 'Europe/Berlin').format())
            return {
                trainingDatesId: trainingDate.id,
                startTime: moment.tz(trainingDate.startDate, 'Europe/Berlin').format(),  // Преобразование в Europe/Berlin
                endTime: moment.tz(trainingDate.endDate, 'Europe/Berlin').format(),      // Преобразование в Europe/Berlin
                group: trainingDate.training.group,
                location: trainingDate.training.location,
            }
        })
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
            startTime: moment.tz(trainingDate.startDate, 'Europe/Berlin').format(),
            endTime: moment.tz(trainingDate.endDate, 'Europe/Berlin').format(),
        };

        return trainingWithRightDates;

    }

    //  Удаление одной записи по trainingDatesId из TrainingDates
    async deleteTrainingDate(dto: DeleteTrainigDto): Promise<{ message: string }> {
        console.log(dto)
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
    
        // Находим существующую запись в TrainingDates
        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId);
        if (!trainingDate) {
            throw new NotFoundException(`TrainingDate with ID ${trainingDatesId} not found`);
        }
    
        // Находим основную запись в Training, чтобы получить repeat_type
        const training = await this.trainingRepository.findByPk(trainingDate.trainingId);
        if (!training) {
            throw new NotFoundException(`Training with ID ${trainingDate.trainingId} not found`);
        }
    
        const { repeatType } = training;
    
        // Устанавливаем начальные и конечные даты для обновления
        let currentStartDate = moment.tz(startTime, 'Europe/Berlin').utcOffset('+01:00', true);
        let currentEndDate = moment.tz(endTime, 'Europe/Berlin').utcOffset('+01:00', true);
    
        // Конечная дата для обновления (например, полгода вперед)
        const finalDate = currentStartDate.clone().add(6, 'months');
    
        // Массив для обновленных дат
        const updatedTrainingDates = [];
    
        // Обновляем расписание в зависимости от типа повторения (repeatType)
        while (currentStartDate.isSameOrBefore(finalDate)) {
            updatedTrainingDates.push({
                trainingId: training.id,
                startDate: currentStartDate.clone().utc().toDate(),
                endDate: currentEndDate.clone().utc().toDate(),
            });
    
            // Увеличиваем дату в зависимости от типа повторения
            if (repeatType === 1) {
                // Ежедневно
                currentStartDate.add(1, 'day');
                currentEndDate.add(1, 'day');
            } else if (repeatType === 2) {
                // Еженедельно
                currentStartDate.add(1, 'week');
                currentEndDate.add(1, 'week');
            } else if (repeatType === 3) {
                // Ежемесячно
                currentStartDate.add(1, 'month');
                currentEndDate.add(1, 'month');
            }
        }
    
        // Удаляем старые записи в TrainingDates, связанные с trainingId
        await this.trainingDatesRepository.destroy({
            where: { trainingId: training.id }
        });
    
        // Сохраняем новые записи в TrainingDates
        await this.trainingDatesRepository.bulkCreate(updatedTrainingDates);
    
        return { message: `Training and all related TrainingDates with ID ${training.id} have been updated based on repeatType` };
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
