import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Group } from './group.model';
import { UpdateGroupDto } from './dto/update-group';
import { Op } from 'sequelize';

@Injectable()
export class GroupService {
    constructor(@InjectModel(Group) private groupRepository: typeof Group) { }

    async createGroup(dto: CreateGroupDto) {
        try {
            await this.groupRepository.increment('order', { by: 1, where: { order: { [Op.gte]: 0 } } });

            const group = await this.groupRepository.create({
                ...dto,
                order: 1,
                visible: true,
            });

            return group;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async getAll(visible?: boolean) {
        try {
            const whereCondition = visible !== undefined ? { visible: Boolean(visible) } : {};
            console.log(whereCondition)
            const groups = await this.groupRepository.findAll({ where: whereCondition });
            return groups;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateGroup(dto: UpdateGroupDto) {
        try {
            const group = await this.groupRepository.findByPk(dto.id);
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        if (dto.groupName !== undefined) {
            group.groupName = dto.groupName;
        }
        if (dto.groupUrl !== undefined) {
            group.groupUrl = dto.groupUrl;
        }
        if (dto.color !== undefined) {
            group.color = dto.color;
        }

        await group.save();
        return group;

        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


     // Пересчитывает значения `order` для всех записей, чтобы избежать пропусков
     private async reorderGroups() {
        const groups = await this.groupRepository.findAll({ order: [['order', 'ASC']] });
        for (let i = 0; i < groups.length; i++) {
            await groups[i].update({ order: i + 1 }); // Начинаем с `1` вместо `0`
        }
    }
    

    // Метод для обновления поля `visible` с логикой перемещения группы в конец списка
    async updateVisible(id: number, visible: boolean) {
        const group = await this.groupRepository.findByPk(id);
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Если visible == false, перемещаем группу в конец списка
        if (!visible) {
            // Устанавливаем order для выбранной группы на максимально доступный порядок
            const maxOrder = (await this.groupRepository.max('order')) as number | null;
            const newOrder = maxOrder !== null ? maxOrder + 1 : 1;

            await this.groupRepository.update({ order: newOrder, visible: false }, { where: { id } });
            
        } else {
            await this.groupRepository.update({ visible: true ,order: 0}, { where: { id } });
        }

        // Пересчитываем порядок для всех записей
        await this.reorderGroups();
        return this.groupRepository.findByPk(id); // Возвращаем обновленный объект
    }

    // Метод для обновления поля `order`
    async updateOrder(id: number, newOrder: number) {
        const group = await this.groupRepository.findByPk(id);
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Перемещаем группу на новое место
        await this.groupRepository.update({ order: newOrder -1,visible: true }, { where: { id } });

        // Пересчитываем порядок для всех записей
        await this.reorderGroups();
        return this.groupRepository.findByPk(id); // Возвращаем обновленный объект
    }

    // Метод для удаления группы
    async deleteGroup(id: number) {
        const group = await this.groupRepository.findByPk(id);
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Удаляем группу
        await this.groupRepository.destroy({ where: { id } });

        // Пересчитываем порядок для всех записей
        await this.reorderGroups();
        return { message: 'Group deleted successfully' };
    }

}


