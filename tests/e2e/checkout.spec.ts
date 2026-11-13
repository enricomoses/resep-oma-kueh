import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  CHECKOUT_COPY,
  CHECKOUT_WARNING_CODES,
} from '@/constants/checkout.constant';
import type { PublicBranch } from '@/types/branch';
import {
  buildWhatsAppUrl,
  composeWhatsAppMessage,
  formatJakartaDateIso,
} from '@/utils/checkout';

const surabayaId = 'f0400000-0000-4000-8000-000000000001';
const bintaroId = 'f0400000-0000-4000-8000-000000000002';
const coffeeVariantId = 'f0400000-0000-4000-8000-000000000601';
const bundleVariantId = 'f0400000-0000-4000-8000-000000000602';
const pandanChoiceId = 'f0400000-0000-4000-8000-000000000701';
const earlGreyChoiceId = 'f0400000-0000-4000-8000-000000000702';

const syntheticBranches: PublicBranch[] = [
  {
    id: surabayaId,
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsappNumber: '6281703384308',
    address: 'Rungkut Asri Tengah V No. 22, Surabaya',
    mapsUrl: null,
  },
  {
    id: bintaroId,
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Bintaro',
    whatsappNumber: '6285119785194',
    address: null,
    mapsUrl: null,
  },
];

function buildPersistedCartState(branchId: string, branchCode: string) {
  return JSON.stringify({
    state: {
      version: 1,
      branchId,
      branchCode,
      lines: [
        {
          id: `${branchId}:${coffeeVariantId}:`,
          branchId,
          variantId: coffeeVariantId,
          choiceIds: [],
          quantity: 2,
          addedAt: '2026-11-13T08:00:00.000Z',
          updatedAt: '2026-11-13T08:00:00.000Z',
        },
        {
          id: `${branchId}:${bundleVariantId}:${pandanChoiceId},${earlGreyChoiceId}`,
          branchId,
          variantId: bundleVariantId,
          choiceIds: [pandanChoiceId, earlGreyChoiceId],
          quantity: 1,
          addedAt: '2026-11-13T08:01:00.000Z',
          updatedAt: '2026-11-13T08:01:00.000Z',
        },
      ],
    },
    version: 1,
  });
}

function buildCartValidateResponse(branchId: string, branchName: string) {
  return {
    ok: true,
    data: {
      branchId,
      branchName,
      lines: [
        {
          lineId: `${branchId}:${coffeeVariantId}:`,
          variantId: coffeeVariantId,
          productId: 'f0400000-0000-4000-8000-000000000400',
          productName: 'DEMO — Coffee Chiffon',
          productSlug: 'demo-coffee',
          productType: 'variants',
          variantName: 'Coffee Chiffon Mini 14cm',
          sku: 'DEMO-COFFEE-MINI',
          sizeLabel: 'Mini 14cm',
          imageAlt: 'DEMO — foto utama Coffee Chiffon',
          quantity: 2,
          unitGrossIdr: 70_000,
          unconditionalDiscountIdr: 0,
          effectiveUnitPriceIdr: 70_000,
          subtotalIdr: 140_000,
          availabilityStatus: 'available',
          conflict: 'none',
          conflictMessage: null,
          bundleBreakdown: [],
          choiceNames: [],
        },
        {
          lineId: `${branchId}:${bundleVariantId}:${pandanChoiceId},${earlGreyChoiceId}`,
          variantId: bundleVariantId,
          productId: 'f0400000-0000-4000-8000-000000000401',
          productName: 'DEMO — Paket Chiffon Slice Mix',
          productSlug: 'demo-slice-mix',
          productType: 'bundle',
          variantName: 'Paket 12 Potong',
          sku: 'DEMO-SLICE-MIX-12',
          sizeLabel: '12 Potong',
          imageAlt: 'DEMO — Paket Chiffon Slice Mix',
          quantity: 1,
          unitGrossIdr: 160_000,
          unconditionalDiscountIdr: 0,
          effectiveUnitPriceIdr: 160_000,
          subtotalIdr: 160_000,
          availabilityStatus: 'available',
          conflict: 'none',
          conflictMessage: null,
          bundleBreakdown: [
            {
              slotOrGroup: 'cheese',
              label: 'Keju (Cheese)',
              quantity: 3,
              priceDeltaIdr: 0,
              componentVariantId: null,
              isFixed: true,
            },
            {
              slotOrGroup: 'choco',
              label: 'Cokelat (Choco)',
              quantity: 3,
              priceDeltaIdr: 0,
              componentVariantId: null,
              isFixed: true,
            },
            {
              slotOrGroup: 'Pilihan Rasa 1',
              label: 'Pandan',
              quantity: 3,
              priceDeltaIdr: 5_000,
              componentVariantId: null,
              isFixed: false,
            },
            {
              slotOrGroup: 'Pilihan Rasa 2',
              label: 'Earl Grey',
              quantity: 3,
              priceDeltaIdr: 5_000,
              componentVariantId: null,
              isFixed: false,
            },
          ],
          choiceNames: ['Pandan', 'Earl Grey'],
        },
      ],
      estimatedSubtotalIdr: 300_000,
      totalDiscountIdr: 0,
      estimatedTotalIdr: 300_000,
      hasBlockingConflicts: false,
      hasPriceChanges: false,
    },
    requestId: 'synthetic-cart-validate-req',
  };
}

