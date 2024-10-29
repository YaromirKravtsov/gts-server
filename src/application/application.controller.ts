import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { CreateApplicationDto } from './dto/create-application.dto';


@Controller('applications')
export class ApplicationController {

    constructor(private applicationService: ApplicationService){}

    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Post()
    async createApplication(@Body() dto: CreateApplicationDto){
        try {
            return await this.applicationService.createApplication(dto)
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }


    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Get()
    async getByMonthApplication(@Query('date') date: string){
        try {
            return await this.applicationService.getByMonthApplication(date)
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }



}
