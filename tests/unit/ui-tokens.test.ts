import { readFileSync } from 'node:fs';

import { expect, it } from 'vitest';

const css = readFileSync(
  new URL('../../src/app/globals.css', import.meta.url),
  'utf8',
);
function luminance(token: string) {
  const value = css.match(new RegExp(`${token}:\\s*#([0-9a-f]{6});`, 'i'))?.[1];
  if (!value) throw new Error(`Missing color token ${token}`);
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function contrast(a: string, b: string) {
  const first = luminance(a),
    second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

it('PRD text/status pairs meet AA and control/focus borders remain distinguishable', () => {
  for (const [text, background] of [
    ['--brand-deep', '--brand-cream'],
    ['--text-cocoa', '--brand-cream'],
    ['--surface-white', '--brand-burgundy'],
    ['--brand-deep', '--accent-rose'],
    ['--text-cocoa', '--border-sand'],
    ['--success', '--surface-white'],
    ['--danger', '--surface-white'],
  ])
    expect(
      contrast(text, background),
      `${text} / ${background}`,
    ).toBeGreaterThanOrEqual(4.5);
  expect(
    contrast('--control-border', '--surface-white'),
  ).toBeGreaterThanOrEqual(3);
  expect(contrast('--brand-deep', '--brand-cream')).toBeGreaterThanOrEqual(3);
});