function buildPrepareQuoteResponse(params: {
  branch: PublicBranch;
  customerName: string;
  method: 'delivery' | 'pickup';
  requestedDate: string;
  requestedTimeWindow?: string | null;
  address?: string | null;
  note?: string | null;
  expectedQuoteFingerprint?: string | null;
  overrideFingerprint?: string;
  overrideCoffeeUnitIdr?: number;
}) {
  const coffeeUnit = params.overrideCoffeeUnitIdr ?? 70_000;
  const coffeeLineTotal = coffeeUnit * 2;
  const bundleUnit = 160_000;
  const subtotalIdr = coffeeLineTotal + bundleUnit;
  const estimatedTotalIdr = subtotalIdr;
  const fingerprint =
    params.overrideFingerprint ??
    (params.branch.code === 'surabaya' ? '1'.repeat(64) : '2'.repeat(64));

  const lines = [
    {
      variantId: coffeeVariantId,
      productName: 'DEMO — Coffee Chiffon',
      variantName: 'Coffee Chiffon Mini 14cm',
      sku: 'DEMO-COFFEE-MINI',
      sizeLabel: 'Mini 14cm',
      quantity: 2,
      unitGrossIdr: coffeeUnit,
      unitPriceIdr: coffeeUnit,
      discountIdr: 0,
      lineTotalIdr: coffeeLineTotal,
      options: [],
    },
    {
      variantId: bundleVariantId,
      productName: 'DEMO — Paket Chiffon Slice Mix',
      variantName: 'Paket 12 Potong',
      sku: 'DEMO-SLICE-MIX-12',
      sizeLabel: '12 Potong',
      quantity: 1,
      unitGrossIdr: bundleUnit,
      unitPriceIdr: bundleUnit,
      discountIdr: 0,
      lineTotalIdr: bundleUnit,
      options: [
        {
          choiceId: pandanChoiceId,
          label: 'Pandan',
          priceDeltaIdr: 5_000,
        },
        {
          choiceId: earlGreyChoiceId,
          label: 'Earl Grey',
          priceDeltaIdr: 5_000,
        },
      ],
      bundleBreakdown: [
        {
          slotOrGroup: 'cheese',
          label: 'Keju (Cheese)',
          quantity: 3,
          priceDeltaIdr: 0,
          componentVariantId: null,
          isFixed: true,
        },
        {
          slotOrGroup: 'choco',
          label: 'Cokelat (Choco)',
          quantity: 3,
          priceDeltaIdr: 0,
          componentVariantId: null,
          isFixed: true,
        },
        {
          slotOrGroup: 'Pilihan Rasa 1',
          label: 'Pandan',
          quantity: 3,
          priceDeltaIdr: 5_000,
          componentVariantId: null,
          isFixed: false,
        },
        {
          slotOrGroup: 'Pilihan Rasa 2',
          label: 'Earl Grey',
          quantity: 3,
          priceDeltaIdr: 5_000,
          componentVariantId: null,
          isFixed: false,
        },
      ],
    },
  ];

  const warnings: Array<{ code: string; message: string }> = [
    {
      code: CHECKOUT_WARNING_CODES.MANUAL_CONFIRMATION_REQUIRED,
      message: CHECKOUT_COPY.WARNING_MANUAL_CONFIRMATION,
    },
  ];

  let requiresReview = true;
  if (!params.expectedQuoteFingerprint) {
    requiresReview = true;
  } else if (params.expectedQuoteFingerprint === fingerprint) {
    requiresReview = false;
  } else {
    requiresReview = true;
    warnings.push({
      code: CHECKOUT_WARNING_CODES.PRICE_CHANGED,
      message: CHECKOUT_COPY.WARNING_PRICE_CHANGED,
    });
  }

  const messagePreview = composeWhatsAppMessage({
    branchName: params.branch.name,
    lines,
    subtotalIdr,
    discountIdr: 0,
    estimatedTotalIdr,
    customerName: params.customerName,
    fulfillmentMethod: params.method,
    requestedDate: params.requestedDate,
    requestedTimeWindow: params.requestedTimeWindow,
    deliveryAddress: params.address,
    note: params.note,
  });

  const { whatsappUrl, requiresCopy } = buildWhatsAppUrl(
    params.branch.whatsappNumber,
    messagePreview,
  );

  return {
    ok: true,
    data: {
      branch: {
        id: params.branch.id,
        name: params.branch.name,
        whatsappNumber: params.branch.whatsappNumber,
      },
      lines,
      subtotalIdr,
      discountIdr: 0,
      estimatedTotalIdr,
      shippingFee: 'to_be_confirmed' as const,
      warnings,
      quoteFingerprint: fingerprint,
      quotedAt: '2026-11-13T10:00:00.000Z',
      expiresAt: '2026-11-13T10:05:00.000Z',
      requiresReview,
      requiresCopy,
      whatsappUrl,
      messagePreview,
    },
    requestId: 'synthetic-checkout-prepare-req',
  };
}

