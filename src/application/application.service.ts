import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
import { FilesService } from 'src/files/files.service';
import { NewUserMailDto } from 'src/mail/dto/new-user-dto';
import { MailService } from 'src/mail/mail.service';
@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application) private applicationRepository: typeof Application,
    @InjectModel(TrainingDates)
    private trainingDatesRepository: typeof TrainingDates,
    private readonly whatsappService: WhatsAppService,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: TrainingService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly filesService: FilesService,
    private readonly mailService: MailService,
  ) { }
  generateDeleteKey = () => Math.random().toString(36).substring(2, 9);

  async createApplication(dto: CreateApplicationDto) {
    console.log(dto)
    const { trainingDatesId, playerPhone, playerFile } = dto;
    const trainingDate = await this.trainingDatesRepository.findByPk(
      trainingDatesId,
    );
    // TODO 
    // 1. Добавить верерфикацию почты
    const candidate = await this.userService.findCandidate(dto.playerName, dto.playerPhone, dto.playerEmail)

    if (candidate) {
      let errorMessage;
      switch(candidate.foundBy){
        case 'username' : {
          errorMessage = 'Ein Spieler mit diesem Namen ist bereits registriert.';
          break;
        } 
        case 'email' : {
          errorMessage = 'Ein Spieler mit dieser E-Mail-Adresse ist bereits registriert.';
          break;
        } 
        case 'phone' : {
          errorMessage = 'Ein Spieler mit dieser Telefonnummer ist bereits registriert.';
          break;
        } 
      }

      throw new HttpException(errorMessage, HttpStatus.CONFLICT);
    }

    if (!trainingDate) {
      throw new NotFoundException(
        `TrainingDates with ID ${trainingDatesId} not found`,
      );
    }

    let fileIUrl;
    if (playerFile) {
      fileIUrl = await this.filesService.createFile(playerFile);
    }

    const user = await this.userService.createNewUser({
      username: dto.playerName,
      phone: dto.playerPhone,
      role: 'documentVerification',
      testMonthFileUrl: fileIUrl || null,
      email: dto.playerEmail
    });


    const deleteKey = this.generateDeleteKey();
    const application = await this.applicationRepository.create({
      playerComment: dto.playerComment,
      trainingDatesId: dto.trainingDatesId,
      isPresent: false,
      userId: user.id,
      deleteKey,
    });

    const training = await this.trainingService.getTraining(
      dto.trainingDatesId,
    );

    const date = this.formatTrainingDate(
      trainingDate.startDate,
      trainingDate.endDate,
    );

    const cancelUrl = `${process.env.FRONT_URL}?action=delete-anmeldung&key=${deleteKey}&id=${application.id}`;
    let trainer = null;
    if (trainingDate.trainerId) {
      trainer = await this.userService.findByPk(trainingDate.trainerId);
    }

    const mailDto: NewUserMailDto = {
      email: dto.playerEmail,
      fullName: dto.playerName,
      date,
      locationName: training.location.locationName,
      groupName: training.group.groupName,
      trainerName: trainer.username,
      cancelUrl
    }

    if (training.group.isToAdult) {
      await this.mailService.newUserAdultRegister(mailDto);
    } else await this.mailService.newUserChildRegister(mailDto);

    return application;
  }

  async addRegularPlayerToTraining(dto: AddRegularPlayerToTraing) {
    const { userId, trainingDatesId } = dto;

    const trainingDate =
      await this.trainingDatesRepository.findByPk(trainingDatesId);
    if (!trainingDate) {
      throw new HttpException(
        'Training wurde nicht gefunden',
        HttpStatus.NOT_FOUND,
      );
    }

    const existingApplication = await this.applicationRepository.findOne({
      where: {
        trainingDatesId,
        userId,
      },
    });

    if (existingApplication) {
      throw new HttpException(
        'Benutzer ist bereits für dieses Training registriert',
        HttpStatus.CONFLICT,
      );
    }
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
      throw new HttpException(
        'Player wurde nicht gefunden',
        HttpStatus.NOT_FOUND,
      );
    }

    const dateTraingsIds =
      await this.trainingService.getDateTraingsIdsByDateTraingId(trainingId);

    if (!dateTraingsIds || dateTraingsIds.length === 0) {
      throw new HttpException(
        'Training wurde nicht gefunden',
        HttpStatus.NOT_FOUND,
      );
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
    const application =
      await this.applicationRepository.findByPk(applicationId);
    if (!application) {
      throw new HttpException(
        'Anmeldung wurde nicht gefunden',
        HttpStatus.NOT_FOUND,
      );
    }
    await application.destroy();

    return;
  }

  async deleteAllPlayerApplicationToThisTraining(dto) {
    const { trainingId, userId } = dto;
    console.log('Training ID:', trainingId, 'User ID:', userId);

    const dateTraingsIds =
      await this.trainingService.getDateTraingsIdsByDateTraingId(trainingId);

    if (!Array.isArray(dateTraingsIds) || dateTraingsIds.length === 0) {
      throw new HttpException(
        'Anmeldung wurde nicht gefunden',
        HttpStatus.NOT_FOUND,
      );
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
    return this.applicationRepository.findAll({
      where: { trainingDatesId },
      include: [User],
    });
  }

  async getUserApplications(userId: number, page: string, limit: string) {
    const currentPage = parseInt(page, 10) || 1; // Дефолтная страница = 1
    const itemsPerPage = parseInt(limit, 10) || 5; // Дефолтный лимит = 5
    const offset = Math.max(0, (currentPage - 1) * itemsPerPage); // Гарантия, что offset >= 0

    const { rows: items, count: total } =
      await this.applicationRepository.findAndCountAll({
        where: { userId },
        include: [
          {
            model: TrainingDates,
            as: 'trainingDates',
            include: [
              {
                model: Training,
                attributes: ['startTime', 'endTime'],
                include: [
                  {
                    model: Group,
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                  },
                  {
                    model: Location,
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                  },
                ],
              },
            ],
          },
          {
            model: User,
          },
        ],
        order: [
          [{ model: TrainingDates, as: 'trainingDates' }, 'startDate', 'ASC'],
        ],

        limit: Number(limit),
        offset: offset,
      });

    return {
      items: items.map((application) => {
        console.log('applicationapplication')

        return {
          id: application.id,
          trainingDatesId: application.trainingDatesId,
          isPresent: application.isPresent,
          startDate: moment
            .tz(application?.trainingDates?.startDate, 'Europe/Berlin')
            .format(),
          endDate: moment
            .tz(application.trainingDates.endDate, 'Europe/Berlin')
            .format(),
          group: application.trainingDates.training.group,
          location: application.trainingDates.training.location
        }
      }),
      total,
    };
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
                {
                  model: Group,
                  attributes: { exclude: ['createdAt', 'updatedAt'] },
                },
                {
                  model: Location,
                  attributes: { exclude: ['createdAt', 'updatedAt'] },
                },
              ],
            },
          ],
        },
        {
          model: User,
        },
      ],
      order: [['trainingDates', 'startDate', 'ASC']], // Изменено на 'startDate'
    });

    // Форматируем результат в нужный вид
    return applications.map((application) => ({
      id: application.id,
      trainingDatesId: application.trainingDatesId,
      playerName: application.user.username,
      startDate: moment
        .tz(application.trainingDates.startDate, 'Europe/Berlin')
        .format(),
      endDate: moment
        .tz(application.trainingDates.endDate, 'Europe/Berlin')
        .format(),
      location: application.trainingDates.training.location,
      group: application.trainingDates.training.group,
    }));
  }

  //
  async geApplication(id: number) {
    console.log('geApplication');
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
                {
                  model: Group,
                  attributes: { exclude: ['createdAt', 'updatedAt'] },
                },
                {
                  model: Location,
                  attributes: { exclude: ['createdAt', 'updatedAt'] },
                },
              ],
            },
          ],
        },
        {
          model: User,
        },
      ]
    });
    console.log(application)
    return {
      trainingDatesId: application.trainingDatesId,
      playerName: application.user.username,
      playerComment: application.playerComment,
      playerPhone: application.user.phone,
      startDate: moment
        .tz(application.trainingDates.startDate, 'Europe/Berlin')
        .format(),
      endDate: moment
        .tz(application.trainingDates.endDate, 'Europe/Berlin')
        .format(),
      location: application.trainingDates.training.location,
      group: application.trainingDates.training.group,
    };
  }

  async destroyApplication(id: number) {
    const application = await this.applicationRepository.findOne({
      where: {
        id,
      },
    });
    if (!application) {
      throw new NotFoundException(`Die Registrierung wurde nicht gefunden`);
    }
    return await this.applicationRepository.destroy({
      where: { id },
    });
  }

  async deleteApplication(id: string, deleteKey: string) {
    console.log(id, deleteKey);
    const application = await this.applicationRepository.findOne({
      where: {
        id,
        deleteKey,
      },
    });

    if (!application) {
      throw new NotFoundException(`Die Registrierung wurde nicht gefunden`);
    }
    await application.destroy();

    return { message: 'Die Registrierung wurde erfolgreich gelöscht' };
  }

  async putIsPresent(applicationId: number) {
    console.log('applicationId putIsPresent ' + applicationId);
    const application =
      await this.applicationRepository.findByPk(applicationId);
    if (!application) {
      throw new NotFoundException(`Die Registrierung wurde nicht gefunden`);
    }
    await application.update({
      isPresent: !application.isPresent,
    });
    return {
      id: application.id,
      isPresent: application.isPresent,
    };
  }

  //
  adjustTrainingDates(trainingDate: Date, time: Date): Date {
    const adjustedDate = new Date(
      trainingDate.getFullYear(),
      trainingDate.getMonth(),
      trainingDate.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
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

  public async deleteAllUserApplications(userId: number) {
    await this.applicationRepository.destroy({ where: { userId } });
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
    const isRegistered = await this.whatsappService.isWhatsAppRegistered(
      phoneNumber.number,
    );
    console.log(isRegistered);
    return isRegistered;
  }
}
