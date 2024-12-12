import { BadRequestException, forwardRef, HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Application } from './application.model';
import { Training } from 'src/training/training.model';
import { Op } from 'sequelize';
import { Group } from '../../src/group/group.model';
import { Location } from 'src/location/location.model';
import { TrainingDates } from 'src/training/trainig-dates.model';
import * as moment from 'moment-timezone';
import { WhatsAppService } from 'src/whatsapp/whatsapp/whatsapp.service';
import { TrainingService } from 'src/training/training.service';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { UserService } from 'src/user/user.service';
import { AddRegularPlayerToTraing } from './dto/add-regular-player-to-training.dto';
import { User } from 'src/user/user.model';
@Injectable()
export class ApplicationService {
    constructor(@InjectModel(Application) private applicationRepository: typeof Application,
        @InjectModel(TrainingDates) private trainingDatesRepository: typeof TrainingDates,
        private readonly whatsappService: WhatsAppService,
        @Inject(forwardRef(() => TrainingService))
        private readonly trainingService: TrainingService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService

    ) { }

    // Создание новой заявки
    async createApplication(dto: CreateApplicationDto) {

        const trainingDate = await this.trainingDatesRepository.findByPk(dto.trainingDatesId);
        if (!trainingDate) {
            throw new NotFoundException(`TrainingDates with ID ${dto.trainingDatesId} not found`);
        }

        const formattedPhone = this.formatPhoneNumber(dto.playerPhone);

        const isRegistered = await this.whatsappService.isWhatsAppRegistered(formattedPhone);
        if (!isRegistered) {
            console.error('Invalid phone number');
            throw new BadRequestException(`Ungültige Telefonnummer: WhatsApp konnte Ihre Nummer nicht finden.`);
        }

        const user = await this.userService.createNewUser({
            username: dto.playerName,
            phone: dto.playerPhone,
            role: 'newPlayer'
        })

        const application = await this.applicationRepository.create({
            playerComment: dto.playerComment,
            trainingDatesId: dto.trainingDatesId,
            isPresent: false,
            userId: user.id
        });

        const training = await this.trainingService.getTraining(dto.trainingDatesId);


        const date = this.formatTrainingDate(trainingDate.startDate, trainingDate.endDate);

        const deleteLink = `${process.env.FRONT_URL}?action=delete-anmeldung&application_id=${application.id}&playerName=${encodeURIComponent(dto.playerName)}&playerPhone=${encodeURIComponent(dto.playerPhone)}`;
        console.log(trainingDate)
        let trainer = null;
        if(trainingDate.trainerId){
            trainer = await this.userService.findByPk(trainingDate.trainerId)
            
        }
        const message = [
            `Hallo, ${dto.playerName}  \n`,
            'Ihre Anmeldung zum Probetraining war erfolgreich! Hier sind die Details:\n',
            `- *Zeit:* ${date}\n`,
            `- *Ort:* ${training.location.locationName}\n`,
            `- *Gruppe:* ${training.group.groupName}\n`,
            trainingDate.trainerId ? `*Trainer:* ${trainer.username}\n`: '',
            `Falls Sie Ihre Anmeldung stornieren möchten, können Sie dies über folgenden Link tun: ${deleteLink}\n\n`,
            'Wir freuen uns darauf, Sie beim Training zu sehen!\n',
            'Mit freundlichen Grüßen,\n Tennisschule Gorovits Team'
        ].join('').trim();

        const groupMessage = [
            `*Neue Registrierung für das Probetraining*\n`,
            `*Zeit:* ${date}\n`,
            `*Ort:* ${training.location.locationName}\n`,
            `*Gruppe:* ${training.group.groupName}\n`,
            `*Spieler:* ${dto.playerName}\n`,
            `*Telefonnummer:* ${dto.playerPhone}`,

            dto.playerComment ? `\n*Kommentar:* ${dto.playerComment}` : ''
        ].join('').trim();

        setImmediate(async () => {
            try {
                //TODO После того как мариана напишет тексты для всех пользователей, то поменяться их 
                await this.whatsappService.sendMessage(formattedPhone, message, training.group.isToAdult);
                await this.whatsappService.sendMessageToGroup(groupMessage);
            } catch (error) {
                console.error(error);
                throw new HttpException(
                    error.message || 'Internal Server Error',
                    error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        });

        console.log('Application process completed');
        return application;
    }

    async addRegularPlayerToTraining(dto: AddRegularPlayerToTraing) {
        const { userId, trainingDatesId } = dto;
    
        // Проверяем, существует ли указанная дата тренировки
        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId);
        if (!trainingDate) {
            throw new HttpException('Training wurde nicht gefunden', HttpStatus.NOT_FOUND);
        }
    
        // Проверяем, есть ли уже запись на эту тренировку для данного пользователя
        const existingApplication = await this.applicationRepository.findOne({
            where: {
                trainingDatesId,
                userId,
            },
        });
    
        if (existingApplication) {
            throw new HttpException('Benutzer ist bereits für dieses Training registriert', HttpStatus.CONFLICT);
        }
    
        // Если записи нет, создаём новое приложение
        const application = await this.applicationRepository.create({
            isPresent: false,
            trainingDatesId,
            userId,
        });
    
        return application;
    }
    

    async addRegularPlayerToAllTraining(dto) {
        const { userId, trainingId } = dto;
        const player = await this.userService.getUser(userId);
    
        if (!player) {
            throw new HttpException('Player wurde nicht gefunden', HttpStatus.NOT_FOUND);
        }
    
        const dateTraingsIds = await this.trainingService.getDateTraingsIdsByDateTraingId(trainingId);
    
        if (!dateTraingsIds || dateTraingsIds.length === 0) {
            throw new HttpException('Training wurde nicht gefunden', HttpStatus.NOT_FOUND);
        }
    
        const applications = [];
    
        for (const trainingDatesId of dateTraingsIds) {
            // Проверка на существующую регистрацию
            const existingApplication = await this.applicationRepository.findOne({
                where: {
                    trainingDatesId,
                    userId,
                },
            });
    
            if (!existingApplication) {
                // Если не зарегистрирован, создаём новую запись
                const application = await this.applicationRepository.create({
                    isPresent: false,
                    trainingDatesId,
                    userId,
                });
                applications.push(application);
            }
        }
    
        return applications;
    }
    
    

    async deletePlayerApplication(applicationId: number) {
        const application = await this.applicationRepository.findByPk(applicationId)
        if (!application) {
            throw new HttpException('Anmeldung wurde nicht gefunden', HttpStatus.NOT_FOUND);
        }
        await application.destroy();

        return;
    }


    async deleteAllPlayerApplicationToThisTraining(dto) {
        const { trainingId, userId } = dto;
        console.log('Training ID:', trainingId, 'User ID:', userId);
    
        const dateTraingsIds = await this.trainingService.getDateTraingsIdsByDateTraingId(trainingId);
    
        if (!Array.isArray(dateTraingsIds) || dateTraingsIds.length === 0) {
            throw new HttpException('Anmeldung wurde nicht gefunden', HttpStatus.NOT_FOUND);
        }
        console.log('Date Training IDs:', dateTraingsIds);
    
        const deletedCount = await this.applicationRepository.destroy({
            where: {
                trainingDatesId: {
                    [Op.in]: dateTraingsIds, // Проверяем, что trainingDatesId входит в массив
                },
                userId: userId,
            },
        });
    
        console.log(`${deletedCount} applications deleted`);
        return;
    }
    
    

    async getApplicationsByTrainingDateId(trainingDatesId: number) {
        return this.applicationRepository.findAll({ where: { trainingDatesId }, include: [User] });
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
                {
                    model: User
                }
            ],
            order: [['trainingDates', 'startDate', 'ASC']], // Изменено на 'startDate'
        });

        // Форматируем результат в нужный вид
        return applications.map(application => ({
            id: application.id,
            trainingDatesId: application.trainingDatesId,
            playerName: application.user.username,
            startDate: moment.tz(application.trainingDates.startDate, 'Europe/Berlin').format(),
            endDate: moment.tz(application.trainingDates.endDate, 'Europe/Berlin').format(),
            location: application.trainingDates.training.location,
            group: application.trainingDates.training.group,
        }));
    }
    //
    async geApplication(id: number) {
        const application = await this.applicationRepository.findOne({
            where: { id },
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
                {
                    model: User
                }
            ],

            /*  order: [['trainingDates', 'startDate', 'ASC']], */
        });

     /*    console.log({
            trainingDatesId: application.trainingDatesId,
            playerName: application.user.username,
            playerComment: application.playerComment,
            playerPhone: application.user.phone,
            startDate: moment.tz(application.trainingDates.startDate, 'Europe/Berlin').format(),
            endDate: moment.tz(application.trainingDates.endDate, 'Europe/Berlin').format(),
            location: application.trainingDates.training.location,
            group: application.trainingDates.training.group,
        }) */
        return {
            trainingDatesId: application.trainingDatesId,
            playerName: application.user.username,
            playerComment: application.playerComment,
            playerPhone: application.user.phone,
            startDate: moment.tz(application.trainingDates.startDate, 'Europe/Berlin').format(),
            endDate: moment.tz(application.trainingDates.endDate, 'Europe/Berlin').format(),
            location: application.trainingDates.training.location,
            group: application.trainingDates.training.group,
        }
    }

    async destroyApplication(id: number) {
        const application = await this.applicationRepository.findOne({
            where: {
                id,
            }
        });
        if (!application) {
            throw new NotFoundException(`Die Registrierung wurde nicht gefunden`);
        }
        return await this.applicationRepository.destroy({
            where: { id },
        });
    }

    async deleteApplication(id: string, playerName: string, playerPhone: string) {
        const application = await this.applicationRepository.findOne({
            where: {
                id, /* playerName, playerPhone */
            }
        })
        console.log(id, playerName, playerPhone)
        console.log(application)

        if (!application) {
            throw new NotFoundException(`Die Registrierung wurde nicht gefunden`);
        }
        return await this.applicationRepository.destroy({
            where: { id },
        });
    }

    async putIsPresent(applicationId:number) {
        console.log('applicationId putIsPresent ' + applicationId);
        const application = await this.applicationRepository.findByPk(applicationId);
        if (!application) {
            throw new NotFoundException(`Die Registrierung wurde nicht gefunden`);
        }
        await application.update({
            isPresent: !application.isPresent
        })
        return {
            id: application.id,
            isPresent: application.isPresent
        }
    }

    // 
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

    // Метод для форматирования телефона
    private formatPhoneNumber(phone: string): string {
        let cleanedPhone = phone.replace(/\D/g, ''); // Удалить все символы, кроме цифр

        if (phone.startsWith('+')) {
            // Если номер уже начинается с "+" — убираем всё кроме цифр и возвращаем
            return phone.replace(/\s/g, ''); // Удалить пробелы, но оставить "+"
        }

        if (cleanedPhone.startsWith('0')) {
            // Если номер начинается с "0", предполагаем, что это немецкий номер
            cleanedPhone = '49' + cleanedPhone.slice(1); // Заменяем "0" на код страны "49"
        }

        // Если номер начинается с кода "49" (Германия) или других международных кодов, возвращаем
        if (cleanedPhone.startsWith('49') || cleanedPhone.startsWith('380')) {
            return '+' + cleanedPhone; // Добавляем "+" в начале, если его нет
        }

        console.log('Invalid phone number format');
        throw new Error('Invalid phone number format');
    }

    public async deleteAllUserApplications(userId: number){
        await this.applicationRepository.destroy({where: {userId}})
    }
    // Метод для форматирования даты в нужном формате
    private formatTrainingDate(startDate: Date, endDate: Date): string {
        const format = 'DD.MM.YYYY HH:mm';
        const start = moment(startDate).tz('Europe/Berlin').format(format);
        const end = moment(endDate).tz('Europe/Berlin').format('HH:mm'); // Только время для конца
        return `${start} - ${end}`;
    }

    async isValidPhoneNumber(phone: string): Promise<boolean> {
        // Проверяем формат номера через libphonenumber-js
        const phoneNumber = parsePhoneNumberFromString(phone);
        if (!phoneNumber?.isValid()) {
            return false;
        }

        // Проверяем регистрацию номера в WhatsApp
        const isRegistered = await this.whatsappService.isWhatsAppRegistered(phoneNumber.number);
        console.log(isRegistered)
        return isRegistered;
    }




}
