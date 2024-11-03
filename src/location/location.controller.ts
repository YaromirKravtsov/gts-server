import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { LocationService } from './location.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('locations')
export class LocationController {
    constructor(private locationService: LocationService){}
    @Get()
    @ApiOperation({summary: 'get locations'})
    async getAll(){
        try{
            return this.locationService.getAll()
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

}
