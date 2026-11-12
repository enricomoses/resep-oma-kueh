import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProductDetailView } from '@/components/catalog/product-detail-view';
import { PRODUCT_DETAIL_COPY } from '@/constants/catalog.constant';
import { ApiClientError } from '@/lib/errors';
import { ReactQueryProvider } from '@/providers';
import { BranchProvider } from '@/providers/branch-provider';
import * as branchesService from '@/services/branches.service';
import * as catalogService from '@/services/catalog.service';
import type { PublicBranch } from '@/types/branch';
import type { ProductDetail } from '@/types/catalog';

const navigation = vi.hoisted(() => ({
  search: '',
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/menu/demo-coffee',
  useSearchParams: () => new URLSearchParams(navigation.search),
  useRouter: () => navigation,
}));

const SURABAYA: PublicBranch = {
  id: 'f0400000-0000-4000-8000-000000000001',
  code: 'surabaya',
  name: 'Surabaya',
  city: 'Surabaya',
  whatsappNumber: '6281703384308',
  address: 'Rungkut Asri Tengah V No. 22, Surabaya',
  mapsUrl: null,
};

const BINTARO: PublicBranch = {
  id: 'f0400000-0000-4000-8000-000000000002',
  code: 'bintaro',
  name: 'Bintaro',
  city: 'Bintaro',
  whatsappNumber: '6285119785194',
  address: null,
  mapsUrl: null,
};

function buildDetail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 'f0400000-0000-4000-8000-000000000400',
    name: 'DEMO — Coffee Chiffon',
    slug: 'demo-coffee',
    shortDescription: 'Chiffon klasik rasa kopi.',
    description: 'Deskripsi lengkap sintetis.',
    ingredientsInfo: 'Tepung beras, telur, kopi, gula.',
    storageInstructions: 'Kulkas 3 hari.',
    productType: 'variants',
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    primaryCategory: {
      id: 'f0400000-0000-4000-8000-000000000200',
      name: 'DEMO — Chiffon Series',
      slug: 'demo-chiffon-series',
    },
    categories: [
      {
        id: 'f0400000-0000-4000-8000-000000000200',
        name: 'DEMO — Chiffon Series',
        slug: 'demo-chiffon-series',
        isPrimary: true,
      },
    ],
    images: [
      {
        id: 'f0400000-0000-4000-8000-000000000500',
        variantId: null,
        altText: 'Foto utama Coffee Chiffon',
        isPrimary: true,
        sortOrder: 0,
        publicUrl: null,
      },
      {
        id: 'f0400000-0000-4000-8000-000000000501',
        variantId: 'f0400000-0000-4000-8000-000000000600',
        altText: 'Foto Slice',
        isPrimary: false,
        sortOrder: 1,
        publicUrl: null,
      },
    ],
    resolvedBranchId: SURABAYA.id,
    resolvedBranchCode: 'surabaya',
    activeVariantCount: 2,
    offeredVariants: [
      {
        id: 'f0400000-0000-4000-8000-000000000600',
        sku: 'DEMO-COFFEE-SLICE',
        name: 'Coffee Chiffon Slice',
        sizeLabel: 'Slice',
        isDefault: true,
        sortOrder: 0,
        maxQuantityPerOrder: 20,
        bundleRecipe: null,
        bundleUnitsTotal: null,
        bundleRulesVerified: false,
        availabilityStatus: 'sold_out',
        stockQuantity: 0,
        baseOrOverrideIdr: 15_000,
        minOptionDeltaIdr: 0,
        unitGrossIdr: 15_000,
        unconditionalDiscountIdr: 0,
        effectivePriceIdr: 15_000,
        appliedPromotion: null,
        conditionalPromotion: null,
        verifiedDietaryTags: [{ slug: 'gluten-free', name: 'Gluten-Free' }],
        verifiedAllergens: [
          { slug: 'egg', name: 'Telur', presence: 'contains' },
        ],
        optionGroups: [],
        fixedComponents: [],
      },
      {
        id: 'f0400000-0000-4000-8000-000000000601',
        sku: 'DEMO-COFFEE-MINI',
        name: 'Coffee Chiffon Mini 14cm',
        sizeLabel: 'Mini 14cm',
        isDefault: false,
        sortOrder: 1,
        maxQuantityPerOrder: 10,
        bundleRecipe: null,
        bundleUnitsTotal: null,
        bundleRulesVerified: false,
        availabilityStatus: 'available',
        stockQuantity: 5,
        baseOrOverrideIdr: 70_000,
        minOptionDeltaIdr: 0,
        unitGrossIdr: 70_000,
        unconditionalDiscountIdr: 0,
        effectivePriceIdr: 70_000,
        appliedPromotion: null,
        conditionalPromotion: null,
        verifiedDietaryTags: [],
        verifiedAllergens: [],
        optionGroups: [],
        fixedComponents: [],
      },
    ],
    relatedProducts: [],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  navigation.search = '';
  vi.restoreAllMocks();
});

