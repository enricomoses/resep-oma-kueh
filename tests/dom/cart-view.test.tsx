import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartView } from '@/app/(site)/cart/_components/cart-view';
import { CART_CONFLICTS, CART_COPY } from '@/constants/cart.constant';
import { ReactQueryProvider } from '@/providers';
import { BranchProvider } from '@/providers/branch-provider';
import type { CartValidatedLine } from '@/types/cart';

const navigation = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/cart',
  useSearchParams: () => new URLSearchParams('branch=surabaya'),
  useRouter: () => navigation,
}));

// Mock useCart hook for fine-grained DOM view testing
const mockUseCart = vi.fn();
vi.mock('@/hooks/use-cart', () => ({
  useCart: () => mockUseCart(),
}));

const mockBranch = {
  id: '11111111-1111-4111-8111-111111111111',
  code: 'surabaya',
  name: 'Surabaya',
  city: 'Surabaya',
  whatsappNumber: '6281703384308',
  address: 'Jl. Rungkut Mapan',
  mapsUrl: null,
};

function renderWithProviders(ui: ReactNode) {
  return render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [mockBranch], resolvedBranchId: mockBranch.id },
        }}
      >
        {ui}
      </BranchProvider>
    </ReactQueryProvider>,
  );
}

const sampleLine: CartValidatedLine = {
  lineId: 'line-1',
  variantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  productId: '11111111-2222-3333-4444-555555555555',
  productName: 'Chiffon Pandan Asli',
  productSlug: 'chiffon-pandan-asli',
  productType: 'variants',
  variantName: 'Chiffon Pandan Medium 18cm',
  sku: 'PANDAN-MED-18',
  sizeLabel: 'Medium 18cm',
  imageAlt: 'Chiffon Pandan Asli',
  quantity: 2,
  unitGrossIdr: 85_000,
  unconditionalDiscountIdr: 5_000,
  effectiveUnitPriceIdr: 80_000,
  subtotalIdr: 160_000,
  availabilityStatus: 'available',
  conflict: CART_CONFLICTS.NONE,
  conflictMessage: null,
  bundleBreakdown: [],
  choiceNames: [],
};

