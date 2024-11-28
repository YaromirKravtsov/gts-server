import { BadRequestException, forwardRef, HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Application } from './application.model';
import { Training } from 'src/training/training.model';
import { Op } from 'sequelize';
import { Group } from 'src/group/group.model';
import { Location } from 'src/location/location.model';
import { TrainingDates } from 'src/training/trainig-dates.model';
import * as moment from 'moment-timezone';
import { WhatsAppService } from 'src/whatsapp/whatsapp/whatsapp.service';
import { TrainingService } from 'src/training/training.service';
import {parsePhoneNumberFromString} from 'libphonenumber-js';
@Injectable()
export class ApplicationService {
    constructor(@InjectModel(Application) private applicationRepository: typeof Application,
        @InjectModel(TrainingDates) private trainingDatesRepository: typeof TrainingDates,
        private readonly whatsappService: WhatsAppService,
        @Inject(forwardRef(() => TrainingService))
        private readonly trainingService: TrainingService,

    ) { }

    // Создание новой заявки
    async createApplication(dto: CreateApplicationDto): Promise<Application> {
        console.log('Starting createApplication process');
    
        // Поиск TrainingDate
        const trainingDate = await this.trainingDatesRepository.findByPk(dto.trainingDatesId);
        if (!trainingDate) {
            throw new NotFoundException(`TrainingDates with ID ${dto.trainingDatesId} not found`);
        }
    
        // Форматирование номера телефона
        const formattedPhone = this.formatPhoneNumber(dto.playerPhone);
    
        // Проверка номера телефона
        console.log('Validating phone number ' + formattedPhone);
        const isRegistered = await this.whatsappService.isWhatsAppRegistered(formattedPhone);
        if (!isRegistered) {
            console.error('Invalid phone number');
            throw new BadRequestException(`Ungültige Telefonnummer: WhatsApp konnte Ihre Nummer nicht finden.`);
        }
        console.log('Phone number is valid');
    
        // Создание записи в таблице Application
        console.log('Creating new application with data:', dto);
        const application = await this.applicationRepository.create(dto);
        console.log('Created application:', application);
    
        // Получение информации о тренировке
        console.log('Fetching training details for TrainingDates ID:', dto.trainingDatesId);
        const training = await this.trainingService.getTraining(dto.trainingDatesId);
        console.log('Fetched training details:', training);
    
        // Форматирование даты тренировки
        console.log('Formatting training date:', trainingDate.startDate, trainingDate.endDate);
        const date = this.formatTrainingDate(trainingDate.startDate, trainingDate.endDate);
        console.log('Formatted date:', date);
    
        // Генерация ссылки для удаления заявки
        console.log('Generating delete link');
        const deleteLink = `${process.env.FRONT_URL}?action=delete-anmeldung&application_id=${application.id}&playerName=${encodeURIComponent(dto.playerName)}&playerPhone=${encodeURIComponent(dto.playerPhone)}`;
        console.log('Generated delete link:', deleteLink);
    
        // Создание сообщений для отправки
        console.log('Creating messages for WhatsApp');
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
        console.log('Message for player:', message);
    
        const groupMessage = [
            `*Neue Registrierung für das Probetraining*\n`,
            `*Zeit:* ${date}\n`,
            `*Ort:* ${training.location.locationName}\n`,
            `*Gruppe:* ${training.group.groupName}\n`,
            `*Spieler:* ${dto.playerName}\n`,
            `*Telefonnummer:* ${dto.playerPhone}`,

            dto.playerComment ? `\n*Kommentar:* ${dto.playerComment}` : ''
        ].join('').trim();
        console.log('Message for group:', groupMessage);
    
        // Запуск отправки сообщений в отдельном потоке
        setImmediate(async () => {
            console.log('Sending messages via WhatsApp asynchronously');
            try {
                console.log('Sending message to player:', formattedPhone);
                await this.whatsappService.sendMessage(formattedPhone, message);
                console.log('Player message sent');
    
                console.log('Sending message to group');
                await this.whatsappService.sendMessageToGroup(groupMessage);
                console.log('Group message sent');
            } catch (error) {
                console.error('Ошибка при отправке сообщения в WhatsApp:', error);
                // Логируем ошибку, но не прерываем основной процесс
            }
        });
    
        console.log('Application process completed');
        return application; // Ответ возвращается сразу
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
            playerName: application.playerName,
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
        return {
            trainingDatesId: application.trainingDatesId,
            playerName: application.playerName,
            playerComment: application.playerComment,
            playerPhone: application.playerPhone,
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
                id, playerName, playerPhone
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
