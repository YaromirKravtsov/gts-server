import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Location } from './location.model';

@Module({
  providers: [LocationService],
  controllers: [LocationController],
  imports: [SequelizeModule.forFeature([Location])]
})
export class LocationModule {}
