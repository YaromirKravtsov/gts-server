import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Location } from './location.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class LocationService {

    constructor(@InjectModel(Location) private locationRepository: typeof Location){}
    async getAll(){
        try{
            return this.locationRepository.findAll()
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
