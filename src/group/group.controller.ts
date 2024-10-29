import { Body, Controller, Get, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupService } from './group.service';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';

@Controller('groups')
export class GroupController {

    constructor(private groupService: GroupService){}

    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @Post()
    async createGroup(@Body() dto:CreateGroupDto){
        try{
            return this.groupService.createGroup(dto)
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @Get()
    async getAll(){
        try{
            return this.groupService.getAll()
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    
}
