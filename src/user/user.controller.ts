import { Body, Controller, Delete, ForbiddenException, Get, HttpException, HttpStatus, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { RegisterUserDto } from './dto/register-user-dto';
import { Response } from 'express';
import { ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EditUserDto } from './dto/edit-user.dto';
import { ChangePasswordDto } from './dto/chage-password.dto';
import { JwtPayload, verify } from 'jsonwebtoken';

@Controller('user')
export class UserController {
    constructor(private userService: UserService) { }

    @Roles(['admin','trainer'])
    @UseGuards(RoleGuard)
    @Get('one/:id')
    @ApiOperation({ summary: 'Create one user' })
    @ApiParam({ name: 'id' })
    async getUser(@Param() { id }) {
        return await this.userService.getUser(id);
    }

    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Post('/create')
    @ApiOperation({ summary: 'Create new user' })
    @ApiBody({ type: RegisterUserDto })
    async createRegularPlayer(@Body() dto: RegisterUserDto) {
        return await this.userService.createNewUser(dto);
    }

    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Post('/trainer')
    @ApiOperation({ summary: 'Create new Trainer' })
    @ApiBody({ type: RegisterUserDto })
    async createTrainer(@Body() dto: RegisterUserDto) {
        return await this.userService.createTrainer(dto);
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Get('/players')
    @ApiOperation({ summary: 'Get all users' })
    async getAllUsers() {
        return await this.userService.getAllUsers();
    }

    @Roles(['admin','trainer'])
    @UseGuards(RoleGuard)
    @Get('/search-players')
    @ApiOperation({ summary: 'Search players' })
    @ApiQuery({ name: 'searchQuery', required: false})
    @ApiQuery({ name: 'role', required: false})
    async searchPlayers(@Query('searchQuery') searchQuery:string, @Query('role') role:string) {
        return await this.userService.searchPlayers(searchQuery,role);
    }


    @Roles(['admin','trainer'])
    @UseGuards(RoleGuard)
    @Put('')
    @ApiOperation({ summary: 'Edit user' })
    @ApiBody({ type: EditUserDto })
    async editPlayer(@Body() dto: EditUserDto) {
        return await this.userService.editPlayer(dto)
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Put('/convert/new-to-regular/:userId')
    @ApiOperation({ summary: 'Convert new user to regular' })
    @ApiParam({ name: 'userId' })
    async convertNewToRegular(@Param() {userId} ) {
        return await this.userService.convertNewToRegular(userId)
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
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



    @Put('chagePassword')
    @ApiOperation({ summary: 'User change pass' })
    @ApiBody({ type: ChangePasswordDto })
    async chagePassword(@Body() dto: ChangePasswordDto,   @Req() req: Request,) {
        //@ts-ignore
        const refreshToken = req.cookies['refreshToken']; // Достаем куку
        console.log('Refresh Token:', refreshToken);
        const data = verify(refreshToken, process.env.JWT_REFRESH_SECRET) as JwtPayload
        console.log(data)
        if((data.userId == dto.userId) || data.role == 'admin' ){
            const userData = await this.userService.chagePassword(dto);
        }else{
            throw new ForbiddenException('Permission denied')
        }

        
        return /* res.status(200).json(userData) */;
    }

    



}
