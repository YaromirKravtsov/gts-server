import { forwardRef, Module } from '@nestjs/common';
import { ConfirmationController } from './confirmation.controller';
import { ConfirmationService } from './confirmation.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApplicationModule } from 'src/application/application.module';
import { MailService } from 'src/mail/mail.service';
import { MailModule } from 'src/mail/mail.module';
import { TrainingService } from 'src/training/training.service';
import { TrainingModule } from 'src/training/training.module';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [ConfirmationController],
  providers: [ConfirmationService],
  imports:[ forwardRef(() => ApplicationModule), MailModule,TrainingModule, forwardRef(() => UserModule)],
  exports: [ConfirmationService]
})
export class ConfirmationModule {}
