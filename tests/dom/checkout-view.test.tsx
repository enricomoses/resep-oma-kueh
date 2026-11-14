import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutView } from '@/app/(site)/checkout/_components/checkout-view';
import { CART_CONFLICTS } from '@/constants/cart.constant';
import {
  CHECKOUT_COPY,
  CHECKOUT_WARNING_CODES,
} from '@/constants/checkout.constant';
import { ApiClientError } from '@/lib/errors';
import { ReactQueryProvider } from '@/providers';
import { BranchProvider } from '@/providers/branch-provider';
import * as branchesService from '@/services/branches.service';
import type { PublicBranch } from '@/types/branch';
import type { CartValidatedLine } from '@/types/cart';
import type { CheckoutPrepareResponse } from '@/types/checkout';

const navigation = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/checkout',
  useSearchParams: () => new URLSearchParams('branch=surabaya'),
  useRouter: () => navigation,
}));

const mockUseCart = vi.fn();
vi.mock('@/hooks/use-cart', () => ({
  useCart: () => mockUseCart(),
}));

const mockMutateAsync = vi.fn();
const mockUseCheckoutPrepare = vi.fn();
vi.mock('@/hooks/use-checkout', () => ({
  useCheckoutPrepare: () => mockUseCheckoutPrepare(),
}));

const surabayaBranch: PublicBranch = {
  id: 'f0400000-0000-4000-8000-000000000001',
  code: 'surabaya',
  name: 'Surabaya',
  city: 'Surabaya',
  whatsappNumber: '6281703384308',
  address: 'Rungkut Asri Tengah V No. 22, Surabaya',
  mapsUrl: null,
};

function renderWithProviders(
  ui: ReactNode,
  branch: PublicBranch = surabayaBranch,
) {
  vi.spyOn(branchesService, 'readBranches').mockResolvedValue({
    ok: true,
    data: { items: [branch], resolvedBranchId: branch.id },
    requestId: 'branch-test-req',
  });
  return render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [branch], resolvedBranchId: branch.id },
        }}
      >
        {ui}
      </BranchProvider>
    </ReactQueryProvider>,
  );
}

const sampleValidatedLine: CartValidatedLine = {
  lineId:
    'f0400000-0000-4000-8000-000000000001:f0400000-0000-4000-8000-000000000601:',
  variantId: 'f0400000-0000-4000-8000-000000000601',
  productId: 'f0400000-0000-4000-8000-000000000400',
  productName: 'Coffee Chiffon',
  productSlug: 'demo-coffee',
  productType: 'variants',
  variantName: 'Coffee Chiffon Mini 14cm',
  sku: 'DEMO-COFFEE-MINI',
  sizeLabel: 'Mini 14cm',
  imageAlt: 'Coffee Chiffon',
  quantity: 2,
  unitGrossIdr: 70_000,
  unconditionalDiscountIdr: 0,
  effectiveUnitPriceIdr: 70_000,
  subtotalIdr: 140_000,
  availabilityStatus: 'available',
  conflict: CART_CONFLICTS.NONE,
  conflictMessage: null,
  bundleBreakdown: [],
  choiceNames: [],
};

const sampleQuoteFingerprint = 'a'.repeat(64);

const makeSampleQuote = (
  overrides: Partial<CheckoutPrepareResponse> = {},
): CheckoutPrepareResponse => ({
  branch: {
    id: surabayaBranch.id,
    name: surabayaBranch.name,
    whatsappNumber: surabayaBranch.whatsappNumber,
  },
  lines: [
    {
      variantId: sampleValidatedLine.variantId,
      productName: 'Coffee Chiffon',
      variantName: 'Coffee Chiffon Mini 14cm',
      sku: 'DEMO-COFFEE-MINI',
      sizeLabel: 'Mini 14cm',
      quantity: 2,
      unitGrossIdr: 70_000,
      unitPriceIdr: 70_000,
      discountIdr: 0,
      lineTotalIdr: 140_000,
      options: [],
    },
  ],
  subtotalIdr: 140_000,
  discountIdr: 0,
  estimatedTotalIdr: 140_000,
  shippingFee: 'to_be_confirmed',
  warnings: [
    {
      code: CHECKOUT_WARNING_CODES.MANUAL_CONFIRMATION_REQUIRED,
      message: CHECKOUT_COPY.WARNING_MANUAL_CONFIRMATION,
    },
  ],
  quoteFingerprint: sampleQuoteFingerprint,
  quotedAt: '2026-11-13T10:00:00.000Z',
  expiresAt: '2026-11-13T10:05:00.000Z',
  requiresReview: true,
  requiresCopy: false,
  whatsappUrl:
    'https://wa.me/6281703384308?text=Halo%20Resep%20Oma%20Kueh!%20Coffee%20Chiffon',
  messagePreview:
    'Halo Resep Oma Kueh! 👋\n\n*CABANG:* Surabaya\n1. Coffee Chiffon — Mini 14cm\n   2 × Rp70.000 = Rp140.000\n*ESTIMASI TOTAL: Rp140.000*',
  ...overrides,
});

