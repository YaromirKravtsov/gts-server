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
import { Model, Op } from 'sequelize';
import { Group } from '../../src/group/group.model';
import { Location } from 'src/location/location.model';
import { TrainingDates } from 'src/training/trainig-dates.model';
import * as moment from 'moment-timezone';
import { TrainingService } from 'src/training/training.service';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { UserService } from 'src/user/user.service';
import { AddRegularPlayerToTraing } from './dto/add-regular-player-to-training.dto';
import { User } from 'src/user/user.model';
import { FilesService } from 'src/files/files.service';
import { NewUserMailDto } from 'src/mail/dto/new-user-dto';
import { MailService } from 'src/mail/mail.service';
import { RequestTrialTrainingDto } from './dto/request-trial-training.dto';
import { ConfirmationService } from 'src/confirmation/confirmation.service';
import { ConfirmTrailMonthDto } from 'src/mail/dto/confirm-trail-month.dto';
import { ConfirmTrailTrainigDto } from 'src/confirmation/dto/confirm-trail-training.dto';
import { ConfirmEmailDto } from 'src/confirmation/dto/confirm-email.dto';
import { verify } from 'jsonwebtoken';
import { TelegramService } from 'src/telegram/telegram.service';
@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application) private applicationRepository: typeof Application,
    @InjectModel(TrainingDates)
    private trainingDatesRepository: typeof TrainingDates,
    @Inject(forwardRef(() => TrainingService))
    private readonly trainingService: TrainingService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly filesService: FilesService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => ConfirmationService))
    private readonly confirmationService: ConfirmationService,
    private readonly telegramService: TelegramService
  ) { }
  generateDeleteKey = () => Math.random().toString(36).substring(2, 9);

  async createNewUserApplication(dto: CreateApplicationDto) {

    const { trainingDatesId/* , playerFile */ } = dto;

    const trainingDate = await this.trainingDatesRepository.findByPk(
      trainingDatesId,
    );

    const candidate = await this.userService.findCandidate(dto.playerName, dto.playerEmail)

    if (candidate) {
      let errorMessage;
      switch (candidate.foundBy) {
        case 'username': {
          errorMessage = 'Ein Spieler mit diesem Namen ist bereits registriert.';
          break;
        }
        case 'email': {
          errorMessage = 'Ein Spieler mit dieser E-Mail-Adresse ist bereits registriert.';
          break;
        }
        case 'phone': {
          errorMessage = 'Ein Spieler mit dieser Telefonnummer ist bereits registriert.';
          break;
        }
      }

      throw new HttpException(errorMessage, HttpStatus.CONFLICT);
    }

    if (!trainingDate) {
      throw new NotFoundException(
        ``,
      );
    }

    const key = this.confirmationService.generateKey({
      email: dto.playerEmail,
      username: dto.playerName,
      trainingDatesId: dto.trainingDatesId,
      comment: dto.playerComment,

    } as ConfirmEmailDto);
    const vereficationUrl = process.env.FRONT_URL + '?action=paperwork&key=' + key;

    return await this.mailService.confirmEmailAndSendFile(dto.playerName, dto.playerEmail, vereficationUrl);

  }

  async verufyNewUserApplication(key: string, file: File) {

    const { username, email, comment, trainingDatesId } = verify(key, process.env.JWT_ACCESS_SECRET) as ConfirmEmailDto;
    let candidate = await this.userService.findCandidate(username, email);



    let fileIUrl, user, application;
    if (file) {
      fileIUrl = await this.filesService.createFile(file);
    }
    console.log(user)
    const deleteKey = this.generateDeleteKey();
    if (candidate) {
      user = candidate.candidate;
      application = this.applicationRepository.findOne({
        where: {
          userId: user.id
        }
      })

    } else {
      user = await this.userService.createNewUser({
        username: username,
        role: 'documentVerification',
        testMonthFileUrl: fileIUrl,
        email: email
      });

      application = await this.applicationRepository.create({
        playerComment: comment,
        trainingDatesId: trainingDatesId,
        isPresent: false,
        userId: user.id,
        deleteKey,
      });
    }



    const training = await this.trainingService.getTraining(
      trainingDatesId,
    );

    const trainingDate = await this.trainingDatesRepository.findByPk(
      trainingDatesId,
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
      email: email,
      fullName: username,
      date,
      locationName: training.location.locationName,
      groupName: training.group.groupName,
      trainerName: trainer.username,
      cancelUrl
    }

    await this.mailService.newUserRegister(mailDto);
    const message = `Neuer Benutzer *${username}* hat seine Dokumente zur Überprüfung eingereicht.\nEmail: *${email}*`;
    await this.telegramService.sendMessage(message);
    //TOODO Реализовать логику проверки того, что пользователь не спамит своими доками. Спас защита
    return application;
  }

  async createApplication(trainingDatesId: number, userId: number) {
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        trainingDatesId: trainingDatesId,
        userId: userId,
      }
    });

    if (existingApplication) {
      throw new BadRequestException('Sie sind bereits für dieses Training angemeldet.');

    }

    const deleteKey = this.generateDeleteKey();

    const application = await this.applicationRepository.create({
      trainingDatesId: trainingDatesId,
      isPresent: false,
      userId: userId,
      deleteKey,
    });

    return { deleteKey, application };
  }

  async requestTrialTraining(dto: RequestTrialTrainingDto) {
    const { email, trainigDateId } = dto;
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw new HttpException(
        'Player wurde nicht gefunden',
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.role == 'documentVerification') {
      throw new HttpException('Die Unterlagen werden derzeit noch geprüft.', HttpStatus.BAD_REQUEST)
    }


    if (user.role !== 'trialMonth') {
      throw new HttpException('Ihr Kontostatus erlaubt keine Anmeldung für das Training.', HttpStatus.BAD_REQUEST)
    }



    const application = await this.applicationRepository.findOne({
      where: {
        trainingDatesId: trainigDateId,
        userId: user.id
      }
    })

    if (application) {
      throw new BadRequestException('Sie sind bereits für dieses Training angemeldet.')
    }
    const valueOfTrainings = await this.countValueOfPossibleTrainings(user.id);
    console.log('valueOfTrainings ' + valueOfTrainings)
    if (4 - valueOfTrainings <= 0) {
      return this.mailService.trialTrainingsEnded(email, user.username);
    }

    const key = this.confirmationService.generateKey({
      userId: user.id,
      email,
      trainigDateId
    })



    const trainingDate = await this.trainingDatesRepository.findOne({
      where: {
        id: trainigDateId,
      },
      include: [{ model: Training, include: [Group, Location] }]
    })

    const date = this.formatTrainingDate(
      trainingDate.startDate,
      trainingDate.endDate,
    );
    await this.mailService.sendConfirmTrialTrrainigLetter({
      email: user.email,
      fullName: user.username,
      valueOfTrainings: 4 - valueOfTrainings,
      nextTraining: {
        group: trainingDate.training.group.groupName,
        location: trainingDate.training.location.locationName,
        date: date,
        trainer: trainingDate?.trainer?.username
      }
    }, process.env.SERVER_URL + 'confirmations/trail/trainig/' + key)


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

    if (deleteKey !== application.deleteKey) {
      throw new HttpException('Ungültiger Schlüssel. Bitte überprüfen Sie Ihren Löschschlüssel.', HttpStatus.BAD_REQUEST);
    }

    if (!application || !application.trainingDates) {
      throw new HttpException('Die angeforderte Trainingseinheit wurde nicht gefunden. Möglicherweise haben Sie sie bereits gelöscht.', HttpStatus.NOT_FOUND);
    }

    const trainingStartMoment = moment(application.trainingDates.startDate);

    const nowMoment = moment();

    const diffInMs = trainingStartMoment.diff(nowMoment);

    const msIn24Hours = 24 * 60 * 60 * 1000;
    if (diffInMs > 0 && diffInMs < msIn24Hours) {
      throw new HttpException('Die Stornierung der Trainingseinheit ist nur möglich, wenn Sie diese mindestens 24 Stunden vor Beginn mitteilen.', HttpStatus.NOT_FOUND);
    }

    const trainingDate = moment(application.trainingDates.startDate);
    const now = moment();

    if (trainingDate.isBefore(now)) {
      throw new BadRequestException('Diese Trainingseinheit hat bereits stattgefunden und kann nicht storniert werden.');
    }

    if (!application) {
      throw new NotFoundException(`Die Registrierung wurde nicht gefunden`);
    }
    await application.destroy();


    const startDate = moment
      .tz(application.trainingDates.startDate, 'Europe/Berlin')
      .format('DD.MM.YYYY HH:mm');
    const endDate = moment
      .tz(application.trainingDates.endDate, 'Europe/Berlin')
      .format('DD.MM.YYYY HH:mm');

    // Получаем информацию о тренировке
    const location = application.trainingDates.training.location.locationName;
    const group = application.trainingDates.training.group.groupName;

    // Получаем имя пользователя, который отзаявился.
    // Предполагается, что это поле доступно, например, как application.user.fullName.
    // Если используется другое поле, замените его соответствующим образом.
    const userName = application.user?.username;


    const message = `*Abmeldung von Training*\n\n` +
      `*Benutzer:* ${userName}\n` +
      `*Zeitraum:* ${startDate} - ${endDate}\n` +
      `*Ort:* ${location}\n` +
      `*Gruppe:* ${group}`;

    // Отправляем сообщение через Telegram-сервис (предполагается, что telegramService уже настроен)
    await this.telegramService.sendMessage(message);

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
  formatTrainingDate(startDate: Date, endDate: Date): string {
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
    const isRegistered = true /* await this.whatsappService.isWhatsAppRegistered(
      phoneNumber.number,
    );
    console.log(isRegistered); */
    return isRegistered;
  }

  async countValueOfPossibleTrainings(userId: number): Promise<number> {
    const now = new Date(); // Текущая дата

    // Получаем все тренировки пользователя
    const applications = await this.applicationRepository.findAll({
      where: {
        userId: userId,
      },
      include: [
        {
          model: TrainingDates,
          attributes: ["endDate", "startDate"],
        },
      ],
    });

    // Фильтруем тренировки: завершенные и предстоящие
    const completedTrainings = applications.filter(
      (app) =>
        app.isPresent === true &&
        app.trainingDates &&
        new Date(app.trainingDates.endDate) < now
    ).length;

    const upcomingTrainings = applications.filter(
      (app) =>
        app.trainingDates && new Date(app.trainingDates.startDate) > now
    ).length;

    return completedTrainings + upcomingTrainings;
  }


  async getNextTraining(userId: number): Promise<{ date: string; group: string; location: string; trainer?: string; } | null> {
    const now = new Date(); // Текущая дата

    const training = await this.applicationRepository.findOne({
      where: { userId },
      include: [
        {
          model: TrainingDates,
          where: {
            startDate: { [Op.gt]: now }, // startDate > текущая дата
          },
          include: [{ model: Training, include: [Group, Location] }]/* ,
                attributes:  */
        },
      ],
      order: [[{ model: TrainingDates, as: "trainingDates" }, "startDate", "ASC"]], // Сортировка по ближайшему startDate
    });

    if (!training || !training.trainingDates) {
      return null; // Если тренировки нет, возвращаем null
    }
    const date = this.formatTrainingDate(
      training.trainingDates.startDate,
      training.trainingDates.endDate,
    );
    return {
      date: date,
      group: training.trainingDates.training.group.groupName,
      location: training.trainingDates.training.location.locationName,
      trainer: training.trainingDates?.trainer?.username || '',
    };
  }


}
