import { AxiosError, AxiosHeaders, CanceledError } from 'axios';
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { API_ENDPOINTS, ERROR_COPY, LIMITS, QUERY_KEYS } from '@/constants';
import { requestApi } from '@/lib/axios';
import { axiosInstance } from '@/lib/axios/instance';
import { ApiClientError, shouldRetryRequest } from '@/lib/errors';
import { createQueryClient } from '@/lib/query-client';
import type { PaginatedData } from '@/types';

const originalAdapter = axiosInstance.defaults.adapter;
afterEach(() => {
  axiosInstance.defaults.adapter = originalAdapter;
});
const itemSchema = z.strictObject({ id: z.string() });
const response = (
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse<unknown> => ({
  config,
  data,
  status,
  statusText: '',
  headers: new AxiosHeaders(),
});
const success = {
  ok: true,
  data: [{ id: 'synthetic' }],
  requestId: 'request-fixture',
  meta: { page: 2, limit: 12, total: 25 },
};

describe('Axios BFF transport', () => {
  it('retains typed data, requestId and pagination through a single unwrap', async () => {
    axiosInstance.defaults.adapter = async (config) => {
      expect(config.baseURL).toBe(API_ENDPOINTS.BASE);
      expect(config.timeout).toBe(LIMITS.REQUEST_TIMEOUT_MS);
      return response(config, success);
    };
    expect(await requestApi({ url: '/fixture' }, z.array(itemSchema))).toEqual(
      success,
    );
  });
  it('preserves nested paginated data, including an empty list', async () => {
    const data: PaginatedData<z.infer<typeof itemSchema>> = {
      items: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
    };
    axiosInstance.defaults.adapter = async (config) =>
      response(config, { ok: true, data, requestId: 'empty-fixture' });
    const schema = z.strictObject({
      items: z.array(itemSchema),
      total: z.int(),
      page: z.int(),
      limit: z.int(),
      totalPages: z.int(),
    });
    expect((await requestApi({ url: '/fixture' }, schema)).data).toEqual(data);
  });
  it.each([401, 403, 404, 422])(
    'keeps HTTP %i as a typed error rather than empty data',
    async (status) => {
      axiosInstance.defaults.adapter = async (config) => {
        const body = {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: ERROR_COPY.VALIDATION_ERROR,
            fieldErrors: { name: ['Required'] },
          },
          requestId: 'failed-fixture',
        };
        throw new AxiosError(
          'raw diagnostic should stay private',
          'ERR_BAD_REQUEST',
          config,
          undefined,
          response(config, body, status),
        );
      };
      await expect(
        requestApi({ url: '/fixture' }, itemSchema),
      ).rejects.toMatchObject({
        status,
        code: 'VALIDATION_ERROR',
        requestId: 'failed-fixture',
        fieldErrors: { name: ['Required'] },
      });
    },
  );
  it('rejects a malformed success and does not expose upstream response bodies', async () => {
    axiosInstance.defaults.adapter = async (config) =>
      response(config, { privateDiagnostic: 'synthetic-secret' });
    await expect(
      requestApi({ url: '/fixture' }, itemSchema),
    ).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      message: ERROR_COPY.INVALID_RESPONSE,
    });
  });
  it('passes AbortSignal through Axios and distinguishes cancellation', async () => {
    const controller = new AbortController();
    let signalForwarded = false;
    const adapter: AxiosAdapter = (config) =>
      new Promise((_resolve, reject) => {
        signalForwarded = config.signal === controller.signal;
        config.signal?.addEventListener?.('abort', () =>
          reject(new CanceledError()),
        );
      });
    axiosInstance.defaults.adapter = adapter;
    const pending = requestApi(
      { url: '/fixture', signal: controller.signal },
      itemSchema,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'CANCELED' });
    expect(signalForwarded).toBe(true);
  });
  it.each([
    ['ECONNABORTED', 'TIMEOUT'],
    ['ERR_NETWORK', 'NETWORK_ERROR'],
  ])('maps %s without logging the Axios config', async (source, expected) => {
    axiosInstance.defaults.adapter = async () => {
      throw new AxiosError('synthetic-sensitive-diagnostic', source);
    };
    await expect(
      requestApi({ url: '/fixture' }, itemSchema),
    ).rejects.toMatchObject({
      code: expected,
      message:
        expected === 'TIMEOUT' ? ERROR_COPY.TIMEOUT : ERROR_COPY.NETWORK_ERROR,
    });
  });
  it('rejects absolute/protocol-relative destinations before sending', async () => {
    for (const url of ['https://example.test', '//example.test', 'relative']) {
      await expect(requestApi({ url }, itemSchema)).rejects.toMatchObject({
        code: 'INVALID_REQUEST',
      });
    }
  });
});

it('bounds retry and keeps 4xx/cancel/mutation failures out of retry loops', () => {
  for (const status of [401, 403, 404, 422, 429])
    expect(
      shouldRetryRequest(
        0,
        new ApiClientError({ code: 'INVALID_REQUEST', status }),
      ),
    ).toBe(false);
  expect(shouldRetryRequest(0, new ApiClientError({ code: 'CANCELED' }))).toBe(
    false,
  );
  expect(
    shouldRetryRequest(0, new ApiClientError({ code: 'NETWORK_ERROR' })),
  ).toBe(true);
  expect(
    shouldRetryRequest(1, new ApiClientError({ code: 'NETWORK_ERROR' })),
  ).toBe(false);
  const client = createQueryClient();
  expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  expect(client.getQueryDefaults(QUERY_KEYS.ROOT).staleTime).toBe(60_000);
  client.clear();
});
