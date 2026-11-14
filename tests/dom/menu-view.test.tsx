import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MenuView } from '@/app/(site)/menu/_components/menu-view';
import {
  CATALOG_COPY,
  CATALOG_LIMITS,
  serializeCatalogQueryKey,
} from '@/constants/catalog.constant';
import { ApiClientError } from '@/lib/errors';
import { ReactQueryProvider } from '@/providers';
import { BranchProvider } from '@/providers/branch-provider';
import * as branchesService from '@/services/branches.service';
import * as catalogService from '@/services/catalog.service';
import type { PublicBranch } from '@/types/branch';
import type {
  CatalogDirectory,
  CatalogProductItem,
  PublicCategoryDirectory,
} from '@/types/catalog';

const navigation = vi.hoisted(() => ({
  search: '',
  replace: vi.fn((url: string) => {
    const [, query = ''] = url.split('?');
    navigation.search = query;
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/menu',
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

const CATEGORIES: PublicCategoryDirectory = {
  items: [
    {
      id: 'f0400000-0000-4000-8000-000000000200',
      name: 'DEMO — Chiffon Series',
      slug: 'demo-chiffon-series',
      description: 'Data sintetis lokal.',
      sortOrder: 0,
    },
  ],
};

function buildProduct(
  overrides: Partial<CatalogProductItem> = {},
): CatalogProductItem {
  return {
    id: 'f0400000-0000-4000-8000-000000000400',
    name: 'DEMO — Coffee Chiffon',
    slug: 'demo-coffee',
    shortDescription: null,
    description: 'SYNTHETIC DEMO lokal.',
    productType: 'variants',
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    sortOrder: 0,
    createdAt: '2026-11-10T08:00:00+07:00',
    primaryCategory: {
      id: 'f0400000-0000-4000-8000-000000000200',
      name: 'DEMO — Chiffon Series',
      slug: 'demo-chiffon-series',
    },
    imageAlt: 'DEMO — ilustrasi placeholder',
    verifiedDietaryTags: [{ slug: 'gluten-free', name: 'Gluten-Free' }],
    activeVariantCount: 3,
    offeredVariantCount: 0,
    availabilityStatus: null,
    baseFromPriceIdr: null,
    fromPriceIdr: null,
    appliedPromotion: null,
    conditionalPromotion: null,
    ...overrides,
  };
}

function buildCatalog(
  overrides: Partial<CatalogDirectory> = {},
): CatalogDirectory {
  return {
    items: [buildProduct()],
    total: 1,
    page: 1,
    limit: 12,
    totalPages: 1,
    resolvedBranchId: null,
    appliedFilters: {
      branch: null,
      category: null,
      q: null,
      tag: null,
      availability: null,
      minPriceIdr: null,
      maxPriceIdr: null,
      sort: 'featured',
    },
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  navigation.search = '';
  navigation.replace.mockClear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('renders browse mode without final branch price or Add CTA when no branch is selected', () => {
  const initialCatalog = buildCatalog();
  render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: null },
        }}
      >
        <MenuView
          initialCategories={{ status: 'success', data: CATEGORIES }}
          initialCatalog={{
            key: serializeCatalogQueryKey({}),
            result: { status: 'success', data: initialCatalog },
          }}
        />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  expect(
    screen.getByRole('heading', {
      level: 2,
      name: CATALOG_COPY.BRANCH_NOTICE_TITLE,
    }),
  ).toBeInTheDocument();
  expect(screen.getByText('DEMO — Coffee Chiffon')).toBeInTheDocument();
  expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
  expect(
    screen.getByText(CATALOG_COPY.PRICE_BRANCH_REQUIRED),
  ).toBeInTheDocument();
  expect(screen.queryByText(/^Rp\d/)).toBeNull();
  expect(
    screen.getByRole('link', { name: CATALOG_COPY.CTA_VIEW_OPTIONS }),
  ).toHaveAttribute('href', '/menu/demo-coffee');
});

it('displays computed branch starting price, promo badge, and branch-preserving detail link when branch is selected', () => {
  navigation.search = 'branch=bintaro';
  vi.spyOn(branchesService, 'readBranches').mockResolvedValue({
    ok: true,
    data: { items: [SURABAYA, BINTARO], resolvedBranchId: BINTARO.id },
    requestId: 'branch-bintaro',
  });
  const bintaroCatalog = buildCatalog({
    resolvedBranchId: BINTARO.id,
    items: [
      buildProduct({
        offeredVariantCount: 3,
        availabilityStatus: 'unconfirmed',
        baseFromPriceIdr: 16_000,
        fromPriceIdr: 14_000,
        appliedPromotion: {
          id: 'f0400000-0000-4000-8000-000000000931',
          title: 'DEMO — current at reference clock',
          slug: 'demo-current',
          discountType: 'fixed',
          discountValue: 2000,
          minSpendIdr: 0,
          maxDiscountIdr: 5000,
        },
      }),
    ],
  });

  render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: BINTARO.id },
        }}
      >
        <MenuView
          initialCategories={{ status: 'success', data: CATEGORIES }}
          initialCatalog={{
            key: serializeCatalogQueryKey({ branch: 'bintaro' }),
            result: { status: 'success', data: bintaroCatalog },
          }}
        />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  expect(
    screen.queryByRole('heading', {
      level: 2,
      name: CATALOG_COPY.BRANCH_NOTICE_TITLE,
    }),
  ).toBeNull();
  expect(screen.getByText('Rp14.000')).toBeInTheDocument();
  expect(screen.getByText('Rp16.000')).toBeInTheDocument();
  expect(
    screen.getByText(/DEMO — current at reference clock/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: CATALOG_COPY.CTA_VIEW_OPTIONS }),
  ).toHaveAttribute('href', '/menu/demo-coffee?branch=bintaro');
});

