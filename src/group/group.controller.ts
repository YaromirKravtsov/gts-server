import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupService } from './group.service';
import { Roles } from 'src/role/roles-auth-decorator';
import { RoleGuard } from 'src/role/role.gurard';
import { ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UpdateGroupDto } from './dto/update-group';

@Controller('groups')
export class GroupController {

    constructor(private groupService: GroupService) { }

/*     @Roles(['admin'])
    @UseGuards(RoleGuard) */
    @ApiOperation({ summary: 'Create group' })
    @ApiBody({ type: CreateGroupDto })
    @Post()
    async createGroup(@Body() dto: CreateGroupDto) {
        try {
            return this.groupService.createGroup(dto)
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }


    @Get()
    @ApiOperation({ summary: 'Get All Groups' })
    @ApiQuery({
        name: 'visible',
        type: Boolean,
        required: false,
        description: 'Указывает, нужно ли возвращать только видимые группы. Используйте true для видимых, false для скрытых.',
    })
    async getAll(@Query('visible') visible: boolean) {
        try {
            return this.groupService.getAll(visible)
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    // Обновление всей группы
/*     @Roles(['admin'])
    @UseGuards(RoleGuard) */
    @ApiOperation({ summary: 'Update group' })
    @ApiBody({ type: UpdateGroupDto, description: 'Данные для обновления группы' })
    @Put('/')
    updateGroup(@Body() dto: UpdateGroupDto) {
        try {
            return this.groupService.updateGroup(dto);
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Обновление поля `visible`
    @ApiOperation({ summary: 'Update group visibility' })
    @ApiParam({ name: 'id', type: Number, description: 'ID группы' })
    @Put(':id/visible')
    async updateVisible(@Param('id') id: number) {
        return this.groupService.updateVisible(id);
    }

    // Обновление поля `order`
    @ApiOperation({ summary: 'Update group order' })
    @ApiParam({ name: 'id', type: Number, description: 'ID группы' })
    @ApiBody({ schema: { example: { order: 1 } }, description: 'Устанавливает порядок отображения группы' })
    @Put(':id/order')
    async updateOrder(@Param('id') id: number, @Body('order') order: number) {
        return this.groupService.updateOrder(id, order);
    }

    // Удаление группы
    @ApiOperation({ summary: 'Delete group' })
    @ApiParam({ name: 'id', type: Number, description: 'ID группы для удаления' })
    @Delete(':id')
    async deleteGroup(@Param('id') id: number) {
        return this.groupService.deleteGroup(id);
    }
}
