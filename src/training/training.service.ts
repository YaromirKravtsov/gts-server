import { forwardRef, Get, HttpException, HttpStatus, Inject, Injectable, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Training } from './training.model';
import { CreateTrainingDto } from './dto/create-training-dto';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { Model, Op } from 'sequelize';
import { Group } from '../../src/group/group.model';
import { Location } from 'src/location/location.model';
import { TrainingDates } from './trainig-dates.model';
import { DeleteTrainigDto } from './dto/delete-training';
import { UpdateTrainingDto } from './dto/update-trainig.dto';
import * as moment from 'moment-timezone';
import { WhatsAppService } from 'src/whatsapp/whatsapp/whatsapp.service';
import { ApplicationService } from 'src/application/application.service';
import { Application } from 'src/application/application.model';
import { User } from 'src/user/user.model';

@Injectable()
export class TrainingService {
    constructor(@InjectModel(Training) private trainingRepository: typeof Training,
        @InjectModel(TrainingDates) private trainingDatesRepository: typeof TrainingDates,
        private whatsAppService: WhatsAppService,
        @Inject(forwardRef(() => ApplicationService))
        private readonly applicationService: ApplicationService,
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

            // Если repeat_type === 4, создаем только одну запись и выходим из цикла
            if (repeat_type === 4) {
                break;
            }

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
                {
                    model: Application,
                    include: [User]
                }
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
            applications: trainingDate.applications || [], // Добавляем массив заявок
        };

