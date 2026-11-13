import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { CLASSES_COPY } from '@/constants/classes.constant';
import type { PublicBranch } from '@/types/branch';
import type { PublicClassProgram } from '@/types/classes';

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const PROGRAM_OPEN_ID = 'f0400000-0000-4000-8000-000000000940';
const PROGRAM_ASK_ID = 'f0400000-0000-4000-8000-000000000942';
const SESSION_SBY_ID = 'f0400000-0000-4000-8000-000000000951';
const SESSION_BTR_ID = 'f0400000-0000-4000-8000-000000000955';
const SESSION_CANCELLED_ID = 'f0400000-0000-4000-8000-000000000953';

const SYNTHETIC_BRANCHES: PublicBranch[] = [
  {
    id: SURABAYA_ID,
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsappNumber: '6281703384308',
    address: 'Rungkut Asri Tengah V No. 22, Surabaya',
    mapsUrl: null,
  },
  {
    id: BINTARO_ID,
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Tangerang Selatan',
    whatsappNumber: '6285119785194',
    address: null,
    mapsUrl: null,
  },
];

const SYNTHETIC_PROGRAMS: PublicClassProgram[] = [
  {
    id: PROGRAM_OPEN_ID,
    title: 'Little Baker Chiffon Class',
    slug: 'little-baker-chiffon-class',
    shortDescription: 'Kelas baking kue lembut bersama dapur Oma.',
    description:
      'Belajar teknik adonan dasar hingga menghias kue di dapur Resep Oma Kueh.',
    basePriceIdr: 185_000,
    ageMin: 4,
    ageMax: 12,
    durationMinutes: 90,
    coverImageUrl: null,
    coverAltText: 'Suasana dapur Little Baker Chiffon Class',
    includedItems: ['Bahan & peralatan baking', 'Celemek pinjaman'],
    upcomingSessions: [
      {
        id: SESSION_SBY_ID,
        programId: PROGRAM_OPEN_ID,
        startsAt: '2027-06-15T03:00:00.000Z',
        endsAt: '2027-06-15T04:30:00.000Z',
        registrationDeadlineAt: '2027-06-14T12:00:00.000Z',
        capacity: 12,
        seatsLeft: 5,
        capacityIsEstimate: true,
        effectivePriceIdr: 185_000,
        hasPriceOverride: false,
        status: 'scheduled',
        isRegistrationOpen: true,
        isRegisterable: true,
        unavailableReason: null,
        branch: {
          id: SURABAYA_ID,
          code: 'surabaya',
          name: 'Surabaya',
          city: 'Surabaya',
          whatsappNumber: '6281703384308',
          address: 'Rungkut Asri Tengah V No. 22, Surabaya',
        },
      },
      {
        id: SESSION_BTR_ID,
        programId: PROGRAM_OPEN_ID,
        startsAt: '2027-06-20T03:00:00.000Z',
        endsAt: '2027-06-20T04:30:00.000Z',
        registrationDeadlineAt: '2027-06-19T12:00:00.000Z',
        capacity: 10,
        seatsLeft: null,
        capacityIsEstimate: true,
        effectivePriceIdr: 215_000,
        hasPriceOverride: true,
        status: 'scheduled',
        isRegistrationOpen: true,
        isRegisterable: true,
        unavailableReason: null,
        branch: {
          id: BINTARO_ID,
          code: 'bintaro',
          name: 'Bintaro',
          city: 'Tangerang Selatan',
          whatsappNumber: '6285119785194',
          address: null,
        },
      },
      {
        id: SESSION_CANCELLED_ID,
        programId: PROGRAM_OPEN_ID,
        startsAt: '2027-06-25T03:00:00.000Z',
        endsAt: '2027-06-25T04:30:00.000Z',
        registrationDeadlineAt: '2027-06-24T12:00:00.000Z',
        capacity: 10,
        seatsLeft: 4,
        capacityIsEstimate: true,
        effectivePriceIdr: 215_000,
        hasPriceOverride: true,
        status: 'cancelled',
        isRegistrationOpen: false,
        isRegisterable: false,
        unavailableReason: 'SESSION_CANCELLED',
        branch: {
          id: BINTARO_ID,
          code: 'bintaro',
          name: 'Bintaro',
          city: 'Tangerang Selatan',
          whatsappNumber: '6285119785194',
          address: null,
        },
      },
    ],
    registerableSessionCount: 2,
  },
  {
    id: PROGRAM_ASK_ID,
    title: 'Seasonal Tartlet Session',
    slug: 'seasonal-tartlet-session',
    shortDescription: 'Jadwal gelombang berikutnya sedang disiapkan.',
    description: 'Menunggu konfirmasi gelombang berikutnya dari admin.',
    basePriceIdr: 195_000,
    ageMin: 6,
    ageMax: 14,
    durationMinutes: 120,
    coverImageUrl: null,
    coverAltText: 'Foto tartlet kelas baking',
    includedItems: ['Bahan tartlet'],
    upcomingSessions: [],
    registerableSessionCount: 0,
  },
];

