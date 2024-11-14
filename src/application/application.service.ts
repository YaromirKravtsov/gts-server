import { forwardRef, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
        const trainingDate = await this.trainingDatesRepository.findByPk(dto.trainingDatesId);

        if (!trainingDate) {
            throw new NotFoundException(`TrainingDates with ID ${dto.trainingDatesId} not found`);
        }

        const application = await this.applicationRepository.create(dto);
        const training = await this.trainingService.getTraining(dto.trainingDatesId);

        const date = this.formatTrainingDate(trainingDate.startDate, trainingDate.endDate);
        const deleteLink = `${process.env.FRONT_URL}?action=delete-anmeldung&application_id=${application.id}&playerName=${encodeURIComponent(dto.playerName)}&playerPhone=${encodeURIComponent(dto.playerPhone)}`;

        const message = [
            `Hallo,\n ${dto.playerName}`,
            'Ihre Anmeldung zum Probetraining war erfolgreich! Hier sind die Details:\n',
            `- *Zeit:* ${date}\n`,
            `- *Ort:* ${training.location.locationName}\n  ${training.location.locationUrl}\n`,
            `- *Gruppe:* ${training.group.groupName}\n  ${training.group.groupUrl}\n`,
            `Falls Sie Ihre Anmeldung stornieren möchten, können Sie dies über folgenden Link tun: ${deleteLink}\n\n`,
            'Wir freuen uns darauf, Sie beim Training zu sehen!\n',
            'Mit freundlichen Grüßen,\nIhr Team'
        ].join('').trim();

        const groupMessage = [
            `*Neue Registrierung für das Probetraining*\n`,
            `*Zeit:* ${date}\n`,
            `*Ort:* ${training.location.locationName}\n`,
            `*Gruppe:* ${training.group.groupName}\n`,
            `*Spieler:* ${dto.playerName}`,
            dto.playerComment ? `\n*Kommentar:* ${dto.playerComment}` : ''
        ].join('').trim();

        const formattedPhone = this.formatPhoneNumber(dto.playerPhone);


        setTimeout(async () => {
            try {
                await this.whatsappService.sendMessage(formattedPhone + '@c.us', message);
                await this.whatsappService.sendMessageToGroup(groupMessage)
            } catch (error) {
                console.error('Ошибка при отправке сообщения в WhatsApp:', error);
            }
        }, 0);

        return application;
    }

    async getApplicationsByTrainingDateId(trainingDatesId: number): Promise<Application[]> {
        return await this.applicationRepository.findAll({
            where: { trainingDatesId },
        });
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
        let cleanedPhone = phone.replace(/\D/g, ''); // Удалить все кроме цифр

        if (cleanedPhone.startsWith('0')) {
            cleanedPhone = '49' + cleanedPhone.slice(1); // Заменить ведущий 0 на код страны 49
        }

        if (cleanedPhone.startsWith('49')) {
            return cleanedPhone; // Возврат если номер начинается с правильного кода
        }

        throw new Error('Invalid phone number format');
    }

    // Метод для форматирования даты в нужном формате
    private formatTrainingDate(startDate: Date, endDate: Date): string {
        const format = 'DD.MM.YYYY HH:mm';
        const start = moment(startDate).tz('Europe/Berlin').format(format);
        const end = moment(endDate).tz('Europe/Berlin').format('HH:mm'); // Только время для конца
        return `${start} - ${end}`;
    }


}
