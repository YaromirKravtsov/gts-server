import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { TokenModule } from 'src/token/token.module';
import { ApplicationModule } from 'src/application/application.module';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [SequelizeModule.forFeature([User]),forwardRef(() =>TokenModule) ,
  forwardRef(() => WhatsappModule),
  forwardRef(() => ApplicationModule),],
  exports: [UserService]
  
})
export class UserModule {}
