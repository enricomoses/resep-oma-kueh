import { AxiosHeaders } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';

import { axiosInstance } from '@/lib/axios/instance';
import { promotionService } from '@/services/promotion.service';
import { buildListParams } from '@/utils/api';

const originalAdapter = axiosInstance.defaults.adapter;

afterEach(() => {
  axiosInstance.defaults.adapter = originalAdapter;
});

describe('buildListParams', () => {
  it('omits null, undefined, and blank strings while preserving 0, false, and trimmed text', () => {
    expect(
      buildListParams({
        q: '  pandan  ',
        empty: '   ',
        nil: null,
        missing: undefined,
        page: 0,
        active: false,
        status: 'all',
      }),
    ).toEqual({
      q: 'pandan',
      page: 0,
      active: false,
      status: 'all',
    });
  });

  it('omits "all" sentinel only when omitAll is enabled and returns undefined when empty', () => {
    expect(
      buildListParams({ status: 'all', category: 'all' }, { omitAll: true }),
    ).toBeUndefined();
    expect(buildListParams(undefined)).toBeUndefined();
  });
});

describe('promotionService contract', () => {
  it('preserves full ApiSuccess envelope and forwards branch param and AbortSignal', async () => {
    const controller = new AbortController();
    axiosInstance.defaults.adapter = async (config) => {
      expect(config.url).toBe('/promotions');
      expect(config.params).toEqual({ branch: 'surabaya' });
      expect(config.signal).toBe(controller.signal);
      return {
        config,
        data: {
          ok: true,
          data: {
            promotions: [],
            shippingBanner: null,
            resolvedBranchId: null,
          },
          requestId: 'promo-req-1',
        },
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
      };
    };

    const envelope = await promotionService.getPublic(
      'surabaya',
      controller.signal,
    );
    expect(envelope.ok).toBe(true);
    expect(envelope.requestId).toBe('promo-req-1');
  });
});