it('resets page to 1 when changing category filter and cleans up debounced search timer on unmount', () => {
  vi.useFakeTimers();
  navigation.search = 'branch=surabaya&page=2';
  vi.spyOn(branchesService, 'readBranches').mockResolvedValue({
    ok: true,
    data: { items: [SURABAYA, BINTARO], resolvedBranchId: SURABAYA.id },
    requestId: 'branch-surabaya',
  });

  const view = render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: SURABAYA.id },
        }}
      >
        <MenuView
          initialCategories={{ status: 'success', data: CATEGORIES }}
          initialCatalog={{
            key: serializeCatalogQueryKey({ branch: 'surabaya', page: 2 }),
            result: {
              status: 'success',
              data: buildCatalog({
                resolvedBranchId: SURABAYA.id,
                page: 2,
                totalPages: 2,
              }),
            },
          }}
        />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  const categorySelects = screen.getAllByLabelText(CATALOG_COPY.CATEGORY_LABEL);
  fireEvent.change(categorySelects[0], {
    target: { value: 'demo-chiffon-series' },
  });

  // Changing filter resets page=2 to page 1 (omitted from URL)
  expect(navigation.replace).toHaveBeenCalledWith(
    '/menu?branch=surabaya&category=demo-chiffon-series',
    { scroll: false },
  );
  navigation.replace.mockClear();

  // Type into search input and unmount before debounce expires -> timer cleaned up, no navigation call
  const searchInputs = screen.getAllByLabelText(CATALOG_COPY.SEARCH_LABEL);
  fireEvent.change(searchInputs[0], { target: { value: 'pandan' } });
  view.unmount();

  act(() => {
    vi.advanceTimersByTime(CATALOG_LIMITS.DEBOUNCE_MS + 100);
  });
  expect(navigation.replace).not.toHaveBeenCalled();
});

it('distinguishes empty HTTP 200 catalog results from upstream error states', async () => {
  vi.spyOn(catalogService, 'readCategories').mockResolvedValue({
    ok: true,
    data: CATEGORIES,
    requestId: 'cat-ok',
  });
  vi.spyOn(catalogService, 'readCatalog').mockRejectedValue(
    new ApiClientError({
      code: 'INVALID_RESPONSE',
      message: 'Upstream error',
      status: 503,
    }),
  );

  render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: null },
        }}
      >
        <MenuView
          initialCategories={{ status: 'success', data: CATEGORIES }}
          initialCatalog={{
            key: serializeCatalogQueryKey({}),
            result: { status: 'error' },
          }}
        />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  await waitFor(() =>
    expect(screen.getByText(CATALOG_COPY.ERROR_TITLE)).toBeInTheDocument(),
  );
});
