import { Module, forwardRef } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { Training } from './training.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrainingDates } from './trainig-dates.model';
import { ApplicationModule } from 'src/application/application.module';
import { MailModule } from 'src/mail/mail.module';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService],
  imports: [
    SequelizeModule.forFeature([Training, TrainingDates]),MailModule,
    forwardRef(() => ApplicationModule),forwardRef(() => UserModule)
  ],
  exports: [TrainingService],
})
export class TrainingModule {}
