import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { Training } from './training.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrainingDates } from './trainig-dates.model';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService],
  imports: [SequelizeModule.forFeature([Training,TrainingDates])]
})
export class TrainingModule {}
