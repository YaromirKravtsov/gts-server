import { Get, HttpException, HttpStatus, Injectable, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Training } from './training.model';
import { CreateTrainigDto } from './dto/create-training-dto';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { Model, Op } from 'sequelize';
import { Group } from 'src/group/group.model';
import { Location } from 'src/location/location.model';

@Injectable()
export class TrainingService {
    constructor(@InjectModel(Training) private trainingRepository: typeof Training
    ) { }


    async createTraining(dto: CreateTrainigDto) {
        try {
            const training = await this.trainingRepository.create({ ...dto, isTrail: true });
            return training.id;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    async searchTrainings(date: string, groupId: string, locationId: string, page: string) {
        try {

            const whereConditions: any = {};
            const pageNumber = parseInt(page, 10);
            if (isNaN(pageNumber) || pageNumber <= 0) {
                throw new HttpException('Page must be a positive number', HttpStatus.BAD_REQUEST);
            }
            const requestedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0); 

            if (requestedDate < today) {
                throw new HttpException('Date cannot be earlier than today', HttpStatus.BAD_REQUEST);
            }
            if (groupId && parseInt(groupId) !== 0) {
                whereConditions.groupId = groupId;
            }
            if (locationId && parseInt(locationId) !== 0) {
                whereConditions.locationId = locationId;
            }

            const limit = 20; // Количество записей на одну страницу (15-дневный интервал)

            // Устанавливаем начальную и конечную даты для указанной страницы

            requestedDate.setDate(requestedDate.getDate() + (parseInt(page) - 1) * 15); // Смещаем начальную дату на 15 дней вперед для каждой страницы
            const endDate = new Date(requestedDate);
            endDate.setDate(endDate.getDate() + 15); // Окончание интервала через 15 дней

            // Получаем все тренировки, удовлетворяющие условиям
            const trainings = await this.trainingRepository.findAll({
                where: {
                    ...whereConditions,
                },
                order: [['startTime', 'ASC']],
                include: [
                    {
                        model: Group, // Подгружаем данные из модели Group
                        attributes: ['groupName', "color", 'groupUrl'], // Указываем, какие поля включить
                    },
                    {
                        model: Location, // Подгружаем данные из модели Group
                        attributes: ['locationName', 'locationUrl'], // Указываем, какие поля включить
                    },
                ]
            });
            const result = [];
            for (const training of trainings) {
                const { startTime, endTime, repeatType } = training;

                if (repeatType === 1) {
                    this.addRepeatedTrainings(result, training, startTime, endTime, requestedDate, 'day', endDate);
                } else if (repeatType === 2) {
                    this.addRepeatedTrainings(result, training, startTime, endTime, requestedDate, 'week', endDate);
                } else if (repeatType === 3) {
                    this.addRepeatedTrainings(result, training, startTime, endTime, requestedDate, 'month', endDate);
                } else if (repeatType === 4) {
                    if (this.isSameDay(requestedDate, startTime)) {
                        result.push(training);
                    }
                }
            }

            // Форматируем и группируем результаты
            const formattedResults = this.formatTrainingsByDate(result);

            return {
                page,
                totalTrainings: result.length,
                data: formattedResults.slice(0, limit), // Показ только первых 15 записей после группировки
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTrainingsForMonth(date: string) {
        try {
            // Парсим дату и находим начало и конец месяца
            const requestedDate = new Date(date);
            const startOfMonth = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), 1);
            const endOfMonth = new Date(requestedDate.getFullYear(), requestedDate.getMonth() + 1, 0);

            // Запрашиваем все тренировки в этом месяце
            const trainings = await this.trainingRepository.findAll({
                where: {
                    startTime: {
                        [Op.between]: [startOfMonth, endOfMonth],
                    },
                },
                order: [['startTime', 'ASC']], // Сортируем по startTime
                include: [
                    {
                        model: Group, // Подгружаем данные из модели Group
                        attributes: ['groupName', "color"], // Указываем, какие поля включить
                    },
                    {
                        model: Location, // Подгружаем данные из модели Group
                        attributes: ['locationName', 'locationUrl'], // Указываем, какие поля включить
                    },
                ]
            });

            const result = [];
            for (const training of trainings) {
                const { startTime, endTime, repeatType } = training;

                // Добавляем повторяющиеся тренировки в пределах месяца
                if (repeatType === 1) {
                    this.addRepeatedTrainings(result, training, startTime, endTime, startOfMonth, 'day', endOfMonth);
                } else if (repeatType === 2) {
                    this.addRepeatedTrainings(result, training, startTime, endTime, startOfMonth, 'week', endOfMonth);
                } else if (repeatType === 3) {
                    this.addRepeatedTrainings(result, training, startTime, endTime, startOfMonth, 'month', endOfMonth);
                } else if (repeatType === 4) {
                    if (this.isWithinMonth(startTime, startOfMonth, endOfMonth)) {
                        result.push(training);
                    }
                }
            }

            // Форматируем результаты по дате и дню недели
            return result;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTraining(id: number) {
        try {
            return await this.trainingRepository.findOne({
                where: { id },
                include: [
                    {
                        model: Group, // Подгружаем данные из модели Group
                        attributes: ['groupName', "color"], // Указываем, какие поля включить
                    },
                    {
                        model: Location, // Подгружаем данные из модели Group
                        attributes: ['locationName', 'locationUrl'], // Указываем, какие поля включить
                    },
                ]
            })

        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }


    // Helpres

    // Метод для форматирования и группировки тренировок по дате и дню недели на немецком
    private formatTrainingsByDate(trainings) {
        const daysOfWeek = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

        // Сортируем тренировки по startTime
        trainings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        const groupedTrainings = {};

        // Группируем тренировки по дате
        trainings.forEach((training) => {
            const date = new Date(training.startTime);
            const dayName = daysOfWeek[date.getDay()];
            const formattedDate = `${dayName}, ${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;

            if (!groupedTrainings[formattedDate]) {
                groupedTrainings[formattedDate] = [];
            }

            groupedTrainings[formattedDate].push(training);
        });

        // Преобразуем в массив объектов с датой и тренировками
        return Object.keys(groupedTrainings).map((date) => ({
            date,
            trainings: groupedTrainings[date],
        }));
    }

    // Добавляем повторяемые тренировки в результат
    private addRepeatedTrainings(result, training, startTime, endTime, requestedDate, interval, endDate) {
        let currentStart = new Date(startTime);
        let currentEnd = new Date(endTime);

        // Цикл продолжается, пока текущая дата не превышает endDate
        while (currentStart <= endDate) {
            // Добавляем тренировку, если дата совпадает или позже requestedDate
            if (currentStart >= requestedDate) {
                result.push({
                    ...training.toJSON(),
                    startTime: new Date(currentStart),
                    endTime: new Date(currentEnd),
                });
            }

            // Увеличиваем текущую дату в зависимости от интервала повторения
            if (interval === 'day') {
                currentStart.setDate(currentStart.getDate() + 1);
                currentEnd.setDate(currentEnd.getDate() + 1);
            } else if (interval === 'week') {
                currentStart.setDate(currentStart.getDate() + 7);
                currentEnd.setDate(currentEnd.getDate() + 7);
            } else if (interval === 'month') {
                currentStart.setMonth(currentStart.getMonth() + 1);
                currentEnd.setMonth(currentEnd.getMonth() + 1);
            }
        }
    }


    private isSameDay(date1: Date, date2: Date): boolean {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }




    private isWithinMonth(date: Date, startOfMonth: Date, endOfMonth: Date): boolean {
        return date >= startOfMonth && date <= endOfMonth;
    }

}
