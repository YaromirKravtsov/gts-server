import { Module, Global } from '@nestjs/common';
import { CustomLogger } from './logger.service';

@Global() // Делает LoggerModule доступным во всем приложении
@Module({
  providers: [CustomLogger], // Регистрируем CustomLogger как провайдер
  exports: [CustomLogger], // Экспортируем, чтобы другие модули могли его использовать
})
export class LoggerModule {}
