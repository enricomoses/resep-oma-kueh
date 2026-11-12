import { isAxiosError, isCancel } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import type { z } from 'zod';

import { ApiClientError } from '@/lib/errors';
import type { ApiSuccess } from '@/types';
import { apiErrorSchema, apiSuccessSchema } from '@/validations/api.schema';

import { axiosInstance } from './instance';

type ApiRequestConfig = Omit<
  AxiosRequestConfig,
  'baseURL' | 'url' | 'validateStatus'
> & { url: string };

function failureFromBody(
  body: unknown,
  status?: number,
): ApiClientError | null {
  const result = apiErrorSchema.safeParse(body);
  return result.success
    ? new ApiClientError({
        ...result.data.error,
        requestId: result.data.requestId,
        status,
      })
    : null;
}

function transportError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  if (isCancel(error)) return new ApiClientError({ code: 'CANCELED' });
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const failure = failureFromBody(error.response?.data, status);
    if (failure) return failure;
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiClientError({ code: 'TIMEOUT', status });
    }
    return new ApiClientError({
      code: status ? 'INVALID_RESPONSE' : 'NETWORK_ERROR',
      status,
    });
  }
  return new ApiClientError({ code: 'NETWORK_ERROR' });
}

export async function requestApi<T>(
  config: ApiRequestConfig,
  dataSchema: z.ZodType<T>,
): Promise<ApiSuccess<T>> {
  // Services construct BFF paths from constants; never allow an absolute destination.
  if (
    !config.url.startsWith('/') ||
    config.url.startsWith('//') ||
    config.url.includes('://')
  ) {
    throw new ApiClientError({ code: 'INVALID_REQUEST' });
  }
  try {
    const response = await axiosInstance.request<unknown>(config);
    const failure = failureFromBody(response.data, response.status);
    if (failure) throw failure;
    const parsed = apiSuccessSchema(dataSchema).safeParse(response.data);
    if (!parsed.success)
      throw new ApiClientError({
        code: 'INVALID_RESPONSE',
        status: response.status,
      });
    // Exactly one unwrap. Preserve the complete envelope, including pagination/meta.
    return parsed.data;
  } catch (error: unknown) {
    throw transportError(error);
  }
}
