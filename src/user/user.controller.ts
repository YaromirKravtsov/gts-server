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
    constructor(private userService: UserService) { }

    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Get('one/:id')
    @ApiOperation({ summary: 'Create new user' })
    @ApiParam({ name: 'id' })
    async getUser(@Param() { id }) {
        return await this.userService.getUser(id);
    }

    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Post('/regularPlayer')
    @ApiOperation({ summary: 'Create new user' })
    @ApiBody({ type: RegisterUserDto })
    async createRegularPlayer(@Body() dto: RegisterUserDto) {
        return await this.userService.createNewUser({ ...dto, role: 'regularPlayer' });
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Get('/players')
    @ApiOperation({ summary: 'Get all users' })
    async getAllUsers() {
        return await this.userService.getAllUsers();
    }


/*     @Roles(['admin'])
    @UseGuards(RoleGuard) */
    @Get('/search-players')
    @ApiOperation({ summary: 'Search players' })
    @ApiQuery({ name: 'searchQuery'})
    async searchPlayers(@Query('searchQuery') searchQuery:string) {
        return await this.userService.searchPlayers(searchQuery);
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Put('')
    @ApiOperation({ summary: 'Edit user' })
    @ApiBody({ type: EditUserDto })
    async editPlayer(@Body() dto: EditUserDto) {
        return await this.userService.editPlayer(dto)
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Put('/convert/new-to-regular/:id')
    @ApiOperation({ summary: 'Convert new user to regular' })
    @ApiParam({ name: 'userId' })
    async convertNewToRegular(@Param() {id} ) {
        return await this.userService.convertNewToRegular(id)
    }



    @Delete('/:id')
    @ApiOperation({ summary: 'Delete user' })
    @ApiParam({ name: 'id' })
    async deletePlayer(@Param() { id }) {
        return await this.userService.deleteUser(id)
    }

    @Post('login')
    @ApiOperation({ summary: 'User logining' })
    @ApiBody({ type: LoginDto })
    async login(@Body() dto: LoginDto, @Res() res: Response) {
        const userData = await this.userService.login(dto);
        res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 68 * 1000, httpOnly: true });
        res.cookie('deviceId', userData.deviceId, { maxAge: 30 * 24 * 60 * 68 * 1000, httpOnly: true });
        return res.status(200).json(userData);
    }


    



}
