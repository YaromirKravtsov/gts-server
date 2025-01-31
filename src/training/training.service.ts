import { forwardRef, Get, HttpException, HttpStatus, Inject, Injectable, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Training } from './training.model';
import { CreateTrainingDto } from './dto/create-training-dto';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { Model, Op, Sequelize } from 'sequelize';
import { Group } from '../../src/group/group.model';
import { Location } from 'src/location/location.model';
import { TrainingDates } from './trainig-dates.model';
import { DeleteTrainigDto } from './dto/delete-training';
import { UpdateTrainingDto } from './dto/update-trainig.dto';
import * as moment from 'moment-timezone';
import { ApplicationService } from 'src/application/application.service';
import { Application } from 'src/application/application.model';
import { User } from 'src/user/user.model';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/user.service';

interface FormattedTraining {
    id: number;
    name: string;
    locationId: number;
    groupId: number;
    trainerId?: number;
    startTime: string;
    endTime: string;
    applications: {
        playerName: string;
        playerEmail: string;
        playerPhone: string;
        playerId: string | number;
        isPresent: boolean;
        playerRole: string;
        id: number;
    }[];
    adminComment?: string;
}


@Injectable()
export class TrainingService {
    constructor(@InjectModel(Training) private trainingRepository: typeof Training,
        @InjectModel(TrainingDates) private trainingDatesRepository: typeof TrainingDates,
        @Inject(forwardRef(() => ApplicationService))
        private readonly applicationService: ApplicationService,
        private mailService: MailService,
        @Inject(forwardRef(() => UserService))
        private userService: UserService,
    ) { }

    async createTraining(dto: CreateTrainingDto) {
        const { startTime, endTime, repeat_type, groupId, locationId, adminComment, trainerId } = dto;

        const training = await this.trainingRepository.create({
            isTrail: true,
            startTime,
            endTime,
            repeatType: repeat_type,
            groupId,
            locationId
        });

        const trainingDates = [];

        let currentStartDate = moment.tz(startTime, 'Europe/Berlin').utcOffset('+01:00', true);
        let currentEndDate = moment.tz(endTime, 'Europe/Berlin').utcOffset('+01:00', true);

        const finalDate = currentStartDate.clone().add(6, 'months');

        while (currentStartDate.isSameOrBefore(finalDate)) {
            trainingDates.push({
                trainingId: training.id,
                startDate: currentStartDate.clone().utc().toDate(),
                endDate: currentEndDate.clone().utc().toDate(),
                adminComment,
                trainerId
            });

            if (repeat_type === 4) {
                break;
            }

            if (repeat_type === 1) {
                currentStartDate.add(1, 'day');
                currentEndDate.add(1, 'day');
            } else if (repeat_type === 2) {
                currentStartDate.add(1, 'week');
                currentEndDate.add(1, 'week');
            } else if (repeat_type === 3) {
                currentStartDate.add(1, 'month');
                currentEndDate.add(1, 'month');
            }
        }

        const savedTrainingDates = await this.trainingDatesRepository.bulkCreate(trainingDates);


        return {
            training,
            trainingDates: savedTrainingDates,
        };

    }

