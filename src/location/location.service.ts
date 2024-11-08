import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Location } from './location.model';

import { Op } from 'sequelize';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationService {
    constructor(@InjectModel(Location) private locationRepository: typeof Location) { }

    // Создание новой записи с order = 1 и visible = true
    async createLocation(dto: CreateLocationDto) {
        try {
            // Сдвигаем `order` для всех существующих записей на 1 вверх
            await this.locationRepository.increment('order', { by: 1, where: {} });

            // Создаем новую запись с `order = 1` и `visible = true`
            const location = await this.locationRepository.create({
                ...dto,
                order: 1,
                visible: true,
            });

            return location;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Получение всех записей, с фильтром по `visible`, если требуется
    async getAll(visible?: boolean) {
        try {
            const whereCondition = visible !== undefined ? { visible: Boolean(visible) } : {};
            const locations = await this.locationRepository.findAll({ where: whereCondition });
            return locations;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Обновление данных записи
    async updateLocation(dto: UpdateLocationDto) {
        try {
            const location = await this.locationRepository.findByPk(dto.id);
            if (!location) {
                throw new NotFoundException('Location not found');
            }

            if (dto.locationName !== undefined) {
                location.locationName = dto.locationName;
            }
            if (dto.locationUrl !== undefined) {
                location.locationUrl = dto.locationUrl;
            }

            await location.save();
            return location;
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Пересчет значений `order` для всех записей
    private async reorderLocations() {
        const locations = await this.locationRepository.findAll({ order: [['order', 'ASC']] });
        for (let i = 0; i < locations.length; i++) {
            await locations[i].update({ order: i + 1 }); // Задаем `order`, начиная с 1
        }
    }
    // Обновление поля `visible` с логикой перемещения в конец списка
    async updateVisible(id: number, visible: boolean) {
        const location = await this.locationRepository.findByPk(id);
        if (!location) {
            throw new NotFoundException('Location not found');
        }
         // Получаем максимальное значение `order` или 0, если записей нет
         const maxOrder = (await this.locationRepository.max('order')) as number | null;
         const newOrder = maxOrder !== null ? maxOrder + 1 : 1;

        if (!visible) {
   
            // Устанавливаем `order` для выбранной записи
            await this.locationRepository.update({ order: newOrder, visible: false }, { where: { id } });
        } else {
            await this.locationRepository.update({ visible: true ,order:0 }, { where: { id } });
        }

        // Пересчет порядка после изменения видимости
        await this.reorderLocations();
        return this.locationRepository.findByPk(id);
    }



    // Обновление поля `order`
    async updateOrder(id: number, newOrder: number) {
        const location = await this.locationRepository.findByPk(id);
        if (!location) {
            throw new NotFoundException('Location not found');
        }

        await this.locationRepository.update({ order: newOrder +1, visible: true }, { where: { id } });
        await this.reorderLocations();
        return this.locationRepository.findByPk(id);
    }

    // Удаление записи
    async deleteLocation(id: number) {
        const location = await this.locationRepository.findByPk(id);
        if (!location) {
            throw new NotFoundException('Location not found');
        }

        await this.locationRepository.destroy({ where: { id } });
        await this.reorderLocations();
        return { message: 'Location deleted successfully' };
    }
}
