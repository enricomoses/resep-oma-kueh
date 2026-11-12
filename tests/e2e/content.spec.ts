import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  CONTENT_COPY,
  CONTENT_DEFAULTS,
  PAGE_METADATA,
} from '@/constants/content.constant';
import type { PublicBranch } from '@/types/branch';

const syntheticBranches: PublicBranch[] = [
  {
    id: 'f0400000-0000-4000-8000-000000000001',
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsappNumber: '6281703384308',
    address: 'Rungkut Asri Tengah V No. 22, Surabaya',
    mapsUrl: null,
  },
  {
    id: 'f0400000-0000-4000-8000-000000000002',
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Bintaro',
    whatsappNumber: '6285119785194',
    address: null,
    mapsUrl: null,
  },
];

let branches: PublicBranch[] = syntheticBranches;

test.beforeEach(async ({ page, request }) => {
  if (process.env.BAKERY_SITE_LOCAL === '1') {
    const response = await request.get('/api/branches');
    expect(response.status()).toBe(200);
    branches = (await response.json()).data.items;
  } else {
    branches = syntheticBranches;
    await page.route('**/api/branches**', (route) => {
      const code = new URL(route.request().url()).searchParams.get('branch');
      return route.fulfill({
        json: {
          ok: true,
          data: {
            items: branches,
            resolvedBranchId:
              branches.find((branch) => branch.code === code)?.id ?? null,
          },
          requestId: 'synthetic-content-fixture',
        },
      });
    });
  }
});

test('renders /about and /faq with distinct metadata, non-certification narrative, and WCAG compliance', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('/about?branch=surabaya');
  await expect(page).toHaveTitle(PAGE_METADATA.ABOUT.title);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    CONTENT_DEFAULTS.ABOUT_STORY.title,
  );
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: CONTENT_COPY.ABOUT_TEAM_TITLE,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(CONTENT_COPY.ABOUT_TEAM_DISCLAIMER),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.goto('/faq?branch=surabaya');
  await expect(page).toHaveTitle(PAGE_METADATA.FAQ.title);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    CONTENT_COPY.FAQ_HEADING,
  );
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: CONTENT_COPY.FAQ_BASELINE_TITLE,
    }),
  ).toBeVisible();
  if (process.env.BAKERY_SITE_LOCAL === '1') {
    await expect(
      page.getByRole('heading', {
        level: 3,
        name: 'DEMO — Apakah data ini dapat dipakai memesan?',
      }),
    ).toBeVisible();
  }
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('renders /privacy and /ordering-policy with distinct metadata, template vs published badges, and WCAG compliance', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('/privacy?branch=surabaya');
  await expect(page).toHaveTitle(PAGE_METADATA.PRIVACY.title);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    CONTENT_DEFAULTS.LEGAL_PRIVACY.title,
  );
  await expect(
    page.getByText(CONTENT_COPY.SOURCE_TEMPLATE_BADGE).first(),
  ).toBeVisible();
  await expect(
    page.getByText(
      /TIDAK mengklaim bahwa tidak ada data yang dikirim ke server/i,
    ),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.goto('/ordering-policy?branch=surabaya');
  await expect(page).toHaveTitle(PAGE_METADATA.ORDERING_POLICY.title);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    CONTENT_DEFAULTS.LEGAL_ORDERING_POLICY.title,
  );
  await expect(
    page.getByText(CONTENT_COPY.SOURCE_TEMPLATE_BADGE).first(),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('renders /contact with verified Surabaya address, pending Bintaro address, and branch-aware B2B WhatsApp consultation link on mobile and desktop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact?branch=surabaya');
  await page.evaluate(() => document.fonts.ready);

  await expect(page).toHaveTitle(PAGE_METADATA.CONTACT.title);
  await expect(
    page.getByText('Rungkut Asri Tengah V No. 22, Surabaya').first(),
  ).toBeVisible();
  await expect(
    page.getByText(CONTENT_COPY.CONTACT_ADDRESS_PENDING),
  ).toBeVisible();

  const b2bSelect = page.getByLabel(CONTENT_COPY.CONTACT_B2B_BRANCH_LABEL);
  await expect(b2bSelect).toHaveValue('surabaya');

  const surabayaB2bLink = page.getByRole('link', {
    name: `${CONTENT_COPY.CONTACT_B2B_CTA_PREFIX} Surabaya`,
  });
  await expect(surabayaB2bLink).toHaveAttribute(
    'href',
    /https:\/\/wa\.me\/6281703384308\?text=/,
  );

  await b2bSelect.selectOption('bintaro');
  const bintaroB2bLink = page.getByRole('link', {
    name: `${CONTENT_COPY.CONTACT_B2B_CTA_PREFIX} Bintaro`,
  });
  await expect(bintaroB2bLink).toHaveAttribute(
    'href',
    /https:\/\/wa\.me\/6285119785194\?text=/,
  );

  await page.screenshot({
    path: 'test-results/f08-contact-desktop.png',
    fullPage: true,
  });

  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.screenshot({
    path: 'test-results/f08-contact-mobile.png',
    fullPage: true,
  });
});

test('production HTTP /api/content and /api/faqs contract on real local anonymous SDK', async ({
  request,
}) => {
  test.skip(
    process.env.BAKERY_SITE_LOCAL !== '1',
    'Real local DB harness required; UI mocks are not API evidence.',
  );

  const contentRes = await request.get(
    '/api/content?keys=business.contacts,about.story,legal.privacy,legal.ordering_policy',
  );
  expect(contentRes.status()).toBe(200);
  expect(contentRes.headers()['cache-control']).toBe('no-store');
  const contentPayload = await contentRes.json();
  expect(contentPayload.ok).toBe(true);
  const contactsEntry = contentPayload.data.items.find(
    (item: { key: string }) => item.key === 'business.contacts',
  );
  expect(contactsEntry.source).toBe('published');
  const privacyEntry = contentPayload.data.items.find(
    (item: { key: string }) => item.key === 'legal.privacy',
  );
  expect(privacyEntry.source).toBe('template');

  const invalidContentRes = await request.get('/api/content?keys=unknown_key');
  expect(invalidContentRes.status()).toBe(400);

  const faqsRes = await request.get('/api/faqs');
  expect(faqsRes.status()).toBe(200);
  expect(faqsRes.headers()['cache-control']).toBe('no-store');
  const faqsPayload = await faqsRes.json();
  expect(faqsPayload.ok).toBe(true);
  expect(faqsPayload.data.items).toHaveLength(1);
  expect(faqsPayload.data.items[0].question).toContain('DEMO');
});
