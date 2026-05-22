import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: { field: string; message: string; code: string }[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as Record<string, unknown>).message as string || exception.message;
      code = this.getErrorCode(status);

      const resObj = typeof res === 'object' ? res as Record<string, unknown> : null;
      if (resObj && Array.isArray(resObj.message)) {
        details = (resObj.message as string[]).map((m: string) => ({
          field: '',
          message: m,
          code: 'VALIDATION_ERROR',
        }));
      }
    }

    response.status(status).send({
      error: {
        code,
        message,
        details,
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    });
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400: return 'VALIDATION_ERROR';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      case 429: return 'RATE_LIMIT_EXCEEDED';
      default: return 'INTERNAL_ERROR';
    }
  }
}