    async searchTrainings(date: string, groupId: string, locationId: string, page: string) {
        const recordsPerPage = 10;
        const pageNumber = parseInt(page, 10) || 1;
        const offset = (pageNumber - 1) * recordsPerPage;

        const currentDate = new Date();
        const startDate = date ? new Date(date) : currentDate;
        if (startDate < currentDate) startDate.setTime(currentDate.getTime());

        const trainingIds = await this.trainingRepository.findAll({
            where: {
                ...(groupId && { groupId: parseInt(groupId, 10) }),
                ...(locationId && { locationId: parseInt(locationId, 10) }),
            },
            attributes: ['id'], // выбираем только id
        }).then(trainings => trainings.map(training => training.id));

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

        const totalPages = Math.ceil(totalTrainingsCount / recordsPerPage);

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
                }

            ],
        });

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


            const trainingJson = trainingDate.training.toJSON();

            const trainingWithRightDates = {
                ...trainingJson,
                /*  playerPhone: trainingDate.user.username, */
                id: trainingDate.id,
                startTime: moment.tz(trainingDate.startDate, 'Europe/Berlin').format(),
                endTime: moment.tz(trainingDate.endDate, 'Europe/Berlin').format(),
            };
            console.log(trainingWithRightDates)
            acc[dateKey].trainings.push(trainingWithRightDates);

            return acc;
        }, {});

        return {
            trainings: Object.values(groupedByDate),
            totalPages,
            currentPage: pageNumber,
        };
    }

    async getTrainingsForMonth(date: string, trainerId?: number) {
        const startDate = new Date(date);
        const year = startDate.getFullYear();
        const month = startDate.getMonth();

        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 1);

        const whereConditions: any = {
            startDate: {
                [Op.gte]: monthStart,
                [Op.lt]: monthEnd,
            },
        };

        if (Number(trainerId)) {
            whereConditions.trainerId = trainerId;
        }

        const trainingDates = await this.trainingDatesRepository.findAll({
            where: whereConditions,
            attributes: [
                'id',
                'startDate',
                'endDate',
                [
                    Sequelize.fn('COUNT', Sequelize.col('applications.id')),
                    'applicationCount', // Добавляем поле для подсчёта
                ],
            ],
            include: [
                {
                    model: Training,
                    attributes: ['startTime', 'endTime'],
                    include: [
                        { model: Group, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                        { model: Location, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                    ],
                },
                {
                    model: Application,
                    attributes: [], // Не возвращаем сами записи из Application
                },
            ],
            group: ['TrainingDates.id'], // Группируем по TrainingDates
            order: [['startDate', 'ASC']],
        });

        return trainingDates.map(trainingDate => ({
            trainingDatesId: trainingDate.id,
            startTime: moment.tz(trainingDate.startDate, 'Europe/Berlin').format(),
            endTime: moment.tz(trainingDate.endDate, 'Europe/Berlin').format(),
            group: trainingDate.training.group,
            location: trainingDate.training.location,
            applicationCount: (trainingDate as any).getDataValue('applicationCount'), // Получаем количество заявок
        }));
    }



    // Получения записи конкретной тренировки 
    async getTraining(trainingDatesId: number): Promise<any> {
        console.log('trainingWithRightDates')
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
                    include: [User],
                },
            ],
        });

        if (!trainingDate) {
            throw new NotFoundException(`TrainingDates with ID ${trainingDatesId} not found`);
        }

        const training = trainingDate.training.toJSON(); // Преобразуем в простой объект

        // Преобразуем структуру заявок
        const applications = (trainingDate.applications || []).map((application) => ({
            playerName: application.user?.username || '', // Получаем имя игрока
            playerEmail: application.user?.email || '',  // Добавляем email игрока (если нужно)
            playerPhone: application.user?.phone || '',  // Добавляем телефон игрока (если нужно)
            playerId: application.user?.id || '',
            isPresent: application.isPresent,
            playerRole: application.user?.role || '',
            id: application.id,
        }));

        // Корректируем startTime и endTime
        const trainingWithRightDates = {
            ...training,
            startTime: moment.tz(trainingDate.startDate, 'Europe/Berlin').format(),
            endTime: moment.tz(trainingDate.endDate, 'Europe/Berlin').format(),
            applications, // Добавляем преобразованные заявки
            trainerId: trainingDate.trainerId,
            adminComment: trainingDate.adminComment
        };

        console.log(trainingWithRightDates);
        return trainingWithRightDates;
    }

    //  Удаление одной записи по trainingDatesId из TrainingDates
    async deleteTrainingDate(dto: DeleteTrainigDto): Promise<{ message: string }> {
        const { trainingDatesId, reason } = dto;

        console.log(`Начинаем процесс удаления тренировки с ID: ${trainingDatesId}`);

        const transaction = await this.trainingDatesRepository.sequelize.transaction();

        try {
            const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId, { transaction });

            if (!trainingDate) {
                throw new NotFoundException(`TrainingDates with ID ${trainingDatesId} not found`);
            }

            const date = this.formatTrainingDate(trainingDate.startDate, trainingDate.endDate);

            const training = await this.getTraining(trainingDatesId);


            const applications = await this.applicationService.getApplicationsByTrainingDateId(trainingDatesId);
            const cancellationMessage = [
                `Die Trainingseinheit, die am ${date} stattgefunden hätte, wurde leider abgesagt.\n`,
                `Der Trainingsort war geplant als: ${training.location.locationName}.\n`,
                `Die Gruppe wäre gewesen: ${training.group.groupName}.\n`,
                reason.trim() !== '' ? `Grund der Absage:\n ${reason}. \n ` : '',
                'Mit freundlichen Grüßen,\n Tennisschule Gorovits Team'
            ].join(' ').trim();

            for (const application of applications) {
                try {
                    const user = await this.userService.getUser(application.userId)
                    await this.mailService.notifyTrainingDeletion({
                        date, username: user.username, email: user.email, training, reason
                    })
                    await this.applicationService.destroyApplication(application.id);
                } catch (error) {
                    console.error(`Ошибка при обработке заявки ID ${application.id}:`, error);
                    throw new Error(`Ошибка удаления заявки ID ${application.id}: ${error.message}`);
                }
            }


            await trainingDate.destroy({ transaction });
            await transaction.commit();

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
            include: {
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
                    /*   await this.whatsAppService.sendMessage(
                          `${formattedPhone}`,
                          cancellationMessage
                      ); */
                    // TODO отправка письма на почту
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
        const { trainingDatesId, startTime, endTime, trainerId, adminComment } = dto;
        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId, {
            include: [{
                model: Application,
                include: [User]
            }],
        });

        if (!trainingDate) {
            throw new NotFoundException(`Training with ID ${trainingDatesId} not found`);
        }

        const training = await this.getTraining(dto.trainingDatesId);


        const trainingStart = new Date(training.startTime);
        const trainingEnd = new Date(training.endTime);
        const newStart = new Date(startTime);
        const newEnd = new Date(endTime);

        await trainingDate.update(
            {
                trainerId: trainerId == 0 ? null : trainerId,
                adminComment
            }
        );

        if (!isNaN(trainingStart.getTime()) && !isNaN(trainingEnd.getTime())) {
            if (newStart.getTime() === trainingStart.getTime() && newEnd.getTime() === trainingEnd.getTime()) {
                return;
            }
        } else {
            console.error("Ошибка: training.startTime или training.endTime не являются корректными датами", training.startTime, training.endTime);
        }

        await trainingDate.update(
            {
                startDate: startTime,
                endDate: endTime,
            }
        );

        const date = this.formatTrainingDate(
            trainingDate.startDate,
            trainingDate.endDate,
        );

        for (const application of trainingDate.applications) {
            const user = await this.userService.getUser(application.userId)
            await this.mailService.notifyTimeChange({
                date, username: user.username, email: user.email, training
            })
        }

        return { message: `Training and all related TrainingDates with ID ${trainingDatesId} have been updated` };
    }

    async updateAll(dto: UpdateTrainingDto): Promise<{ message: string }> {
        const { trainingDatesId, startTime, endTime, trainerId, adminComment } = dto;

        // Проверяем, существует ли запись о тренировке
        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId);
        if (!trainingDate) {
            throw new NotFoundException(`TrainingDate with ID ${trainingDatesId} not found`);
        }

        // Загружаем тренировку и связанные с ней данные
        const training = await this.trainingRepository.findByPk(trainingDate.trainingId, {
            include: [
                {
                    model: TrainingDates,
                    include: [
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

        const trainingStart = new Date(training.startTime);
        const trainingEnd = new Date(training.endTime);
        const newStart = new Date(startTime);
        const newEnd = new Date(endTime);

        // Если время не изменилось, обновляем только тренера и комментарий
        if (!isNaN(trainingStart.getTime()) && !isNaN(trainingEnd.getTime())) {
            if (newStart.getTime() === trainingStart.getTime() && newEnd.getTime() === trainingEnd.getTime()) {
                console.log('Nur Trainer geändert');
                await trainingDate.update({ trainerId: trainerId == 0 ? null : trainerId, adminComment });
                return { message: "Trainer und Kommentar aktualisiert." };
            }
        } else {
            console.error("Fehler: training.startTime oder training.endTime ist keine gültige Zeit", training.startTime, training.endTime);
        }

        const updatedTrainingDates = [];
        for (const date of training.trainigDates) {
            const updatedStartDate = moment(date.startDate).set({
                hour: newStart.getHours(),
                minute: newStart.getMinutes()
            }).toDate();

            const updatedEndDate = moment(date.endDate).set({
                hour: newEnd.getHours(),
                minute: newEnd.getMinutes()
            }).toDate();

            await this.trainingDatesRepository.update(
                { startDate: updatedStartDate, endDate: updatedEndDate, trainerId: trainerId == 0 ? null : trainerId, adminComment },
                { where: { id: date.id } }
            );

            updatedTrainingDates.push({ startDate: updatedStartDate, endDate: updatedEndDate });
        }

      /*   for (const date of training.trainigDates) {
            for (const application of date.applications) {
                const date = this.formatTrainingDate(
                    trainingDate.startDate,
                    trainingDate.endDate,
                );
                const user = await this.userService.getUser(application.userId)
                await this.mailService.notifyTimeChange({
                    date, username: user.username, email: user.email, training
                })
            }
        } */ // TODO Присылается дофига писем

        return { message: `Training und alle zugehörigen TrainingDates mit ID ${training.id} wurden aktualisiert.` };
    }

    async getDateTraingsIdsByDateTraingId(trainingId: number): Promise<number[]> {
        const training = await this.trainingRepository.findByPk(trainingId, {
            include: [
                {
                    model: TrainingDates,
                    attributes: ['id'],
                },
            ],
        });

        if (!training) {
            throw new HttpException('Training not found', HttpStatus.NOT_FOUND);
        }

        const dateTrainingIds = training.trainigDates.map((date: TrainingDates) => date.id);

        return dateTrainingIds;
    }

    private formatTrainingDate(startDate: Date, endDate: Date): string {
        const format = 'DD.MM.YYYY HH:mm';
        const start = moment(startDate).tz('Europe/Berlin').format(format);
        const end = moment(endDate).tz('Europe/Berlin').format('HH:mm'); 
        return `${start} - ${end}`;
    }

    public formatPhoneNumber(phone: string): string {
        let cleanedPhone = phone.replace(/\D/g, ''); 

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
