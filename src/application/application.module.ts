import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Application } from './application.model';

@Module({
  providers: [ApplicationService],
  controllers: [ApplicationController],
  imports: [SequelizeModule.forFeature( [Application])]
})
export class ApplicationModule {}
