import { Body, Controller, Get, HttpException, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { RegisterUserDto } from './dto/register-user-dto';
import { Response } from 'express';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('user')
export class UserController {
    constructor(private userService: UserService ){}

    @Post('')
    @ApiOperation({ summary: 'Create new user' }) 
    @ApiBody({ type: RegisterUserDto })
    async createNewUser(@Body() dto: RegisterUserDto) {
        try {
            const userData = await this.userService.createNewUser(dto);
            return userData;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @Post('login')
    @ApiOperation({ summary: 'User logining' }) 
    @ApiBody({ type: LoginDto })
    async login(@Body() dto: LoginDto, @Res() res: Response){
        const userData = await this.userService.login(dto);
        res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 68 * 1000, httpOnly: true  });
        res.cookie('deviceId', userData.deviceId, { maxAge: 30 * 24 * 60 * 68 * 1000, httpOnly: true });
        return res.status(200).json(userData);
    }
}
