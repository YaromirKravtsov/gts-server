import { Module } from '@nestjs/common';


import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from './user/user.module';
import { User } from './user/user.model';


import { ConfigModule } from '@nestjs/config';
import { TokenModule } from './token/token.module';
import { Token } from './token/token.model';
import { GroupModule } from './group/group.module';
import { LocationModule } from './location/location.module';
import { TrainingModule } from './training/training.module';
import { ApplicationModule } from './application/application.module';
import { Group } from './group/group.model';
import { Location } from './location/location.model';
import { Training } from './training/training.model';
import { Application } from './application/application.model';
import { TrainingDates } from './training/trainig-dates.model';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { CustomLogger } from './logger/logger.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MulterModule } from '@nestjs/platform-express';
@Module({
  providers: [
    CustomLogger,
    {
      provide: APP_INTERCEPTOR,
      useExisting: CustomLogger,
    },
  ],


  imports: [
    MulterModule.register({
      dest: './uploads', // Папка для сохранения файлов
    }),
    ConfigModule.forRoot({
      envFilePath:`.${process.env.NODE_ENV}.env`
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'static'), // Путь к папке для статики
      serveRoot: '/static', // URL-эндпоинт для доступа к файлам
  }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USER,
      password:process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
      models: [User,Token, Group, Location, Training, Application,TrainingDates],
      autoLoadModels:  process.env.AUTO_LOAD_MODELS == 'true'
    }),
    UserModule,
    TokenModule,
    GroupModule,
    LocationModule,
    TrainingModule,
    ApplicationModule,
    WhatsappModule,
    
  ]
})
export class AppModule {}
