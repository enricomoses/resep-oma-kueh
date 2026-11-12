import { expect, test } from '@playwright/test';

test('server-rendered scaffold hydrates with the query provider and no page errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.name));
  await page.goto('/');
  await expect(page).toHaveTitle('Resep Oma Kueh');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'To get started',
  );
  await expect(
    page.getByRole('link', { name: 'Documentation' }),
  ).toHaveAttribute('href', /nextjs\.org/);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: 'test-results/foundation-desktop.png',
    fullPage: true,
  });
});
