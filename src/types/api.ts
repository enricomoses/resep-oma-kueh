import type { ERROR_COPY } from '@/constants/copy.constant';

export type ApiErrorCode = keyof typeof ERROR_COPY;

interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  requestId: string;
  meta?: ApiMeta;
}

export interface ApiError {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
  requestId: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
