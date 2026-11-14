import 'server-only';

export type BoundedBodyReadResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'too_large' | 'read_error' };

/**
 * Reads a request body as UTF-8 up to `maxBytes` using a streaming chunk cap
 * before full buffering or JSON parsing, preventing chunked oversized payloads
 * from bypassing `Content-Length` checks (PRD §27.8).
 */
export async function readBoundedUtf8Body(
  request: Request,
  maxBytes: number,
): Promise<BoundedBodyReadResult> {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength) {
    const parsedLength = Number.parseInt(declaredLength, 10);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      return { ok: false, reason: 'too_large' };
    }
  }

  if (!request.body) {
    try {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > maxBytes) {
        return { ok: false, reason: 'too_large' };
      }
      return { ok: true, text: new TextDecoder('utf-8').decode(buffer) };
    } catch {
      return { ok: false, reason: 'read_error' };
    }
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, reason: 'too_large' };
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => {});
    return { ok: false, reason: 'read_error' };
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, text: new TextDecoder('utf-8').decode(combined) };
}
