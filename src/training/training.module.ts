import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { Training } from './training.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService],
  imports: [SequelizeModule.forFeature([Training])]
})
export class TrainingModule {}