        return trainingWithRightDates;

    }

    //  Удаление одной записи по trainingDatesId из TrainingDates
    async deleteTrainingDate(dto: DeleteTrainigDto): Promise<{ message: string }> {
        const { trainingDatesId, reason } = dto;

        console.log(`Начинаем процесс удаления тренировки с ID: ${trainingDatesId}`);

        const transaction = await this.trainingDatesRepository.sequelize.transaction();

        try {
            const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId, { transaction });
            console.log('Получили тренировочную дату из базы данных:', trainingDate);

            if (!trainingDate) {
                console.error(`Тренировка с ID ${trainingDatesId} не найдена`);
                throw new NotFoundException(`TrainingDates with ID ${trainingDatesId} not found`);
            }

            const date = this.formatTrainingDate(trainingDate.startDate, trainingDate.endDate);
            console.log('Форматированная дата тренировки:', date);

            const training = await this.getTraining(trainingDatesId);
            console.log('Получили детали тренировки:', training);

            const cancellationMessage = [
                `Die Trainingseinheit, die am ${date} stattgefunden hätte, wurde leider abgesagt.\n`,
                `Der Trainingsort war geplant als: ${training.location.locationName}.\n`,
                `Die Gruppe wäre gewesen: ${training.group.groupName}.\n`,
                reason.trim() !== '' ? `Grund der Absage:\n ${reason}. \n ` : '',
                'Mit freundlichen Grüßen,\n Tennisschule Gorovits Team'
            ].join(' ').trim();
            console.log('Сформировано сообщение об отмене:', cancellationMessage);

            const applications = await this.applicationService.getApplicationsByTrainingDateId(trainingDatesId);
            console.log(`Получено ${applications.length} заявок, связанных с тренировкой.`);

            for (const application of applications) {
                try {
                    const formattedPhone = this.formatPhoneNumber(application.user.phone);
                    console.log(`Обработка заявки ID: ${application.id}, телефон игрока: ${formattedPhone}`);

                    await this.whatsAppService.sendMessage(formattedPhone, cancellationMessage);
                    console.log(`Сообщение успешно отправлено игроку ${formattedPhone}`);

                    await this.applicationService.destroyApplication(application.id);
                    console.log(`Заявка ID ${application.id} успешно удалена`);
                } catch (error) {
                    console.error(`Ошибка при обработке заявки ID ${application.id}:`, error);
                    throw new Error(`Ошибка удаления заявки ID ${application.id}: ${error.message}`);
                }
            }

            console.log('Все заявки успешно удалены. Переходим к удалению тренировки...');

            // Удаляем тренировку
            await trainingDate.destroy({ transaction });
            console.log(`Тренировка с ID ${trainingDatesId} успешно удалена`);

            // Подтверждаем транзакцию
            await transaction.commit();

            console.log(`Процесс удаления тренировки с ID ${trainingDatesId} успешно завершен`);
            return { message: `TrainingDates with ID ${trainingDatesId} has been deleted` };

        } catch (error) {
            console.error(`Ошибка в процессе удаления тренировки с ID ${trainingDatesId}:`, error);

            // Откат транзакции при ошибке
            await transaction.rollback();
            throw error;
        }
    }





    // Удаление всех записей по trainingId из TrainingDates и удаление самой Training
    async deleteTrainingAndDates(dto: DeleteTrainigDto): Promise<{ message: string }> {
        const { trainingDatesId, reason } = dto;
        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId);

        if (!trainingDate) {
            throw new NotFoundException(`Training with ID ${trainingDatesId} not found`);
        }

        const trainingId = trainingDate.trainingId;

        const date = this.formatTrainingDate(trainingDate.startDate, trainingDate.endDate);
        const training = await this.getTraining(trainingDatesId);

        const cancellationMessage = [
            `Die Trainingseinheit, die am ${date} stattgefunden hätte, wurde leider abgesagt.\n`,
            `Der Trainingsort war geplant als: ${training.location.locationName}.\n`,
            `Die Gruppe wäre gewesen: ${training.group.groupName}.\n`,
            reason.trim() !== '' ? `Grund der Absage:\n ${reason}. \n ` : '',
            'Mit freundlichen Grüßen,\n Tennisschule Gorovits Team'
        ].join(' ').trim();

        const trainingDates = await this.trainingDatesRepository.findAll({
            where: { trainingId },
            include:  {
                model: Application,
                include: [User]
            }, // Загружаем заявки на каждую дату тренировки
        });


        const currentTimeBerlin = moment().tz('Europe/Berlin');

        for (const date of trainingDates) {
            if (moment(date.startDate).isBefore(currentTimeBerlin)) {
                console.log(`Пропущено: дата тренировки ${date.startDate} уже прошла.`);
                continue; // Пропускаем обработку старых тренировок
            }

            for (const application of date.applications) {

                const formattedPhone = this.formatPhoneNumber(application.user.phone);

                try {
                    await this.whatsAppService.sendMessage(
                        `${formattedPhone}`,
                        cancellationMessage
                    );
                } catch (error) {
                    console.error('Ошибка при отправке сообщения в WhatsApp:', error);
                }

                await this.applicationService.destroyApplication(application.id);
            }
        }

        await this.trainingDatesRepository.destroy({
            where: { trainingId },
        });

        await this.trainingRepository.destroy({
            where: { id: trainingId },
        });

        return { message: `Training and all related TrainingDates with ID ${trainingDatesId} have been deleted` };
    }



    async update(dto: UpdateTrainingDto): Promise<{ message: string }> {
        const { trainingDatesId, startTime, endTime } = dto;
        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId, {
            include: [Application], // Загружаем заявки, связанные с датой тренировки
        });

        // Проверка существования даты тренировки
        if (!trainingDate) {
            throw new NotFoundException(`Training with ID ${trainingDatesId} not found`);
        }

        // Получаем основную тренировку и форматируем новую дату
        const training = await this.getTraining(dto.trainingDatesId); // Получаем детали тренировки
        const newDate = this.formatTrainingDate(startTime, endTime);

        // Сообщение о переносе тренировки
        const rescheduleMessage = [
            `Die Trainingseinheit wurde auf einen neuen Zeitpunkt verlegt.\n`,
            `*Neuer Zeitpunkt:* ${newDate}\n`,
            `*Ort:* ${training.location.locationName}\n`,
            `*Gruppe:* ${training.group.groupName}\n`,
            `Wir freuen uns darauf, Sie zum neuen Zeitpunkt zu sehen!`,
            'Mit freundlichen Grüßen,\n Tennisschule Gorovits Team'
        ].join(' ').trim();

        // Обновление даты тренировки
        await this.trainingDatesRepository.update(
            {
                startDate: startTime,
                endDate: endTime,
            },
            {
                where: { id: trainingDatesId },
            }
        );

        // Отправляем уведомление всем участникам, зарегистрированным на обновленную дату
        for (const application of trainingDate.applications) {

            const formattedPhone = this.formatPhoneNumber(application.user.phone);
            setTimeout(async () => {
                try {
                    await this.whatsAppService.sendMessage(formattedPhone, rescheduleMessage);
                } catch (error) {
                    console.error('Ошибка при отправке сообщения в WhatsApp:', error);
                }
            }, 0);
        }

        return { message: `Training and all related TrainingDates with ID ${trainingDatesId} have been updated` };
    }


    async updateAll(dto: UpdateTrainingDto): Promise<{ message: string }> {
        const { trainingDatesId, startTime, endTime } = dto;

        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId);
        if (!trainingDate) {
            throw new NotFoundException(`TrainingDate with ID ${trainingDatesId} not found`);
        }

        const training = await this.trainingRepository.findByPk(trainingDate.trainingId, {
            include: [
                {
                    model: TrainingDates,
                    include:
                        [
                            {
                                model: Application,
                                include: [User]
                            }
                        ]
                },

                { model: Location },
                { model: Group }
            ],
        });

        
        if (!training) {
            throw new NotFoundException(`Training with ID ${trainingDate.trainingId} not found`);
        }

        if (!training.location) {
            throw new NotFoundException(`Location for Training with ID ${trainingDate.trainingId} not found`);
        }

        if (!training.group) {
            throw new NotFoundException(`Group for Training with ID ${trainingDate.trainingId} not found`);
        }

        const newStartTime = moment(startTime).format('HH:mm');
        const newEndTime = moment(endTime).format('HH:mm');

        const updatedTrainingDates = [];
        for (const date of training.trainigDates) {
            const updatedStartDate = moment(date.startDate).set({
                hour: parseInt(newStartTime.split(':')[0], 10),
                minute: parseInt(newStartTime.split(':')[1], 10)
            }).toDate();

            const updatedEndDate = moment(date.endDate).set({
                hour: parseInt(newEndTime.split(':')[0], 10),
                minute: parseInt(newEndTime.split(':')[1], 10)
            }).toDate();

            await this.trainingDatesRepository.update(
                { startDate: updatedStartDate, endDate: updatedEndDate },
                { where: { id: date.id } }
            );

            updatedTrainingDates.push({ startDate: updatedStartDate, endDate: updatedEndDate });
        }

        const newDateMessage = [
            `Die Trainingseinheit wurde auf eine neue Zeit verlegt.\n`,
            `*Neue Zeitpunkte:* Die ersten Trainingseinheiten beginnen um ${newStartTime} und enden um ${newEndTime}.\n`,
            `*Ort:* ${training.location.locationName}\n`,
            `*Gruppe:* ${training.group.groupName}\n`,
            `Bitte beachten Sie die neue Uhrzeit für Ihre Trainings.`,
            'Mit freundlichen Grüßen,\n Tennisschule Gorovits Team'
        ].join(' ').trim();


        for (const date of training.trainigDates) {
            for (const application of date.applications) {
              

                const formattedPhone = this.formatPhoneNumber(application.user.phone);

                setTimeout(async () => {
                    try {
                        await this.whatsAppService.sendMessage(formattedPhone, newDateMessage);
                    } catch (error) {
                        console.error('Ошибка при отправке сообщения в WhatsApp:', error);
                    }
                }, 0);
            }
        }

        return { message: `Training and all related TrainingDates with ID ${training.id} have been updated with new times` };
    }





    private formatTrainingDate(startDate: Date, endDate: Date): string {
        const format = 'DD.MM.YYYY HH:mm';
        const start = moment(startDate).tz('Europe/Berlin').format(format);
        const end = moment(endDate).tz('Europe/Berlin').format('HH:mm'); // Только время для конца
        return `${start} - ${end}`;
    }


    public formatPhoneNumber(phone: string): string {
        let cleanedPhone = phone.replace(/\D/g, ''); // Удалить все символы, кроме цифр

        if (phone.startsWith('+')) {
            return phone.replace(/\s/g, '');
        }

        if (cleanedPhone.startsWith('0')) {
            cleanedPhone = '49' + cleanedPhone.slice(1);
        }

        if (cleanedPhone.startsWith('49') || cleanedPhone.startsWith('380')) {
            return '+' + cleanedPhone;
        }

        console.log('Invalid phone number format');
        throw new Error('Invalid phone number format')
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
