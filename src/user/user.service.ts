import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user-dto';
import { hash, compare } from 'bcrypt';
import { PayloadDto } from 'src/token/dto/payload.dto';
import { TokenService } from 'src/token/token.service';
import { SaveTokenDto } from 'src/token/dto/save-token.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { ApplicationService } from 'src/application/application.service';
import { ChangePasswordDto } from './dto/chage-password.dto';
import { Not } from 'sequelize-typescript';
import { Http } from 'winston/lib/winston/transports';
import { MailService } from 'src/mail/mail.service';
const fs = require('fs');
const path = require('path');

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
    @Inject(forwardRef(() => ApplicationService))
    private readonly applicationService: ApplicationService,
    private mailService: MailService
  ) { }
  credentialsFilePath = path.resolve(process.cwd(), 'data', 'credentials.json');


  async createNewUser(dto: RegisterUserDto) {
    try {
      const user = await this.userRepository.create({ ...dto });

      const returnData = {
        id: user.id,
        username: user.username,
      };
      return returnData;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  generatePassword = (length) => {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  async createTrainer(dto: RegisterUserDto) {
    try {
      const candidate = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if(!dto.color){
        throw new HttpException(
          'Geben Sie die Farbe des Trainers ein',
          HttpStatus.FORBIDDEN,
        );
      }

      const password = this.generatePassword(8);
      const hashPassword = await bcrypt.hash(password, 3);
      if (candidate) {
        throw new HttpException(
          'Ein Benutzer mit dieser Name ist bereits registriert',
          HttpStatus.FORBIDDEN,
        );
      }
  
      const user = await this.userRepository.create({
        ...dto,
        password: hashPassword,
        role: 'trainer',
      });

      const returnData = {
        id: user.id,
        username: user.username,
        password: password,
      };

      this.addCredential(user.username, password);
      if (dto.email.trim() == '') return returnData;

      this.mailService.newTrainerRegister({
        username: user.username, email: user.email, password: password
      })

      return returnData;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    throw new Error('Invalid phone number format');
  }

  async editPlayer(dto: EditUserDto) {
    try {
      const player = await this.userRepository.findByPk(dto.id);

      if (!player) {
        throw new HttpException(
          'Benutzername oder Passwort ist ungültig',
          HttpStatus.NOT_FOUND,
        );
      }

      await player.update({
        username: dto.username,
        email: dto.email,
        phone: dto.phone,
        adminComment: dto.adminComment,
        role: dto.role,
        color: dto.color || null
      });

      return {
        username: player.username,
        email: player.email,
        adminComment: player.adminComment,
        phone: player.phone,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async convertNewToRegular(id: number) {
    try {
      console.log({ id });
      console.log(id);
      const player = await this.userRepository.findByPk(id);

      if (!player) {
        throw new HttpException(
          'Benutzername oder Passwort ist ungültig',
          HttpStatus.NOT_FOUND,
        );
      }
      /*  if(player.role == 'regularPlayer'){
                 throw new HttpException('Der Player muss neu sein', HttpStatus.BAD_REQUEST);
             } */

      await player.update({
        role: player.role == 'regularPlayer' ? 'newPlayer' : 'regularPlayer',
      });
      return {
        username: player.username,
        email: player.email,
        adminComment: player.adminComment,
        phone: player.phone,
        role: player.role,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteUser(id: number) {
    try {
      const player = await this.userRepository.findByPk(id);

      if (!player) {
        throw new HttpException(
          'Benutzername oder Passwort ist ungültig',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.applicationService.deleteAllUserApplications(id);

      await this.tokenService.removeAllTokensForUser(id);
      await player.destroy();
      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllUsers() {
    try {
      const players = await this.userRepository.findAll({
        where: {
          role: {
            [Op.notIn]: ['admin', 'trainer'], // Исключаем роли admin и trainer
          },
        },
        attributes: { exclude: ['password'] }, // Исключаем поле password из результата
      });

      return players;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async searchPlayers(searchQuery?: string, role: string = 'admin') {
    try {
      console.log('rolerolerolerolerolerole');
      console.log(role);
      let whereConditions: any = {};

      if (role == 'player') {
        whereConditions = {
          role: {
            [Op.notIn]: ['admin', 'trainer'], // Исключаем роли 'admin' и 'trainer'
          },
        };
      } else if (role == 'admin') {
        whereConditions = {
          role: {
            [Op.in]: ['admin', 'trainer'], // Исключаем роли 'admin' и 'trainer'
          },
        };
      }
      if (role == 'trainer') {
        whereConditions = {
          role: {
            [Op.in]: ['trainer'], // Исключаем роли 'admin' и 'trainer'
          },
        };
      }

      if (searchQuery && searchQuery.trim() !== '') {
        whereConditions[Op.or] = [
          { username: { [Op.like]: `%${searchQuery}%` } }, // Поиск по имени
          { phone: { [Op.like]: `%${searchQuery}%` } }, // Поиск по телефону
          { email: { [Op.like]: `%${searchQuery}%` } }, // Поиск по email
        ];
      }
      console.log(whereConditions);
      const players = await this.userRepository.findAll({
        where: whereConditions,
        attributes: { exclude: ['password'] }, // Исключаем поле password
      });

      return players;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || 'Internal Server Error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(dto: LoginDto) {
    try {
      console.log(dto)
      const user = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (!user) {
        console.log('')
        throw new HttpException(
          'Benutzername oder Passwort ist ungültig',
          HttpStatus.NOT_FOUND,
        );
      }
      const isPassEquals = await compare(dto.password, user.password);

      if (!isPassEquals) {
        throw new HttpException(
          'Benutzername oder Passwort ist ungültig',
          HttpStatus.BAD_REQUEST,
        );
      }
      const payload: PayloadDto = {
        userId: user.id,
        role: user.role,
        username: user.username,
      };

      const tokens = this.tokenService.generateTokens(payload);
      const tokenDto: SaveTokenDto = {
        userId: user.id,
        refreshToken: tokens.refreshToken,
      };
      const deviceId = this.tokenService.generateDeviceId();
      await this.tokenService.saveToken({ ...tokenDto, deviceId });

      return { ...tokens, deviceId };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async chagePassword(dto: ChangePasswordDto) {
    try {
      const { userId, password } = dto;

      const user = await this.userRepository.findByPk(userId);
      const hashPassword = await bcrypt.hash(password, 3);
      await user.update({
        password: hashPassword,
      });
      return;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async confirmDocument(userId: number) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new HttpException('User was not found', HttpStatus.NOT_FOUND)
    }

    if (user.role !== 'documentVerification') {
      throw new HttpException('Der Spieler hat die Verifizierung bereits bestanden', HttpStatus.BAD_REQUEST)
    }
    //const valueOfTrainings = await this.applicationService.countValueOfPossibleTrainings(userId);

    await user.update({
      role: 'trialMonth'
    })
    const nextTraining = await this.applicationService.getNextTraining(userId);
    await this.mailService.confirmTrialMonth({
      email: user.email,
      fullName: user.username,
      valueOfTrainings: 4/*  - valueOfTrainings */,
      nextTraining: nextTraining
    })
  }

  async getUser(id: number): Promise<any> {
    try {
      const player = await this.userRepository.findByPk(id);

      if (!player) {
        throw new HttpException(
          'Benutzername wurde nicht gefunden',
          HttpStatus.NOT_FOUND,
        );
      }
      const playerJson = player.toJSON();
      console.log()
      const testMonthGlobalUrl = process.env.STATIC_URL + 'static/' + playerJson.testMonthFileUrl;
      console.log(testMonthGlobalUrl)
      return {
        ...playerJson, testMonthFileUrl: process.env.STATIC_URL + 'static/' + playerJson.testMonthFileUrl
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByPk(pk: number) {
    try {
      const userData = await this.userRepository.findByPk(pk);
      return userData;
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async findCandidate(username: string, email: string) {
    try {
      let candidate = await this.userRepository.findOne({
        where: {
          username, role: {
            [Op.not]: ['admin', 'trainer'],
          },
        }
      });
      if (candidate) return { candidate, foundBy: 'username' };

      candidate = await this.userRepository.findOne({ where: { email } });
      if (candidate) return { candidate, foundBy: 'email' };

      return null;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || 'Internal Server Error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  async getUserByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } })
  }













  addCredential(username, password) {
    // Читаем существующий файл
    fs.readFile(this.credentialsFilePath, 'utf8', (readErr, data) => {
      let credentials = [];
      if (readErr) {
        // Если файла не существует или произошла ошибка чтения, создаём пустой массив
        console.warn('Файл не найден или ошибка чтения, будет создан новый файл.');
      } else {
        try {
          credentials = JSON.parse(data);
        } catch (parseErr) {
          console.error('Ошибка парсинга JSON:', parseErr);
        }
      }

      // Добавляем новую запись (здесь пароли сохраняются в открытом виде – НЕ ДЛЯ ПРОДАКШЕНА)
      credentials.push({ username, password });

      // Записываем обновлённые данные обратно в файл
      fs.writeFile(this.credentialsFilePath, JSON.stringify(credentials, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Ошибка записи файла:', writeErr);
        } else {
          console.log('Данные успешно сохранены!');
        }
      });
    });
  }

}
