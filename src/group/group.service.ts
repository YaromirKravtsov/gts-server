import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Group } from './group.model';
import { UpdateGroupDto } from './dto/update-group';
import { literal, Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
@Injectable()
export class GroupService {
    constructor(@InjectModel(Group) private groupRepository: typeof Group,
    private readonly sequelize: Sequelize,
) { }

    async createGroup(dto: CreateGroupDto) {
        try {
            await this.groupRepository.increment('order', { by: 1, where: { order: { [Op.gte]: 0 } } });
            const group = await this.groupRepository.create({
                ...dto,
                order: 1,
                visible: true,
                isToAdult: false
            });

            return group;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAll(visible?: boolean) {
        try {
            const whereCondition = visible !== undefined ? { visible: Boolean(visible) } : {};
            console.log(whereCondition);
    
            // Добавляем опцию order, чтобы сортировать по возрастанию по полю `order`
            const groups = await this.groupRepository.findAll({
                where: whereCondition,
                order: [['order', 'ASC']], // сортировка по возрастанию
            });
    
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

        if (dto.isToAdult !== undefined) {
            group.isToAdult = dto.isToAdult;
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
    async updateVisible(id: number) {
        const group = await this.groupRepository.findByPk(id);
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Если visible == false, перемещаем группу в конец списка
        if (group.visible) {
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

    async updateIsToAdult(groupId){
        try{
        const group = await this.groupRepository.findByPk(groupId);

            await this.groupRepository.update({ isToAdult: !group.isToAdult  }, { where: { id: groupId } }); 
        }catch (error) {
            console.error(error);
            throw new HttpException(
                error.message || 'Internal Server Error',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
    // Метод для обновления поля `order`
    async updateOrder(id: number, targetId: number): Promise<Group> {
        // Получаем обе группы по их идентификаторам
        const [group, targetGroup] = await Promise.all([
            this.groupRepository.findByPk(id),
            this.groupRepository.findByPk(targetId),
        ]);
    
        // Проверяем существование обеих групп
        if (!group || !targetGroup) {
            throw new NotFoundException('Одна или обе группы не найдены');
        }
    
        // Получаем текущие порядковые номера
        const currentOrder = group.order;
        const targetOrder = targetGroup.order;
    
        // Если порядковые номера совпадают, ничего не делаем
        if (currentOrder === targetOrder) {
            return group;
        }
    
        // Определяем направление перемещения
        const isMovingUp = currentOrder > targetOrder;
    
        // Обновляем порядковые номера для затронутых групп
        await this.sequelize.transaction(async (transaction) => {
            if (isMovingUp) {
                // Перемещение вверх: сдвигаем вниз все группы между targetOrder и currentOrder
                await this.groupRepository.update(
                    { order: this.sequelize.literal('`order` + 1') },
                    {
                        where: {
                            order: {
                                [Op.gte]: targetOrder,
                                [Op.lt]: currentOrder,
                            },
                        },
                        transaction,
                    },
                );
            } else {
                // Перемещение вниз: сдвигаем вверх все группы между currentOrder и targetOrder
                await this.groupRepository.update(
                    { order: this.sequelize.literal('`order` - 1') },
                    {
                        where: {
                            order: {
                                [Op.gt]: currentOrder,
                                [Op.lte]: targetOrder,
                            },
                        },
                        transaction,
                    },
                );
            }
    
            // Устанавливаем новый порядковый номер для перемещаемой группы
            await this.groupRepository.update(
                { order: targetOrder },
                { where: { id }, transaction },
            );
        });
    
        // Возвращаем обновленную группу
        return this.groupRepository.findByPk(id);
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