function filterProgramByBranch(
  program: PublicClassProgram,
  branchCode: string | null,
): PublicClassProgram {
  if (!branchCode) return program;
  const sessions = program.upcomingSessions.filter(
    (s) => s.branch.code === branchCode,
  );
  return {
    ...program,
    upcomingSessions: sessions,
    registerableSessionCount: sessions.filter((s) => s.isRegisterable).length,
  };
}

test.beforeEach(async ({ page }) => {
  await page.route('https://wa.me/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'intercepted-whatsapp-handoff',
    }),
  );

  if (process.env.BAKERY_SITE_LOCAL === '1') {
    return;
  }

  await page.route('**/api/branches**', (route) => {
    const code = new URL(route.request().url()).searchParams.get('branch');
    return route.fulfill({
      json: {
        ok: true,
        data: {
          items: SYNTHETIC_BRANCHES,
          resolvedBranchId:
            SYNTHETIC_BRANCHES.find((b) => b.code === code)?.id ?? null,
        },
        requestId: 'synthetic-classes-branches',
      },
    });
  });

  await page.route('**/api/classes**', async (route) => {
    const url = new URL(route.request().url());

    if (
      url.pathname === '/api/classes/prepare-registration' &&
      route.request().method() === 'POST'
    ) {
      const body = JSON.parse(route.request().postData() ?? '{}') as {
        sessionId?: string;
        attendeeCount?: number;
        adultContactName?: string | null;
      };
      const isBintaro = body.sessionId === SESSION_BTR_ID;
      const branch = isBintaro ? SYNTHETIC_BRANCHES[1] : SYNTHETIC_BRANCHES[0];
      const unitPriceIdr = isBintaro ? 215_000 : 185_000;
      const attendeeCount = Number(body.attendeeCount ?? 1);
      const estimatedTotalIdr = unitPriceIdr * attendeeCount;
      const message = [
        `Halo admin Resep Oma Kueh ${branch.name},`,
        `Mohon bantu konfirmasi pendaftaran ROK Baking Class (${attendeeCount} orang).`,
        `Estimasi total: Rp ${estimatedTotalIdr.toLocaleString('id-ID')}.`,
        body.adultContactName ? `Kontak wali: ${body.adultContactName}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      return route.fulfill({
        json: {
          ok: true,
          data: {
            sessionId: body.sessionId ?? SESSION_SBY_ID,
            programId: PROGRAM_OPEN_ID,
            programTitle: 'Little Baker Chiffon Class',
            programSlug: 'little-baker-chiffon-class',
            branchId: branch.id,
            branchCode: branch.code,
            branchName: branch.name,
            startsAt: isBintaro
              ? '2027-06-20T03:00:00.000Z'
              : '2027-06-15T03:00:00.000Z',
            endsAt: isBintaro
              ? '2027-06-20T04:30:00.000Z'
              : '2027-06-15T04:30:00.000Z',
            registrationDeadlineAt: '2027-06-14T12:00:00.000Z',
            formattedScheduleJakarta: '15 Jun 2027, 10.00 WIB – 11.30 WIB',
            attendeeCount,
            unitPriceIdr,
            estimatedTotalIdr,
            capacity: isBintaro ? 10 : 12,
            seatsLeft: isBintaro ? null : 5,
            capacityIsEstimate: true,
            adultContactName: body.adultContactName ?? null,
            whatsappNumber: branch.whatsappNumber,
            whatsappUrl: `https://wa.me/${branch.whatsappNumber}?text=${encodeURIComponent(message)}`,
            whatsappMessage: message,
            requiresCopy: false,
            manualConfirmationNote: CLASSES_COPY.CAPACITY_DISCLAIMER,
          },
          requestId: 'synthetic-prepare-reg',
        },
      });
    }

    if (url.pathname === '/api/classes') {
      const branchCode = url.searchParams.get('branch');
      return route.fulfill({
        json: {
          ok: true,
          data: {
            items: SYNTHETIC_PROGRAMS.map((p) =>
              filterProgramByBranch(p, branchCode),
            ),
            resolvedBranchId:
              SYNTHETIC_BRANCHES.find((b) => b.code === branchCode)?.id ?? null,
            evaluatedAtUtc: '2026-11-13T10:00:00.000Z',
          },
          requestId: 'synthetic-classes-list',
        },
      });
    }

    const slug = url.pathname.split('/').pop() ?? '';
    const branchCode = url.searchParams.get('branch');
    const found = SYNTHETIC_PROGRAMS.find((p) => p.slug === slug);
    if (!found) {
      return route.fulfill({
        status: 404,
        json: {
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Not found' },
          requestId: 'nf',
        },
      });
    }
    return route.fulfill({
      json: {
        ok: true,
        data: {
          program: filterProgramByBranch(found, branchCode),
          resolvedBranchId:
            SYNTHETIC_BRANCHES.find((b) => b.code === branchCode)?.id ?? null,
          evaluatedAtUtc: '2026-11-13T10:00:00.000Z',
        },
        requestId: 'synthetic-class-detail',
      },
    });
  });
});

