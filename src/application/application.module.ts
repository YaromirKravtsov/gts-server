import { Module, forwardRef } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Application } from './application.model';
import { TrainingDates } from 'src/training/trainig-dates.model';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { TrainingModule } from 'src/training/training.module';
import { UserModule } from 'src/user/user.module';
import { FilesModule } from 'src/files/files.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  providers: [ApplicationService],
  controllers: [ApplicationController],
  imports: [FilesModule,MailModule,
    SequelizeModule.forFeature([Application, TrainingDates]),
    forwardRef(() => WhatsappModule),
    forwardRef(() => TrainingModule),
    forwardRef(() => UserModule),
    
    
  ],
  exports: [ApplicationService],
})
export class ApplicationModule {}