describe('CartView DOM Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders loading restore state when store has not hydrated', () => {
    mockUseCart.mockReturnValue({
      hasHydrated: false,
      lines: [{ id: '1' }],
      totalQuantity: 1,
      validatedLines: [],
      isValidating: true,
      isValidationError: false,
    });

    renderWithProviders(<CartView />);
    expect(screen.getByText(CART_COPY.LOADING_RESTORE)).toBeInTheDocument();
  });

  it('renders empty cart state when cart has no lines', () => {
    mockUseCart.mockReturnValue({
      hasHydrated: true,
      lines: [],
      totalQuantity: 0,
      validatedLines: [],
      isValidating: false,
      isValidationError: false,
    });

    renderWithProviders(<CartView />);
    expect(screen.getByText(CART_COPY.EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(CART_COPY.EMPTY_BODY)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: new RegExp(CART_COPY.CTA_BROWSE_MENU) }),
    ).toBeInTheDocument();
  });

  it('renders error state with retry button when validation fails', () => {
    const mockRefetch = vi.fn();
    mockUseCart.mockReturnValue({
      hasHydrated: true,
      lines: [{ id: '1' }],
      totalQuantity: 1,
      validatedLines: [],
      isValidating: false,
      isValidationError: true,
      refetchValidation: mockRefetch,
    });

    renderWithProviders(<CartView />);
    expect(screen.getByText(CART_COPY.ERROR_REVALIDATE)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', {
      name: new RegExp(CART_COPY.RETRY),
    });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders populated cart items, prices, and summary', () => {
    const mockUpdateQty = vi.fn();
    const mockRemove = vi.fn();
    const mockClear = vi.fn();

    mockUseCart.mockReturnValue({
      hasHydrated: true,
      lines: [{ id: 'line-1', quantity: 2 }],
      totalQuantity: 2,
      updateQuantity: mockUpdateQty,
      removeLine: mockRemove,
      clearCart: mockClear,
      isValidating: false,
      isValidationError: false,
      validatedLines: [sampleLine],
      estimatedSubtotalIdr: 170_000,
      totalDiscountIdr: 10_000,
      estimatedTotalIdr: 160_000,
      hasBlockingConflicts: false,
    });

    renderWithProviders(<CartView />);

    expect(
      screen.getByRole('link', { name: 'Chiffon Pandan Asli' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Medium 18cm')).toBeInTheDocument();
    expect(screen.getByText('Rp80.000')).toBeInTheDocument();
    expect(screen.getAllByText('Rp160.000')).toHaveLength(2);

    // Summary calculations
    expect(screen.getByText('Rp170.000')).toBeInTheDocument();
    expect(screen.getByText('-Rp10.000')).toBeInTheDocument();

    // Remove action
    const removeBtn = screen.getByRole('button', {
      name: /Hapus Chiffon Pandan Asli dari keranjang/i,
    });
    fireEvent.click(removeBtn);
    expect(mockRemove).toHaveBeenCalledWith('line-1');
  });

  it('displays conflict badge and disables checkout when item is sold out', () => {
    const soldOutLine: CartValidatedLine = {
      ...sampleLine,
      lineId: 'line-sold-out',
      conflict: CART_CONFLICTS.SOLD_OUT,
      conflictMessage: CART_COPY.CONFLICT_SOLD_OUT,
    };

    mockUseCart.mockReturnValue({
      hasHydrated: true,
      lines: [{ id: 'line-sold-out', quantity: 1 }],
      totalQuantity: 1,
      updateQuantity: vi.fn(),
      removeLine: vi.fn(),
      clearCart: vi.fn(),
      isValidating: false,
      isValidationError: false,
      validatedLines: [soldOutLine],
      estimatedSubtotalIdr: 80_000,
      totalDiscountIdr: 0,
      estimatedTotalIdr: 80_000,
      hasBlockingConflicts: true,
    });

    renderWithProviders(<CartView />);

    expect(screen.getByText(CART_COPY.CONFLICT_SOLD_OUT)).toBeInTheDocument();

    const checkoutBtn = screen.getByRole('button', {
      name: new RegExp(CART_COPY.CTA_CHECKOUT_DISABLED_CONFLICTS),
    });
    expect(checkoutBtn).toBeDisabled();
  });

  it('renders bundle composition breakdown when line has bundleBreakdown', () => {
    const bundleLine: CartValidatedLine = {
      ...sampleLine,
      lineId: 'line-bundle',
      productName: 'Chiffon Hampers 12 Slices',
      productType: 'bundle',
      bundleBreakdown: [
        {
          slotOrGroup: 'Fixed Slot 1',
          label: 'Keju Spesial',
          quantity: 3,
          priceDeltaIdr: 0,
          componentVariantId: '11111111-1111-1111-1111-111111111111',
          isFixed: true,
        },
        {
          slotOrGroup: 'Pilihan Rasa A',
          label: 'Pandan Wangi',
          quantity: 3,
          priceDeltaIdr: 0,
          componentVariantId: '22222222-2222-2222-2222-222222222222',
          isFixed: false,
        },
      ],
    };

    mockUseCart.mockReturnValue({
      hasHydrated: true,
      lines: [{ id: 'line-bundle', quantity: 1 }],
      totalQuantity: 1,
      updateQuantity: vi.fn(),
      removeLine: vi.fn(),
      clearCart: vi.fn(),
      isValidating: false,
      isValidationError: false,
      validatedLines: [bundleLine],
      estimatedSubtotalIdr: 120_000,
      totalDiscountIdr: 0,
      estimatedTotalIdr: 120_000,
      hasBlockingConflicts: false,
    });

    renderWithProviders(<CartView />);

    expect(screen.getByText(/Keju Spesial \(3 potong\)/)).toBeInTheDocument();
    expect(screen.getByText(/Pandan Wangi \(3 potong\)/)).toBeInTheDocument();
  });
});
