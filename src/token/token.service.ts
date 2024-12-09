import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Token } from './token.model';
import { SaveTokenDto } from './dto/save-token.dto';
import { PayloadDto } from './dto/payload.dto';
import { UserService } from 'src/user/user.service';
import { Op } from 'sequelize';

import { JwtPayload, sign, verify } from 'jsonwebtoken';
import * as crypto from 'crypto';
@Injectable()
export class TokenService {
    constructor(@InjectModel(Token) private tokenRepository: typeof Token,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService) { }

    generateTokens(payload: PayloadDto): { accessToken: string; refreshToken: string } {
        try {

            const accessToken = sign({ ...payload }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });//15m
            const refreshToken = sign({ ...payload }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });



            return { accessToken, refreshToken }
        } catch (error) {
            throw error;
        }
    }
    async deleteUserTokens(userId: number) {
        try {
            await this.tokenRepository.destroy({
                where: {
                    userId: userId
                }
            })
        } catch (error) {
            throw error;
        }
    }
    async saveToken(dto: SaveTokenDto): Promise<Token> {
        try {
            const tokenData = await this.tokenRepository.findOne({ where: { userId: dto.userId, deviceId: dto.deviceId } })

            if (tokenData) {
                tokenData.refreshToken = dto.refreshToken;
                tokenData.deviceId = dto.deviceId;
                return await tokenData.save();
            }
            else {
                const deviceId = dto.deviceId;
                return await this.tokenRepository.create({ ...dto, deviceId });
            }
        } catch (error) {
            throw new HttpException(error, HttpStatus.BAD_REQUEST);
        }
    }

    async removeToken(refreshToken: string): Promise<number> {
        const tokenData = await this.tokenRepository.destroy({ where: { refreshToken } });
        return tokenData;
    }

    async removeAllTokensForUser(userId: number) {
        await this.tokenRepository.destroy({
            where: {
                userId: userId,
            },
        });

    }
    validateAccessToken(token) {
        try {

            const userData = verify(token, process.env.JWT_ACCESS_SECRET) as JwtPayload;
            return userData;
        } catch (e) {
            return null;
        }
    }


    validateRefreshToken(token) {
        try {
            const userData = verify(token, process.env.JWT_REFRESH_SECRET) as JwtPayload;
            return userData;
        } catch (e) {
            throw e;
        }
    }

    async refresh(refreshToken, deviceId) {
        console.log(refreshToken, deviceId)
        if (!refreshToken) {
            throw new UnauthorizedException(HttpStatus.BAD_REQUEST);
        }
        const userData = this.validateRefreshToken(refreshToken);
        const tokenFormDb = await this.findToken(refreshToken);
        console.log(userData, tokenFormDb)

        if (!userData || !tokenFormDb) {
            throw new UnauthorizedException(HttpStatus.BAD_REQUEST);
        }

        const user = await this.userService.findByPk(userData.userId);

        const payload: PayloadDto = {
            userId: user.id,
            role: user.role,
            username: user.username,
        }
        const tokens = this.generateTokens(payload);
        const tokenDto: SaveTokenDto = {
            userId: user.id,
            refreshToken: tokens.refreshToken,
            deviceId: deviceId
        };

        await this.saveToken(tokenDto)
        return { ...tokens, deviceId };
    }


    generateDeviceId(): string {
        return crypto.randomBytes(Math.ceil(20 / 2))
            .toString('hex')
            .slice(0, 20);
    }

    async findToken(refreshToken) {
        try {
            const tokenData = await this.tokenRepository.findOne({ where: { refreshToken } })
            return tokenData;
        } catch (e) {
            throw e;
        }
    }
}