test.describe('F21 ROK Baking Classes E2E', () => {
  test('renders public classes catalog, ask-next-class fallback, detail registration flow, and 390px mobile + WCAG', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/classes?branch=bintaro');

    await expect(
      page.getByRole('heading', { name: CLASSES_COPY.TITLE }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Little Baker Chiffon Class' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: CLASSES_COPY.ASK_NEXT_CLASS_CTA }).first(),
    ).toHaveAttribute('href', /https:\/\/wa\.me\/6285119785194/);

    const desktopAxe = await new AxeBuilder({ page }).analyze();
    expect(desktopAxe.violations).toEqual([]);

    // Navigate to detail page & test cancelled disabled state + unknown seats + WA preparation
    await page.goto('/classes/little-baker-chiffon-class?branch=bintaro');
    await expect(
      page.getByRole('heading', { name: 'Little Baker Chiffon Class' }),
    ).toBeVisible();
    await expect(page.getByText(CLASSES_COPY.UNKNOWN_SEATS_NOTE)).toBeVisible();
    await expect(
      page.getByRole('button', { name: CLASSES_COPY.STATUS_BADGE.CANCELLED }),
    ).toBeDisabled();

    await page.getByLabel(/Jumlah Peserta/i).fill('2');
    await page.getByLabel(/Nama Kontak/i).fill('Ibu Ratna');
    await page.getByLabel(CLASSES_COPY.MANUAL_CONFIRM_LABEL).check();
    await page
      .getByRole('button', { name: CLASSES_COPY.REGISTER_SUBMIT_CTA })
      .click();

    const openWaLink = page.getByRole('link', {
      name: CLASSES_COPY.OPEN_WHATSAPP_CTA,
    });
    await expect(openWaLink).toBeVisible();
    await expect(openWaLink).toHaveAttribute(
      'href',
      /https:\/\/wa\.me\/6285119785194\?text=/,
    );

    // 390px mobile viewport layout check (no horizontal overflow)
    await page.setViewportSize({ width: 390, height: 844 });
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
    expect(pageErrors).toEqual([]);
  });

  test('enforces admin/classes redirect, API 401/403 JSON + no-store, and CSRF protection', async ({
    page,
    request,
  }) => {
    await page.goto('/admin/classes');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);
    const robotsMeta = page.locator('meta[name="robots"]').first();
    await expect(robotsMeta).toHaveAttribute('content', /noindex/i);

    for (const endpoint of [
      '/api/admin/classes/programs',
      '/api/admin/classes/sessions',
    ]) {
      const res = await request.get(endpoint);
      expect(res.status()).toBe(401);
      expect(res.headers()['cache-control']).toContain('no-store');
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('UNAUTHENTICATED');
    }

    const csrfProgram = await request.post('/api/admin/classes/programs', {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
      },
      data: {
        title: 'Cross Origin Class',
        slug: 'cross-origin-class',
        basePriceIdr: 150_000,
      },
    });
    expect(csrfProgram.status()).toBe(403);
  });
});