test.describe('Checkout Quote Review & WhatsApp Handoff E2E (F14 / R14)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept any external wa.me navigation so no real WhatsApp message is ever sent
    await page.route('https://wa.me/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'INTERCEPTED_WA_HANDOFF',
      }),
    );

    // Stub window.open to capture opened WhatsApp URLs without opening real external tabs
    await page.addInitScript(() => {
      (
        window as Window & {
          __openedWhatsappUrls?: string[];
        }
      ).__openedWhatsappUrls = [];
      window.open = (url?: string | URL) => {
        if (url) {
          (
            window as Window & {
              __openedWhatsappUrls?: string[];
            }
          ).__openedWhatsappUrls?.push(String(url));
        }
        return {} as Window;
      };
    });

    await page.route('**/api/branches**', (route) => {
      const url = new URL(route.request().url());
      const code = url.searchParams.get('branch');
      return route.fulfill({
        json: {
          ok: true,
          data: {
            items: syntheticBranches,
            resolvedBranchId:
              syntheticBranches.find((b) => b.code === code)?.id ?? null,
          },
          requestId: 'synthetic-branches-req',
        },
      });
    });

    await page.route('**/api/cart/validate', async (route) => {
      const body = route.request().postDataJSON() as { branchId: string };
      const branch =
        syntheticBranches.find((b) => b.id === body.branchId) ??
        syntheticBranches[0];
      return route.fulfill({
        json: buildCartValidateResponse(branch.id, branch.name),
      });
    });
  });

  test('completes two-step quote review and WhatsApp handoff for Surabaya and Bintaro multi-SKU + bundle, and restores cart but not PII on refresh', async ({
    page,
  }) => {
    let prepareCalls = 0;

    await page.route('**/api/checkout/prepare', async (route) => {
      prepareCalls += 1;
      const body = route.request().postDataJSON() as {
        branchId: string;
        customerName: string;
        fulfillment: {
          method: 'delivery' | 'pickup';
          requestedDate: string;
          requestedTimeWindow?: string | null;
          address?: string | null;
          note?: string | null;
        };
        expectedQuoteFingerprint?: string | null;
      };
      const branch =
        syntheticBranches.find((b) => b.id === body.branchId) ??
        syntheticBranches[0];

      return route.fulfill({
        json: buildPrepareQuoteResponse({
          branch,
          customerName: body.customerName,
          method: body.fulfillment.method,
          requestedDate: body.fulfillment.requestedDate,
          requestedTimeWindow: body.fulfillment.requestedTimeWindow,
          address: body.fulfillment.address,
          note: body.fulfillment.note,
          expectedQuoteFingerprint: body.expectedQuoteFingerprint,
        }),
      });
    });

    // 1. Seed Surabaya cart and open /checkout?branch=surabaya
    await page.goto('/cart?branch=surabaya');
    await page.evaluate(
      (cartJson) => {
        window.localStorage.setItem('rok_guest_cart_v1', cartJson);
      },
      buildPersistedCartState(surabayaId, 'surabaya'),
    );
    await page.goto('/checkout?branch=surabaya');

    await expect(
      page.getByRole('heading', { level: 1, name: CHECKOUT_COPY.PAGE_TITLE }),
    ).toBeVisible();

    // Fill customer details (Surabaya Delivery)
    await page
      .getByLabel(CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL)
      .fill('Ibu Ratna');
    await page
      .getByLabel(CHECKOUT_COPY.FIELD_ADDRESS_LABEL)
      .fill('Jl. Rungkut Asri Timur No. 15, Surabaya');
    await page
      .getByLabel(CHECKOUT_COPY.FIELD_NOTE_LABEL)
      .fill('Kartu ucapan Selamat Ulang Tahun');
    await page.getByLabel(CHECKOUT_COPY.CONSENT_LABEL).check();

    // Verify customer PII is NOT in URL or localStorage
    expect(page.url()).not.toContain('Ratna');
    expect(page.url()).not.toContain('Rungkut');
    const storageDump = await page.evaluate(() =>
      JSON.stringify(window.localStorage),
    );
    expect(storageDump).not.toContain('Ratna');
    expect(storageDump).not.toContain('Rungkut');

    // Step 1: Prepare Quote
    await page
      .getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
      })
      .click();

    await expect(
      page.getByRole('heading', { name: CHECKOUT_COPY.QUOTE_REVIEW_TITLE }),
    ).toBeVisible();
    expect(prepareCalls).toBe(1);

    // Verify WhatsApp has NOT opened on Step 1
    const urlsAfterStep1 = await page.evaluate(
      () =>
        (window as Window & { __openedWhatsappUrls?: string[] })
          .__openedWhatsappUrls ?? [],
    );
    expect(urlsAfterStep1).toHaveLength(0);

    // Step 2: Proceed to WhatsApp
    await page
      .getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PROCEED_WHATSAPP, 'i'),
      })
      .click();

    await expect(
      page.getByText(CHECKOUT_COPY.HANDOFF_READY_TITLE),
    ).toBeVisible();
    expect(prepareCalls).toBe(2);

    const urlsAfterStep2 = await page.evaluate(
      () =>
        (window as Window & { __openedWhatsappUrls?: string[] })
          .__openedWhatsappUrls ?? [],
    );
    expect(urlsAfterStep2).toHaveLength(1);
    const surabayaWaUrl = new URL(urlsAfterStep2[0]);
    expect(surabayaWaUrl.origin + surabayaWaUrl.pathname).toBe(
      'https://wa.me/6281703384308',
    );
    const decodedSurabayaText = surabayaWaUrl.searchParams.get('text') ?? '';
    expect(decodedSurabayaText).toContain('*CABANG:* Surabaya');
    expect(decodedSurabayaText).toContain('DEMO — Coffee Chiffon — Mini 14cm');
    expect(decodedSurabayaText).toContain(
      'DEMO — Paket Chiffon Slice Mix — 12 Potong',
    );
    expect(decodedSurabayaText).toContain('• Pandan (3 potong) (+Rp5.000)');
    expect(decodedSurabayaText).toContain('• Earl Grey (3 potong) (+Rp5.000)');
    expect(decodedSurabayaText).toContain('*ESTIMASI TOTAL: Rp300.000*');
    expect(decodedSurabayaText).toContain('*PEMESAN:* Ibu Ratna');
    expect(decodedSurabayaText).toContain(
      '*ALAMAT:* Jl. Rungkut Asri Timur No. 15, Surabaya',
    );

    // Verify cart is NOT cleared after handoff
    await expect(page.locator('.cart-badge')).toContainText('3');

    // Verify refresh restores cart items from localStorage while clearing transient PII
    await page.reload();
    await expect(
      page.getByLabel(CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL),
    ).toHaveValue('');
    await expect(page.locator('.cart-badge')).toContainText('3');

    // 2. Test Bintaro branch flow (6285119785194)
    await page.evaluate(
      (cartJson) => {
        window.localStorage.setItem('rok_guest_cart_v1', cartJson);
      },
      buildPersistedCartState(bintaroId, 'bintaro'),
    );
    await page.goto('/checkout?branch=bintaro');

    await page
      .getByLabel(CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL)
      .fill('Bapak Hendra');
    await page
      .getByLabel(CHECKOUT_COPY.FIELD_METHOD_LABEL)
      .selectOption('pickup');
    await page.getByLabel(CHECKOUT_COPY.CONSENT_LABEL).check();

    await page
      .getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
      })
      .click();
    await expect(
      page.getByRole('heading', { name: CHECKOUT_COPY.QUOTE_REVIEW_TITLE }),
    ).toBeVisible();

    await page
      .getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PROCEED_WHATSAPP, 'i'),
      })
      .click();

    const bintaroUrls = await page.evaluate(
      () =>
        (window as Window & { __openedWhatsappUrls?: string[] })
          .__openedWhatsappUrls ?? [],
    );
    expect(bintaroUrls).toHaveLength(1);
    const bintaroWaUrl = new URL(bintaroUrls[0]);
    expect(bintaroWaUrl.origin + bintaroWaUrl.pathname).toBe(
      'https://wa.me/6285119785194',
    );
    const decodedBintaroText = bintaroWaUrl.searchParams.get('text') ?? '';
    expect(decodedBintaroText).toContain('*CABANG:* Bintaro');
    expect(decodedBintaroText).toContain('*PEMESAN:* Bapak Hendra');
    expect(decodedBintaroText).toContain('*METODE:* Pickup');

    // Accessibility check
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test('handles delivery address error, price change between review and continue, 409 stock changed, clipboard failure fallback, and mobile 390px viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    let stepCount = 0;
    await page.route('**/api/checkout/prepare', async (route) => {
      stepCount += 1;
      const body = route.request().postDataJSON() as {
        branchId: string;
        customerName: string;
        fulfillment: {
          method: 'delivery' | 'pickup';
          requestedDate: string;
        };
        expectedQuoteFingerprint?: string | null;
      };

      // Step 1: initial quote at Rp70.000/unit
      if (stepCount === 1) {
        return route.fulfill({
          json: buildPrepareQuoteResponse({
            branch: syntheticBranches[0],
            customerName: body.customerName,
            method: body.fulfillment.method,
            requestedDate:
              body.fulfillment.requestedDate || formatJakartaDateIso(),
            expectedQuoteFingerprint: null,
            overrideFingerprint: 'a'.repeat(64),
            overrideCoffeeUnitIdr: 70_000,
          }),
        });
      }

      // Step 2: simulate server price change (coffee becomes Rp75.000/unit, fingerprint 'b'x64 != expected 'a'x64)
      if (stepCount === 2) {
        return route.fulfill({
          json: buildPrepareQuoteResponse({
            branch: syntheticBranches[0],
            customerName: body.customerName,
            method: body.fulfillment.method,
            requestedDate:
              body.fulfillment.requestedDate || formatJakartaDateIso(),
            expectedQuoteFingerprint: body.expectedQuoteFingerprint,
            overrideFingerprint: 'b'.repeat(64),
            overrideCoffeeUnitIdr: 75_000,
          }),
        });
      }

      // Step 3: simulate 409 STOCK_CHANGED
      return route.fulfill({
        status: 409,
        json: {
          ok: false,
          error: {
            code: 'STOCK_CHANGED',
            message: CHECKOUT_COPY.ERROR_ITEM_SOLDOUT,
          },
          requestId: 'req-409',
        },
      });
    });

    await page.goto('/cart?branch=surabaya');
    await page.evaluate(
      (cartJson) => {
        window.localStorage.setItem('rok_guest_cart_v1', cartJson);
      },
      buildPersistedCartState(surabayaId, 'surabaya'),
    );
    await page.goto('/checkout?branch=surabaya');

    // 1. Submit Delivery without address -> inline + summary validation error
    await page
      .getByLabel(CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL)
      .fill('Siti Aminah');
    await page.getByLabel(CHECKOUT_COPY.CONSENT_LABEL).check();
    await page
      .getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
      })
      .click();

    await expect(
      page.getByText(CHECKOUT_COPY.ERROR_DELIVERY_ADDRESS_REQUIRED).first(),
    ).toBeVisible();

    // Switch to pickup and prepare quote (Step 1)
    await page
      .getByLabel(CHECKOUT_COPY.FIELD_METHOD_LABEL)
      .selectOption('pickup');
    await page
      .getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
      })
      .click();

    await expect(
      page.getByRole('heading', { name: CHECKOUT_COPY.QUOTE_REVIEW_TITLE }),
    ).toBeVisible();

    // 2. Proceed when price changed on server -> shows PRICE_CHANGED warning & does NOT open WhatsApp
    await page
      .getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PROCEED_WHATSAPP, 'i'),
      })
      .click();

    await expect(
      page.getByText(CHECKOUT_COPY.WARNING_PRICE_CHANGED),
    ).toBeVisible();
    const openedUrls = await page.evaluate(
      () =>
        (window as Window & { __openedWhatsappUrls?: string[] })
          .__openedWhatsappUrls ?? [],
    );
    expect(openedUrls).toHaveLength(0);

    // 3. Force clipboard failure and click Copy -> shows manual copy fallback & selects textarea
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: () => Promise.reject(new Error('Clipboard blocked')),
        },
        configurable: true,
      });
    });

    await page
      .getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_COPY_MESSAGE, 'i'),
      })
      .click();

    await expect(
      page.getByText(CHECKOUT_COPY.COPY_FALLBACK_NOTE),
    ).toBeVisible();

    // 4. Proceed again when server returns 409 STOCK_CHANGED -> error displayed, cart NOT cleared
    await page
      .getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PROCEED_WHATSAPP, 'i'),
      })
      .click();

    await expect(
      page.getByText(CHECKOUT_COPY.ERROR_ITEM_SOLDOUT),
    ).toBeVisible();
    await expect(page.locator('.cart-badge')).toContainText('3');
  });
});
