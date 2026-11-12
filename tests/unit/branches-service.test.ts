import { AxiosHeaders } from 'axios';
import { afterEach, expect, it } from 'vitest';
import { readBranches } from '@/services/branches.service';
import { axiosInstance } from '@/lib/axios/instance';

const adapter = axiosInstance.defaults.adapter;
afterEach(() => {
  axiosInstance.defaults.adapter = adapter;
});
it('passes branch code and AbortSignal to the BFF and retains the validated envelope', async () => {
  const controller = new AbortController();
  axiosInstance.defaults.adapter = async (config) => {
    expect(config.url).toBe('/branches');
    expect(config.params).toEqual({ branch: 'surabaya' });
    expect(config.signal).toBe(controller.signal);
    return {
      config,
      data: {
        ok: true,
        data: { items: [], resolvedBranchId: null },
        requestId: 'fixture-trace',
      },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
    };
  };
  expect((await readBranches('surabaya', controller.signal)).requestId).toBe(
    'fixture-trace',
  );
  controller.abort();
  await expect(readBranches(null, controller.signal)).rejects.toMatchObject({
    code: 'CANCELED',
  });
});
