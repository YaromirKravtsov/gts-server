import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user-dto';
import { hash, compare } from 'bcrypt';
import { PayloadDto } from 'src/token/dto/payload.dto';
import { TokenService } from 'src/token/token.service';
import { SaveTokenDto } from 'src/token/dto/save-token.dto';


@Injectable()
export class UserService {
    constructor(@InjectModel(User) private userRepository: typeof User,
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService
    
) { }

    async createNewUser(dto: RegisterUserDto,) {
        try {
            const candidate = await this.userRepository.findOne({ where: { username: dto.username } });

            if (candidate) {
                throw new HttpException('Ein Benutzer mit dieser E-Mail-Adresse ist bereits registriert', HttpStatus.FORBIDDEN);
            }

            const hashPassword = await hash(dto.password, 3);
            //===========================================
            const user = await this.userRepository.create({ ...dto, role: 'user', password: hashPassword });
            //===========================================



            // Отправка письма по email с паролем и логином 
            const returnData = {
                password: dto.password,
                userId: user.id
            }
            return returnData;
        } catch (error) {
            console.log(error)
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async login(dto: LoginDto) {
        try {
            const user = await this.userRepository.findOne({ where: { username: dto.username } });
            if (!user) {
                throw new HttpException('Benutzername oder Passwort ist ungültig', HttpStatus.NOT_FOUND);
            }

            const isPassEquals = await compare(dto.password, user.password);

            if (!isPassEquals) {
                throw new HttpException('Benutzername oder Passwort ist ungültig', HttpStatus.BAD_REQUEST);
            }

            const payload: PayloadDto = {
                userId: user.id,
                role: user.role,
                username: user.username
            }

            const tokens = this.tokenService.generateTokens(payload);
            const tokenDto: SaveTokenDto = {
                userId: user.id,
                refreshToken: tokens.refreshToken,
            };
            const deviceId = this.tokenService.generateDeviceId()
            await this.tokenService.saveToken({ ...tokenDto, deviceId })

            return { ...tokens, deviceId };
        } catch (e) {
            console.error(e);
            throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }




    async findByPk(pk: number) {
        try {
            const userData = await this.userRepository.findByPk(pk);
            return userData;
        } catch (e) {
            throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
    }
}
