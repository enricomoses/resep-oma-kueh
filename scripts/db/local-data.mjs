import assert from 'node:assert/strict';

import { demoAssetPath, demoPng } from './demo-asset.mjs';
import { getLocalHarness } from './local-harness.mjs';

export async function uploadDemoAssets() {
  const local = await getLocalHarness();
  const bytes = demoPng();
  for (const bucket of ['product-images', 'class-images', 'brand-assets']) {
    const url = `${local.url}/storage/v1/object/${bucket}/${demoAssetPath}`;
    const existing = await fetch(
      `${local.url}/storage/v1/object/public/${bucket}/${demoAssetPath}`,
    );
    if (existing.ok) {
      assert.ok(
        Buffer.from(await existing.arrayBuffer()).equals(bytes),
        'existing DEMO asset changed; refusing overwrite',
      );
      continue;
    }
    assert.ok(
      [400, 404].includes(existing.status),
      'Storage check failed; not assuming missing asset',
    );
    const uploaded = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: local.serviceKey,
        Authorization: `Bearer ${local.serviceKey}`,
        'Content-Type': 'image/png',
      },
      body: bytes,
      signal: AbortSignal.timeout(15000),
    });
    assert.ok(
      uploaded.status === 200,
      'LOCAL technical DEMO asset upload failed',
    );
  }
  console.log(
    'LOCAL technical DEMO placeholders ready; existing files never overwritten.',
  );
}
