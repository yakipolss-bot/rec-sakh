import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as crypto from 'crypto';

export interface SuccessResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const requestId = crypto.randomUUID();
    return next.handle().pipe(
      map((data) => {
        if (data && data.data !== undefined && data.meta !== undefined) {
          return data;
        }
        const meta: Record<string, unknown> = {
          requestId,
          timestamp: new Date().toISOString(),
        };
        if (Array.isArray(data)) {
          // H5: Не оборачиваем простые массивы в пагинацию.
          // meta добавляется ТОЛЬКО если это явно пагинированный эндпоинт (data уже содержит meta).
          return { data };
        }
        return { data, meta };
      }),
    );
  }
}
