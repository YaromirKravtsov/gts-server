import { Module } from '@nestjs/common';


import { SequelizeModule } from '@nestjs/sequelize';


@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USER,
      password:process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
      models: [],
      autoLoadModels:false 
    }),
    
  ]
})
export class AppModule {}