it('renders browse mode without branch: shows branch notice and disables CTA', () => {
  const detailWithoutBranch = buildDetail({
    resolvedBranchId: null,
    resolvedBranchCode: null,
    offeredVariants: [],
  });

  render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: null },
        }}
      >
        <ProductDetailView
          slug="demo-coffee"
          initial={{ status: 'success', data: detailWithoutBranch }}
        />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  expect(
    screen.getByText(PRODUCT_DETAIL_COPY.VARIANT_BRANCH_REQUIRED_TITLE),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', {
      name: PRODUCT_DETAIL_COPY.CTA_BRANCH_REQUIRED,
    }),
  ).toBeDisabled();
});

it('renders variant picker with multiple sizes, updates pricing & food info, and prepares cart line payload', () => {
  navigation.search = 'branch=surabaya';
  vi.spyOn(branchesService, 'readBranches').mockResolvedValue({
    ok: true,
    data: { items: [SURABAYA, BINTARO], resolvedBranchId: SURABAYA.id },
    requestId: 'req-branch',
  });

  const product = buildDetail();

  render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: SURABAYA.id },
        }}
      >
        <ProductDetailView
          slug="demo-coffee"
          initial={{ status: 'success', data: product }}
        />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  // Default is Slice (sold_out)
  expect(
    screen.getByRole('button', { name: PRODUCT_DETAIL_COPY.CTA_SOLD_OUT }),
  ).toBeDisabled();
  expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
  expect(screen.getByText('Telur')).toBeInTheDocument();

  // Switch to Mini 14cm (available)
  const miniButton = screen.getByRole('radio', { name: /Mini 14cm/ });
  fireEvent.click(miniButton);

  expect(screen.getAllByText('Rp70.000').length).toBeGreaterThanOrEqual(1);
  const prepareButton = screen.getByRole('button', {
    name: PRODUCT_DETAIL_COPY.CTA_PREPARE_CART,
  });
  expect(prepareButton).toBeEnabled();

  // Increase quantity to 2
  const plusBtn = screen.getByRole('button', {
    name: /Tambah Jumlah pesanan/,
  });
  fireEvent.click(plusBtn);
  expect(screen.getByText('Rp140.000')).toBeInTheDocument();

  // Click CTA to prepare payload for F12
  fireEvent.click(prepareButton);

  expect(
    screen.getByText(PRODUCT_DETAIL_COPY.CTA_PREPARED_TITLE),
  ).toBeInTheDocument();
  expect(screen.getByText(/DEMO-COFFEE-MINI/)).toBeInTheDocument();
  expect(screen.getByText(/2 unit/)).toBeInTheDocument();
});

it('renders single SKU note for products with only one variant', () => {
  navigation.search = 'branch=surabaya';
  const singleSkuProduct = buildDetail({
    name: 'DEMO — Roti Isi Cheese',
    slug: 'demo-bread-cheese',
    productType: 'simple',
    activeVariantCount: 1,
    offeredVariants: [
      {
        id: 'f0400000-0000-4000-8000-000000000620',
        sku: 'DEMO-BREAD-CHEESE',
        name: 'Roti Isi Cheese Piece',
        sizeLabel: 'Piece',
        isDefault: true,
        sortOrder: 0,
        maxQuantityPerOrder: 30,
        bundleRecipe: null,
        bundleUnitsTotal: null,
        bundleRulesVerified: false,
        availabilityStatus: 'available',
        stockQuantity: 10,
        baseOrOverrideIdr: 10_000,
        minOptionDeltaIdr: 0,
        unitGrossIdr: 10_000,
        unconditionalDiscountIdr: 0,
        effectivePriceIdr: 10_000,
        appliedPromotion: null,
        conditionalPromotion: null,
        verifiedDietaryTags: [],
        verifiedAllergens: [],
        optionGroups: [],
        fixedComponents: [],
      },
    ],
  });

  render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: SURABAYA.id },
        }}
      >
        <ProductDetailView
          slug="demo-bread-cheese"
          initial={{ status: 'success', data: singleSkuProduct }}
        />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  expect(
    screen.getByText(PRODUCT_DETAIL_COPY.VARIANT_SINGLE_NOTE),
  ).toBeInTheDocument();
});

it('renders malicious copy safely as text and handles error retry state', async () => {
  navigation.search = 'branch=surabaya';
  const xssProduct = buildDetail({
    name: '<script>alert("xss")</script>',
    description: '<img src=x onerror=alert("xss")>',
  });

  const { container } = render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: SURABAYA.id },
        }}
      >
        <ProductDetailView
          slug="demo-xss"
          initial={{ status: 'success', data: xssProduct }}
        />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  // Assert no script tags were injected into the DOM
  expect(container.querySelectorAll('script')).toHaveLength(0);
  expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();

  // Test error state
  cleanup();
  vi.spyOn(catalogService, 'readProductDetail').mockRejectedValue(
    new ApiClientError({
      code: 'UPSTREAM_ERROR',
      message: 'Server error',
      status: 503,
    }),
  );

  render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: SURABAYA.id },
        }}
      >
        <ProductDetailView slug="demo-error" initial={{ status: 'error' }} />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  await waitFor(() => {
    expect(
      screen.getByText(PRODUCT_DETAIL_COPY.ERROR_TITLE),
    ).toBeInTheDocument();
  });
});
