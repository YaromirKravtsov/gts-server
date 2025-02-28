import { Module, forwardRef } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Application } from './application.model';
import { TrainingDates } from 'src/training/trainig-dates.model';
import { TrainingModule } from 'src/training/training.module';
import { UserModule } from 'src/user/user.module';
import { FilesModule } from 'src/files/files.module';
import { MailModule } from 'src/mail/mail.module';
import { ConfirmationModule } from 'src/confirmation/confirmation.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';

@Module({
  providers: [ApplicationService],
  controllers: [ApplicationController],
  imports: [FilesModule,MailModule,
    SequelizeModule.forFeature([Application, TrainingDates]),
    forwardRef(() => TrainingModule),
    forwardRef(() => UserModule),
    forwardRef(() => ConfirmationModule),
    TelegramModule, WhatsappModule
    
  ],
  exports: [ApplicationService],
})
export class ApplicationModule {}
