import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { ApiOperation, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('locations')
export class LocationController {
    constructor(private locationService: LocationService) {}

    @Post()
    @ApiOperation({ summary: 'Create location' })
    @ApiBody({ type: CreateLocationDto })
    async createLocation(@Body() dto: CreateLocationDto) {
        try {
            return await this.locationService.createLocation(dto);
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all locations' })
    @ApiQuery({
        name: 'visible',
        type: Boolean,
        required: false,
        description: 'Filter locations by visibility (true or false)',
    })
    async getAll(@Query('visible') visible?: boolean) {
        try {
            return await this.locationService.getAll(visible);
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put()
    @ApiOperation({ summary: 'Update location' })
    @ApiBody({ type: UpdateLocationDto })
    async updateLocation(@Body() dto: UpdateLocationDto) {
        try {
            return await this.locationService.updateLocation(dto);
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put(':id/visible')
    @ApiOperation({ summary: 'Update location visibility' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the location' })
    @ApiBody({ schema: { example: { visible: true } } })
    async updateVisible(@Param('id') id: number, @Body('visible') visible: boolean) {
        return await this.locationService.updateVisible(id, visible);
    }

    @Put(':id/order')
    @ApiOperation({ summary: 'Update location order' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the location' })
    @ApiBody({ schema: { example: { order: 1 } } })
    async updateOrder(@Param('id') id: number, @Body('order') order: number) {
        return await this.locationService.updateOrder(id, order);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete location' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the location to delete' })
    async deleteLocation(@Param('id') id: number) {
        try {
            return await this.locationService.deleteLocation(id);
        } catch (error) {
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