describe('CheckoutView DOM Tests (F14 / R14)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCheckoutPrepare.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    mockUseCart.mockReturnValue({
      hasHydrated: true,
      lines: [
        {
          id: sampleValidatedLine.lineId,
          variantId: sampleValidatedLine.variantId,
          choiceIds: [],
          quantity: 2,
        },
      ],
      totalQuantity: 2,
      isValidating: false,
      isValidationError: false,
      validatedLines: [sampleValidatedLine],
      estimatedSubtotalIdr: 140_000,
      totalDiscountIdr: 0,
      estimatedTotalIdr: 140_000,
      hasBlockingConflicts: false,
      refetchValidation: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('validates required customerName, delivery address, and manual confirmation consent', async () => {
    renderWithProviders(<CheckoutView />);

    const submitBtn = await screen.findByRole('button', {
      name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
    });
    await waitFor(() => expect(submitBtn).toBeEnabled());
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getAllByText(CHECKOUT_COPY.ERROR_CUSTOMER_NAME_REQUIRED).length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.getAllByText(CHECKOUT_COPY.ERROR_DELIVERY_ADDRESS_REQUIRED).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(CHECKOUT_COPY.ERROR_MANUAL_CONFIRMATION_REQUIRED)
        .length,
    ).toBeGreaterThan(0);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('executes two-step review and opens WhatsApp only when requiresReview is false, resetting acceptance on input edit', async () => {
    const openSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => ({}) as Window);

    // First call: expectedQuoteFingerprint = null -> returns requiresReview = true
    mockMutateAsync.mockResolvedValueOnce({
      ok: true,
      data: makeSampleQuote({ requiresReview: true }),
      requestId: 'req-1',
    });

    renderWithProviders(<CheckoutView />);

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
    });
    await waitFor(() => expect(submitBtn).toBeEnabled());

    fireEvent.change(
      screen.getByLabelText(
        new RegExp(CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL, 'i'),
      ),
      { target: { value: 'Ibu Ratna' } },
    );
    fireEvent.change(
      screen.getByLabelText(new RegExp(CHECKOUT_COPY.FIELD_ADDRESS_LABEL, 'i')),
      { target: { value: 'Jl. Rungkut Asri Tengah No. 22, Surabaya' } },
    );
    fireEvent.click(
      screen.getByLabelText(new RegExp(CHECKOUT_COPY.CONSENT_LABEL, 'i')),
    );

    fireEvent.click(submitBtn);

    // Quote review card appears, WhatsApp NOT opened yet
    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: CHECKOUT_COPY.QUOTE_REVIEW_TITLE,
        }),
      ).toBeInTheDocument();
    });
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({
        expectedQuoteFingerprint: null,
        customerName: 'Ibu Ratna',
      }),
    );
    expect(openSpy).not.toHaveBeenCalled();

    // Second call: user clicks Proceed to WhatsApp -> sends expectedQuoteFingerprint -> returns requiresReview: false
    const finalQuote = makeSampleQuote({ requiresReview: false });
    mockMutateAsync.mockResolvedValueOnce({
      ok: true,
      data: finalQuote,
      requestId: 'req-2',
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PROCEED_WHATSAPP, 'i'),
      }),
    );

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        finalQuote.whatsappUrl,
        '_blank',
        'noopener,noreferrer',
      );
    });
    expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    expect(mockMutateAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({
        expectedQuoteFingerprint: sampleQuoteFingerprint,
      }),
    );

    // Editing customerName resets quote acceptance
    fireEvent.change(
      screen.getByLabelText(
        new RegExp(CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL, 'i'),
      ),
      { target: { value: 'Ibu Ratna Sari' } },
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', {
          name: CHECKOUT_COPY.QUOTE_REVIEW_TITLE,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('does not open WhatsApp when price changes between review and proceed (requiresReview=true + PRICE_CHANGED)', async () => {
    const openSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => ({}) as Window);

    mockMutateAsync.mockResolvedValueOnce({
      ok: true,
      data: makeSampleQuote({ requiresReview: true }),
      requestId: 'req-1',
    });

    renderWithProviders(<CheckoutView />);

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
    });
    await waitFor(() => expect(submitBtn).toBeEnabled());

    fireEvent.change(
      screen.getByLabelText(
        new RegExp(CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL, 'i'),
      ),
      { target: { value: 'Budi Santoso' } },
    );
    fireEvent.change(
      screen.getByLabelText(new RegExp(CHECKOUT_COPY.FIELD_METHOD_LABEL, 'i')),
      { target: { value: 'pickup' } },
    );
    fireEvent.click(
      screen.getByLabelText(new RegExp(CHECKOUT_COPY.CONSENT_LABEL, 'i')),
    );

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: CHECKOUT_COPY.QUOTE_REVIEW_TITLE,
        }),
      ).toBeInTheDocument();
    });

    // Simulate price change on second call
    const newFingerprint = 'b'.repeat(64);
    mockMutateAsync.mockResolvedValueOnce({
      ok: true,
      data: makeSampleQuote({
        quoteFingerprint: newFingerprint,
        subtotalIdr: 150_000,
        estimatedTotalIdr: 150_000,
        requiresReview: true,
        warnings: [
          {
            code: CHECKOUT_WARNING_CODES.MANUAL_CONFIRMATION_REQUIRED,
            message: CHECKOUT_COPY.WARNING_MANUAL_CONFIRMATION,
          },
          {
            code: CHECKOUT_WARNING_CODES.PRICE_CHANGED,
            message: CHECKOUT_COPY.WARNING_PRICE_CHANGED,
          },
        ],
      }),
      requestId: 'req-price-changed',
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PROCEED_WHATSAPP, 'i'),
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(CHECKOUT_COPY.WARNING_PRICE_CHANGED),
      ).toBeInTheDocument();
    });
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('handles 409 STOCK_CHANGED error without clearing cart', async () => {
    const refetchValidation = vi.fn();
    mockUseCart.mockReturnValue({
      hasHydrated: true,
      lines: [
        {
          id: sampleValidatedLine.lineId,
          variantId: sampleValidatedLine.variantId,
          choiceIds: [],
          quantity: 2,
        },
      ],
      totalQuantity: 2,
      isValidating: false,
      isValidationError: false,
      validatedLines: [sampleValidatedLine],
      estimatedSubtotalIdr: 140_000,
      totalDiscountIdr: 0,
      estimatedTotalIdr: 140_000,
      hasBlockingConflicts: false,
      refetchValidation,
    });

    mockMutateAsync.mockRejectedValueOnce(
      new ApiClientError({
        code: 'STOCK_CHANGED',
        status: 409,
        message: CHECKOUT_COPY.ERROR_ITEM_SOLDOUT,
      }),
    );

    renderWithProviders(<CheckoutView />);

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
    });
    await waitFor(() => expect(submitBtn).toBeEnabled());

    fireEvent.change(
      screen.getByLabelText(
        new RegExp(CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL, 'i'),
      ),
      { target: { value: 'Siti Aminah' } },
    );
    fireEvent.change(
      screen.getByLabelText(new RegExp(CHECKOUT_COPY.FIELD_METHOD_LABEL, 'i')),
      { target: { value: 'pickup' } },
    );
    fireEvent.click(
      screen.getByLabelText(new RegExp(CHECKOUT_COPY.CONSENT_LABEL, 'i')),
    );

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(CHECKOUT_COPY.ERROR_ITEM_SOLDOUT),
      ).toBeInTheDocument();
    });
    expect(refetchValidation).toHaveBeenCalledTimes(1);
    // Sidebar item still present
    expect(screen.getByText(/Coffee Chiffon/)).toBeInTheDocument();
  });

  it('falls back to selecting read-only preview textarea when clipboard writeText fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
      configurable: true,
    });

    mockMutateAsync.mockResolvedValueOnce({
      ok: true,
      data: makeSampleQuote({ requiresReview: true }),
      requestId: 'req-copy-fail',
    });

    renderWithProviders(<CheckoutView />);

    const submitBtn = screen.getByRole('button', {
      name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
    });
    await waitFor(() => expect(submitBtn).toBeEnabled());

    fireEvent.change(
      screen.getByLabelText(
        new RegExp(CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL, 'i'),
      ),
      { target: { value: 'Ibu Ratna' } },
    );
    fireEvent.change(
      screen.getByLabelText(new RegExp(CHECKOUT_COPY.FIELD_METHOD_LABEL, 'i')),
      { target: { value: 'pickup' } },
    );
    fireEvent.click(
      screen.getByLabelText(new RegExp(CHECKOUT_COPY.CONSENT_LABEL, 'i')),
    );

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: new RegExp(CHECKOUT_COPY.CTA_COPY_MESSAGE, 'i'),
        }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_COPY_MESSAGE, 'i'),
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(CHECKOUT_COPY.COPY_FALLBACK_NOTE),
      ).toBeInTheDocument();
    });
  });

  it('renders WhatsApp consultation card instead of checkout form when branch fulfillment is disabled', async () => {
    const disabledBranch: PublicBranch = {
      ...surabayaBranch,
      allowPickup: false,
      allowDelivery: false,
    };

    renderWithProviders(<CheckoutView />, disabledBranch);

    await waitFor(() => {
      expect(
        screen.getByText(CHECKOUT_COPY.FULFILLMENT_DISABLED_TITLE),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', {
        name: new RegExp(CHECKOUT_COPY.CTA_CONSULT_WHATSAPP, 'i'),
      }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/6281703384308'),
    );
    expect(
      screen.queryByRole('button', {
        name: new RegExp(CHECKOUT_COPY.CTA_PREPARE_QUOTE, 'i'),
      }),
    ).not.toBeInTheDocument();
  });
});
