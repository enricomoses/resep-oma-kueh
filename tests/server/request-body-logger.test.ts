import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as postCartValidate } from '@/app/api/cart/validate/route';
import { POST as postCheckoutPrepare } from '@/app/api/checkout/prepare/route';
import { POST as postClassRegistration } from '@/app/api/classes/prepare-registration/route';
import { logServerEvent } from '@/lib/logger.server';
import { readBoundedUtf8Body } from '@/lib/request-body.server';

afterEach(() => {
  vi.restoreAllMocks();
});

function createChunkedStreamRequest(
  url: string,
  chunks: Uint8Array[],
  headers: Record<string, string> = {},
): { request: Request; getChunksReadCount: () => number } {
  let index = 0;
  let chunksRead = 0;

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        chunksRead += 1;
        controller.enqueue(chunks[index]);
        index += 1;
      } else {
        controller.close();
      }
    },
  });

  const request = new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: stream,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });

  return { request, getChunksReadCount: () => chunksRead };
}

describe('Shared bounded request body & sanitized operational logger', () => {
  it('reads chunked UTF-8 body within byte limit', async () => {
    const encoder = new TextEncoder();
    const { request } = createChunkedStreamRequest(
      'http://localhost:3000/api/test',
      [encoder.encode('{"hello":'), encoder.encode('"dunia"}')],
    );

    const res = await readBoundedUtf8Body(request, 64);
    expect(res).toEqual({ ok: true, text: '{"hello":"dunia"}' });
  });

  it('aborts chunked stream early without buffering all chunks when limit exceeded', async () => {
    const encoder = new TextEncoder();
    const chunk20 = encoder.encode('a'.repeat(20));
    const { request, getChunksReadCount } = createChunkedStreamRequest(
      'http://localhost:3000/api/test',
      [chunk20, chunk20, chunk20, chunk20, chunk20],
    );

    const res = await readBoundedUtf8Body(request, 32);
    expect(res).toEqual({ ok: false, reason: 'too_large' });
    // Stops immediately after exceeding 32 bytes (2nd chunk = 40 bytes)
    expect(getChunksReadCount()).toBeLessThanOrEqual(3);
  });

  it('returns HTTP 413 for chunked oversized stream across checkout, class registration, and cart validate routes', async () => {
    const encoder = new TextEncoder();
    const oversizedChunk = encoder.encode('x'.repeat(20 * 1024));

    const checkoutReq = createChunkedStreamRequest(
      'http://localhost:3000/api/checkout/prepare',
      [oversizedChunk, oversizedChunk],
    ).request;
    const checkoutRes = await postCheckoutPrepare(checkoutReq);
    expect(checkoutRes.status).toBe(413);
    const checkoutJson = await checkoutRes.json();
    expect(checkoutJson.error.code).toBe('REQUEST_TOO_LARGE');

    const classReq = createChunkedStreamRequest(
      'http://localhost:3000/api/classes/prepare-registration',
      [oversizedChunk, oversizedChunk],
    ).request;
    const classRes = await postClassRegistration(classReq);
    expect(classRes.status).toBe(413);
    const classJson = await classRes.json();
    expect(classJson.error.code).toBe('REQUEST_TOO_LARGE');

    const cartReq = createChunkedStreamRequest(
      'http://localhost:3000/api/cart/validate',
      [oversizedChunk, oversizedChunk],
    ).request;
    const cartRes = await postCartValidate(cartReq);
    expect(cartRes.status).toBe(413);
    const cartJson = await cartRes.json();
    expect(cartJson.error.code).toBe('REQUEST_TOO_LARGE');
  });

  it('whitelists operational fields and suppresses PII/secrets in structured logs', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const dirtyEvent = {
      requestId: 'req-123',
      route: '/api/checkout/prepare',
      operation: 'prepare_quote',
      status: 200,
      durationMs: 12.6,
      count: 2,
      branchId: 'branch-1',
      branchCode: 'surabaya',
      customerName: 'RAHASIA PII',
      email: 'secret@example.com',
      rawBody: 'secret token',
    } as unknown as Parameters<typeof logServerEvent>[0];

    logServerEvent(dirtyEvent);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const logged = infoSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(logged).toEqual({
      requestId: 'req-123',
      route: '/api/checkout/prepare',
      operation: 'prepare_quote',
      status: 200,
      durationMs: 13,
      count: 2,
      branchId: 'branch-1',
      branchCode: 'surabaya',
    });
    expect('customerName' in logged).toBe(false);
    expect('email' in logged).toBe(false);
    expect('rawBody' in logged).toBe(false);

    logServerEvent({
      requestId: 'req-500',
      route: '/api/catalog',
      operation: 'list_catalog',
      status: 503,
      durationMs: -3,
      errorCode: 'UPSTREAM_ERROR',
    });
    expect(errorSpy).toHaveBeenCalledWith('[bakery-api]', {
      requestId: 'req-500',
      route: '/api/catalog',
      operation: 'list_catalog',
      status: 503,
      durationMs: 0,
      errorCode: 'UPSTREAM_ERROR',
    });
  });
});
