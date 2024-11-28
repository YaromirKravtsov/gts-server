import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    console.log('HttpExceptionFilter')
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();
    const errorResponse =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as Record<string, any>)
        : { message: exceptionResponse };

    response.status(status).json({
      statusCode: status,
      message: errorResponse.message || 'Произошла ошибка',
      errors: errorResponse.errors || null,
    });
  }
}
