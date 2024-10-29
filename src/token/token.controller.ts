import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { TokenService } from './token.service';
import { Request, Response } from 'express';
@Controller('token')
export class TokenController {
    constructor(private tokenService: TokenService) { }

    @Get('refresh')
    async refresh(@Req() req: Request, @Res() res: Response) {
        try {
            const { refreshToken, deviceId } = req.cookies;
            console.log("refreshToken, deviceIdrefreshToken, deviceIdrefreshToken, deviceIdrefreshToken, deviceIdrefreshToken, deviceId")
            console.log(refreshToken, deviceId)
            const userData = await this.tokenService.refresh(refreshToken, deviceId);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 68 * 1000, httpOnly: true });
            res.cookie('deviceId', userData.deviceId, { maxAge: 30 * 24 * 60 * 68 * 1000, httpOnly: true });
            return res.json(userData);
        } catch (error) {
            console.log(error)
            return res.status(500).send(error);
        }
    }




}
