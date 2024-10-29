import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Group } from './group.model';

@Injectable()
export class GroupService {
    constructor(@InjectModel(Group) private groupService: typeof Group) { }

    async createGroup(dto: CreateGroupDto) {
        try {
            await this.groupService.create(dto);
            return;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
    
    async getAll(){
        try {
            const groups = await this.groupService.findAll();
            return groups;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
