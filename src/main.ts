import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser'; // Импортируем body-parser
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './http-exception.filter/http-exception.filter';


async function bootstrap() {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);



  const config = new DocumentBuilder()
    .setTitle('Gorovits tennis shulle app')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header', // Указываем, что токен должен быть в заголовке
      },
      'bearer', // Уникальный идентификатор схемы авторизации
    )
    .build();


  console.log('Registering global filters');



  app.useGlobalPipes(new ValidationPipe);


  const document = SwaggerModule.createDocument(app, config);
  const options = {
    swaggerOptions: {
      persistAuthorization: true, // сохраняет авторизацию между перезагрузками страницы
    },
  };

  SwaggerModule.setup('api/docs', app, document, options);
  app.enableCors({
    origin: ['http://192.168.0.119:3000', 'http://localhost:3000', 'http://87.106.232.167', 'http://gts', 'http://c66984zi.beget.tech', 'http://87.106.151.124', 'http://localhost:8000'
    ],
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

bootstrap();
