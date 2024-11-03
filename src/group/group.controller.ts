import { Body, Controller, Get, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupService } from './group.service';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('groups')
export class GroupController {

    constructor(private groupService: GroupService){}

    @Roles(['admin'])
    @UseGuards(RoleGuard)
    @ApiOperation({ summary: 'Create group' })
    @ApiBody({type: CreateGroupDto})
    @Post()
    async createGroup(@Body() dto:CreateGroupDto){
        try{
            return this.groupService.createGroup(dto)
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get All Groups' })
    async getAll(){
        try{
            return this.groupService.getAll()
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    
}
