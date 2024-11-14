import { Module, forwardRef } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { Training } from './training.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrainingDates } from './trainig-dates.model';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { ApplicationModule } from 'src/application/application.module';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService],
  imports: [
    SequelizeModule.forFeature([Training, TrainingDates]),
    forwardRef(() => WhatsappModule),
    forwardRef(() => ApplicationModule),
  ],
  exports: [TrainingService],
})
export class TrainingModule {}
