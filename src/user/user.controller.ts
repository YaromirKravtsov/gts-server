import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { RegisterUserDto } from './dto/register-user-dto';
import { Response } from 'express';
import { ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EditUserDto } from './dto/edit-user.dto';

@Controller('user')
export class UserController {
    constructor(private userService: UserService ){}
/* 
    @Roles(['admin'])
    @UseGuards(RoleGuard) */
    @Post('/regularPlayer')
    @ApiOperation({ summary: 'Create new user' })
    @ApiBody({ type: RegisterUserDto })
    async createRegularPlayer(@Body() dto: RegisterUserDto) {
        try {
            return await this.userService.createNewUser({...dto, role: 'regularPlayer'});
        } catch (error) {
            console.log('Controller caught error:', error.message);
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    
/*     @Roles(['admin'])
    @UseGuards(RoleGuard) */
    @Put('')
    @ApiOperation({ summary: 'Edit user' })
    @ApiBody({ type: EditUserDto })
    async editPlayer(@Body() dto: EditUserDto ) {
        try {
            return await this.userService.editPlayer(dto)
        } catch (error) {
            console.log(error)
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    @Delete('/:id')
    @ApiOperation({ summary: 'Delete user' })
    @ApiParam({ name: 'id'})
    async deletePlayer(@Param() {id} ) {
        try {
            return await this.userService.deleteUser(id)
        } catch (error) {
            console.log(error)
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
