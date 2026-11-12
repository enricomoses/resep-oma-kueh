import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function fixture(page: Page) {
  await page.goto('/');
  const assets = await page.evaluate(() => ({
    classes: document.documentElement.className,
    styles: Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    ).map((link) => link.getAttribute('href')!),
  }));
  await page.goto('http://127.0.0.1:3101');
  await page.evaluate(async (assets) => {
    document.documentElement.className = assets.classes;
    await Promise.all(
      assets.styles.map(
        (href) =>
          new Promise<void>((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error('Fixture stylesheet failed'));
            document.head.append(link);
          }),
      ),
    );
    await document.fonts.ready;
  }, assets);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Fixture interaksi DEMO',
  );
}
async function accessible(page: Page) {
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
}

for (const width of [375, 768, 1280, 1440])
  test(`foundation composition ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.name));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle('Resep Oma Kueh');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'A little taste of home, in every bite.',
    );
    await expect(page.getByLabel('Mode demo lokal')).toBeVisible();
    await expect(
      page.getByText('DEMO · logo resmi belum tersedia'),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    const fonts = await page.evaluate(() => [
      getComputedStyle(document.body).fontFamily,
      getComputedStyle(document.querySelector('h1')!).fontFamily,
      getComputedStyle(document.querySelector('.media-placeholder-mark')!)
        .fontFamily,
    ]);
    expect(fonts[0]).toContain('Plus Jakarta Sans');
    expect(fonts[1]).toContain('Fraunces');
    expect(fonts[2]).toContain('Barlow Condensed');
    const link = page.getByRole('link', { name: 'Explore Menu' });
    for (let index = 0; index < 16; index++) {
      await page.keyboard.press('Tab');
      if (await link.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(link).toBeFocused();
    expect(await link.evaluate((el) => getComputedStyle(el).outlineWidth)).toBe(
      '3px',
    );
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await accessible(page);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `test-results/f05-root-${width}.png`,
      fullPage: true,
    });
  });

test('200% CSS zoom reflows and reduced motion removes transitions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  const link = page.getByRole('link', { name: 'Explore Menu' });
  await expect(link).toBeVisible();
  expect(
    await link.evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
  await accessible(page);
  await page.screenshot({
    path: 'test-results/f05-zoom-200.png',
    fullPage: true,
  });
});

test('form associations, errors, native selection and controlled quantity', async ({
  page,
}) => {
  await fixture(page);
  const input = page.getByLabel('Nama contoh');
  await input.fill('');
  await page.getByRole('button', { name: 'Periksa contoh' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAccessibleDescription(
    /Gunakan data DEMO.*Isi nama contoh/,
  );
  await accessible(page);
  await input.fill('DEMO');
  await page.getByLabel('Pilihan contoh').selectOption('b');
  await page.getByLabel('Catatan contoh').fill('DEMO');
  await page.getByRole('button', { name: 'Periksa contoh' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Contoh valid' }),
  ).toBeVisible();
  const less = page.getByRole('button', { name: 'Kurangi jumlah contoh' });
  const more = page.getByRole('button', { name: 'Tambah jumlah contoh' });
  await expect(less).toBeDisabled();
  await more.click();
  await more.click();
  await expect(more).toBeDisabled();
  await less.click();
  await expect(more).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Memproses…' })).toBeDisabled();
  await page.screenshot({
    path: 'test-results/f05-controls.png',
    fullPage: true,
  });
});

test('native modal traps keyboard, restores focus, Escape, backdrop and stacked scroll cleanup', async ({
  page,
}) => {
  await fixture(page);
  await page.evaluate(() => {
    document.body.style.overflow = 'clip';
  });
  const opener = page.getByRole('button', { name: 'Buka dialog', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', {
    name: 'Dialog contoh',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);
  await expect(page.getByLabel('Fokus awal')).toBeFocused();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.getByRole('button', { name: 'Buka panel bertumpuk' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Dialog kedua' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    'hidden',
  );
  await accessible(page);
  await page.screenshot({
    path: 'test-results/f05-dialog.png',
    fullPage: false,
  });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
  await opener.click();
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
  await opener.click();
  await page.getByRole('button', { name: 'Unmount dari dalam' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('clip');
});

test('mobile drawer scrolls internally and returns focus on close', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await fixture(page);
  const opener = page.getByRole('button', { name: 'Buka drawer' });
  await opener.click();
  const drawer = page.getByRole('dialog', { name: 'Drawer contoh' });
  await expect(drawer).toBeVisible();
  await accessible(page);
  await page.screenshot({
    path: 'test-results/f05-drawer-375.png',
    fullPage: false,
  });
  const body = drawer.locator('.ui-modal-body');
  await body.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  expect(await body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Selesai drawer' }).click();
  await expect(drawer).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});
