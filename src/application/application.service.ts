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
@Injectable()
export class ApplicationService {
    constructor(@InjectModel(Application) private applicationRepository: typeof Application,
        @InjectModel(TrainingDates) private trainingDatesRepository: typeof TrainingDates,
        private readonly whatsappService: WhatsAppService,
        @Inject(forwardRef(() => TrainingService))
        private readonly trainingService: TrainingService,
        private readonly userService: UserService

    ) { }

    // Создание новой заявки
    async createApplication(dto: CreateApplicationDto): Promise<Application> {

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
            userId: user.userId
        });

        const training = await this.trainingService.getTraining(dto.trainingDatesId);


        const date = this.formatTrainingDate(trainingDate.startDate, trainingDate.endDate);

        const deleteLink = `${process.env.FRONT_URL}?action=delete-anmeldung&application_id=${application.id}&playerName=${encodeURIComponent(dto.playerName)}&playerPhone=${encodeURIComponent(dto.playerPhone)}`;

        const message = [
            `Hallo, ${dto.playerName}  \n`,
            'Ihre Anmeldung zum Probetraining war erfolgreich! Hier sind die Details:\n',
            `- *Zeit:* ${date}\n`,
            `- *Ort:* ${training.location.locationName}\n`,
            `- *Gruppe:* ${training.group.groupName}\n`,
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
                await this.whatsappService.sendMessage(formattedPhone, message);
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

        const { userId, trainingDatesId } = dto
        const player = await this.userService.getUser(userId);

        if (!player) {
            throw new HttpException('Player wurde nicht gefunden', HttpStatus.NOT_FOUND);
        }

        const trainingDate = await this.trainingDatesRepository.findByPk(trainingDatesId)

        if (!trainingDate) {
            throw new HttpException('Training wurde nicht gefunden', HttpStatus.NOT_FOUND);
        }

        const application = await this.applicationRepository.create({
            isPresent: false,
            trainingDatesId,
            userId

        })
        return application;
    }
    
    async getApplicationsByTrainingDateId(trainingDatesId: number) {
        return this.applicationRepository.findAll({ where: { trainingDatesId } });
    }

    /*   async getApplicationsByTrainingId(trainingId: number): Promise<Application[]> {
          return await this.applicationRepository.findAll({
              where: {id: trainingId },
          });
      } */


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
            /*             playerName: application.playerName, */
            startDate: moment.tz(application.trainingDates.startDate, 'Europe/Berlin').format(),
            endDate: moment.tz(application.trainingDates.endDate, 'Europe/Berlin').format(),
            location: application.trainingDates.training.location,
            group: application.trainingDates.training.group,
        }));
    }
    //
    async geApplication(id: number) {
        console.log(id);

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
            ],
            /*  order: [['trainingDates', 'startDate', 'ASC']], */
        });

        // Форматируем результат в нужный вид
        //DOTO прееделать передачу playerName и playerPhone через таблицу юзеров. Сохранить название параметров
        return {
            trainingDatesId: application.trainingDatesId,
            /*        playerName: application.playerName, */
            playerComment: application.playerComment,
            /*          playerPhone: application.playerPhone, */
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

    //TODO Переделать логику удаления записи Application. Создавать какой-то ключ и передавать его 
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
