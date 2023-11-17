import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { formatDate } from '../utils';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const statusCode = exception.getStatus();

    const res = exception.getResponse() as { message: string[] };

    response.status(statusCode).json({
      code: statusCode,
      message: res?.message?.join ? res?.message?.join(',') : exception.message,
      path: request.url,
      timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
    });
  }
}
