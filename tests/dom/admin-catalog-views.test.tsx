import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AdminCategoriesView } from '@/app/admin/(dashboard)/categories/_components/admin-categories-view';
import { AdminOverviewView } from '@/app/admin/(dashboard)/_components/admin-overview-view';
import { AdminProductsView } from '@/app/admin/(dashboard)/products/_components/admin-products-view';
import { AdminShell } from '@/app/admin/(dashboard)/_components/admin-shell';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { ROUTES } from '@/constants/routes.constant';
import { ApiClientError } from '@/lib/errors';
import * as adminCatalogService from '@/services/admin-catalog.service';
import type {
  AdminCategoryListResponse,
  AdminOverviewResponse,
  AdminProductListResponse,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  usePathname: () => '/admin',
}));

const OWNER_PROFILE: AdminSessionProfile = {
  userId: 'f1600000-0000-4000-8000-000000000001',
  email: 'owner@example.invalid',
  displayName: 'Oma Owner',
  role: 'owner',
  branchId: null,
  branchCode: null,
  branchName: null,
};

const STAFF_PROFILE: AdminSessionProfile = {
  userId: 'f1600000-0000-4000-8000-000000000002',
  email: 'staff@example.invalid',
  displayName: 'Admin Surabaya',
  role: 'branch_admin',
  branchId: 'f0400000-0000-4000-8000-000000000001',
  branchCode: 'surabaya',
  branchName: 'Surabaya',
};

const BASE_CATEGORIES: AdminCategoryListResponse = {
  items: [
    {
      id: 'c1600000-0000-4000-8000-000000000001',
      name: 'Chiffon Cakes',
      slug: 'chiffon-cakes',
      parentId: null,
      parentName: null,
      description: 'Kue chiffon panggang harian',
      sortOrder: 1,
      status: 'published',
      childCount: 0,
      productRefCount: 2,
      createdAt: '2026-11-10T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    },
    {
      id: 'c1600000-0000-4000-8000-000000000002',
      name: 'Draf Kue Musiman',
      slug: 'draf-kue-musiman',
      parentId: null,
      parentName: null,
      description: null,
      sortOrder: 2,
      status: 'draft',
      childCount: 0,
      productRefCount: 0,
      createdAt: '2026-11-10T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    },
  ],
};

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close() {
      this.open = false;
    };
  }
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AdminShell and role-scoped navigation', () => {
  it('hides global owner catalog modules from branch_admin staff UI', () => {
    const client = createClient();
    render(
      <QueryClientProvider client={client}>
        <AdminShell initialProfile={STAFF_PROFILE}>
          <div>Staff Area</div>
        </AdminShell>
      </QueryClientProvider>,
    );

    const sidebar = within(screen.getByLabelText('Sidebar admin'));
    expect(sidebar.getByText('Ringkasan')).toBeTruthy();
    expect(sidebar.getByText('Ketersediaan Cabang')).toBeTruthy();
    expect(sidebar.queryByRole('link', { name: /Kategori Menu/i })).toBeNull();
    expect(sidebar.queryByRole('link', { name: /Produk & Draf/i })).toBeNull();
  });

  it('opens accessible mobile drawer for owner modules', () => {
    const client = createClient();
    render(
      <QueryClientProvider client={client}>
        <AdminShell initialProfile={OWNER_PROFILE}>
          <div>Owner Area</div>
        </AdminShell>
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole('link', { name: /Kategori Menu/i }),
    ).toHaveAttribute('href', ROUTES.ADMIN_CATEGORIES);
    expect(
      screen.getByRole('link', { name: /Produk & Draf/i }),
    ).toHaveAttribute('href', ROUTES.ADMIN_PRODUCTS);

    const openBtn = screen.getByRole('button', {
      name: ADMIN_CATALOG_COPY.SHELL.OPEN_NAV,
    });
    fireEvent.click(openBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveProperty('open', true);
    expect(
      within(dialog).getByRole('link', { name: /Kategori Menu/i }),
    ).toBeTruthy();
  });
});

describe('AdminOverviewView', () => {
  it('renders real owner counts vs staff branch counts distinctly', () => {
    const client = createClient();
    const ownerOverview: AdminOverviewResponse = {
      role: 'owner',
      branchId: null,
      branchName: null,
      ownerCounts: {
        categoriesPublished: 4,
        categoriesDraft: 1,
        categoriesArchived: 0,
        productsPublished: 12,
        productsDraft: 3,
        productsArchived: 2,
        productsNeedsReview: 2,
        activeBranches: 2,
        soldOutOffers: 1,
        activePromotions: 1,
        upcomingSessions: 3,
      },
      staffCounts: null,
    };

    const { rerender } = render(
      <QueryClientProvider client={client}>
        <AdminOverviewView
          profile={OWNER_PROFILE}
          initialOverview={ownerOverview}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_PUBLISHED),
    ).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(
      screen.getByRole('link', {
        name: ADMIN_CATALOG_COPY.OVERVIEW.MANAGE_CATEGORIES,
      }),
    ).toBeTruthy();

    rerender(
      <QueryClientProvider client={client}>
        <AdminOverviewView
          profile={STAFF_PROFILE}
          initialOverview={{
            role: 'branch_admin',
            branchId: STAFF_PROFILE.branchId,
            branchName: 'Surabaya',
            ownerCounts: null,
            staffCounts: {
              availableOffers: 9,
              soldOutOffers: 2,
              upcomingSessions: 1,
            },
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(
        ADMIN_CATALOG_COPY.OVERVIEW.CARDS.STAFF_AVAILABLE_OFFERS,
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText(ADMIN_CATALOG_COPY.OVERVIEW.CARDS.PRODUCTS_DRAFT),
    ).toBeNull();
  });
});

describe('AdminCategoriesView', () => {
  it('creates/archives with confirmation, shows 409 conflict banner, and invalidates admin & public catalog queries', async () => {
    const client = createClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const createSpy = vi
      .spyOn(adminCatalogService, 'createAdminCategoryRequest')
      .mockResolvedValue({
        ok: true,
        data: {
          category: {
            id: 'c1600000-0000-4000-8000-000000000099',
            name: 'Cookies Klasik',
            slug: 'cookies-klasik',
            parentId: null,
            parentName: null,
            description: 'Kue kering renyah',
            sortOrder: 3,
            status: 'draft',
            childCount: 0,
            productRefCount: 0,
            createdAt: '2026-11-13T00:00:00Z',
            updatedAt: '2026-11-13T00:00:00Z',
          },
        },
        requestId: 'req-cat-1',
      });

    render(
      <QueryClientProvider client={client}>
        <AdminCategoriesView
          profile={OWNER_PROFILE}
          initialCategories={BASE_CATEGORIES}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: ADMIN_CATALOG_COPY.CATEGORIES.ADD_BUTTON,
      }),
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.input(within(dialog).getByLabelText(/Nama Kategori/i), {
      target: { value: 'Cookies Klasik' },
    });
    expect(within(dialog).getByLabelText(/Slug URL/i)).toHaveValue(
      'cookies-klasik',
    );
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: ADMIN_CATALOG_COPY.CATEGORIES.SAVE_CREATE,
      }),
    );

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.ADMIN_ROOT,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.CATEGORIES,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['resep-oma-kueh', 'catalog'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['resep-oma-kueh', 'product-detail'],
    });

    // Trigger stale 409 on edit
    vi.spyOn(
      adminCatalogService,
      'updateAdminCategoryRequest',
    ).mockRejectedValueOnce(
      new ApiClientError({
        code: 'CONFLICT',
        status: 409,
        message: ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.STALE_CONFLICT,
      }),
    );

    fireEvent.click(
      screen.getAllByRole('button', {
        name: ADMIN_CATALOG_COPY.CATEGORIES.EDIT_BTN,
      })[0],
    );
    const editDialog = screen.getByRole('dialog');
    fireEvent.click(
      within(editDialog).getByRole('button', {
        name: ADMIN_CATALOG_COPY.CATEGORIES.SAVE_EDIT,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(ADMIN_CATALOG_COPY.CATEGORIES.ERRORS.STALE_CONFLICT),
      ).toBeTruthy();
    });

    fireEvent.click(
      within(editDialog).getByRole('button', {
        name: ADMIN_CATALOG_COPY.CATEGORIES.CANCEL,
      }),
    );

    // Require explicit archive dialog confirmation
    const archiveSpy = vi
      .spyOn(adminCatalogService, 'archiveAdminCategoryRequest')
      .mockResolvedValue({
        ok: true,
        data: {
          category: { ...BASE_CATEGORIES.items[1], status: 'archived' },
        },
        requestId: 'req-arch-1',
      });

    fireEvent.click(
      screen.getAllByRole('button', {
        name: ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_BTN,
      })[1],
    );
    expect(archiveSpy).not.toHaveBeenCalled();

    const confirmDialog = screen.getByRole('dialog');
    fireEvent.click(
      within(confirmDialog).getByRole('button', {
        name: ADMIN_CATALOG_COPY.CATEGORIES.ARCHIVE_CONFIRM_SUBMIT,
      }),
    );

    await waitFor(() => {
      expect(archiveSpy).toHaveBeenCalledWith(BASE_CATEGORIES.items[1].id, {
        expectedUpdatedAt: BASE_CATEGORIES.items[1].updatedAt,
      });
    });
  });
});

describe('AdminProductsView', () => {
  it('renders long names/HTML safely as text, clamps page after archiving last item on page 2, and avoids product price fields', async () => {
    const client = createClient();

    const page1Products: AdminProductListResponse = {
      items: [
        {
          id: 'a1600000-0000-4000-8000-000000000001',
          name: 'Spikoe Super Panjang Tanpa Potong <script>alert(1)</script> Klasik Surabaya',
          slug: 'spikoe-panjang',
          productType: 'simple',
          status: 'draft',
          needsOwnerReview: true,
          isFeatured: false,
          isBestSeller: false,
          isNew: false,
          shortDescription: null,
          description: null,
          ingredientsInfo: null,
          storageInstructions: null,
          sortOrder: 1,
          categories: [],
          readiness: {
            hasPublishedCategory: false,
            activeVariantCount: 0,
            hasActiveBranchOffer: false,
            approvedImageCount: 0,
            needsOwnerReview: true,
            isPublishReady: false,
            missingReasons: ['Minimal 1 varian SKU aktif'],
          },
          createdAt: '2026-11-10T00:00:00Z',
          updatedAt: '2026-11-10T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 1,
      totalPages: 2,
    };

    const page2Products: AdminProductListResponse = {
      items: [
        {
          ...page1Products.items[0],
          id: 'a1600000-0000-4000-8000-000000000002',
          name: 'Item Terakhir Halaman 2',
          slug: 'item-halaman-2',
        },
      ],
      total: 2,
      page: 2,
      limit: 1,
      totalPages: 2,
    };

    const listSpy = vi
      .spyOn(adminCatalogService, 'readAdminProductsRequest')
      .mockImplementation(async (params) => ({
        ok: true,
        data: params.page === 2 ? page2Products : page1Products,
        requestId: 'req-prod-list',
      }));

    const archiveSpy = vi
      .spyOn(adminCatalogService, 'archiveAdminProductRequest')
      .mockResolvedValue({
        ok: true,
        data: {
          product: { ...page2Products.items[0], status: 'archived' },
        },
        requestId: 'req-prod-arch',
      });

    render(
      <QueryClientProvider client={client}>
        <AdminProductsView
          profile={OWNER_PROFILE}
          initialProducts={page1Products}
          initialCategories={BASE_CATEGORIES}
        />
      </QueryClientProvider>,
    );

    // Malicious script string rendered purely as text
    expect(document.querySelector('script')).toBeNull();
    expect(
      screen.getByText(/<script>alert\(1\)<\/script>/i),
    ).toBeInTheDocument();

    // No price field on create product modal
    fireEvent.click(
      screen.getByRole('button', {
        name: ADMIN_CATALOG_COPY.PRODUCTS.ADD_BUTTON,
      }),
    );
    const createDialog = screen.getByRole('dialog');
    expect(within(createDialog).queryByLabelText(/Harga/i)).toBeNull();
    fireEvent.click(
      within(createDialog).getByRole('button', {
        name: ADMIN_CATALOG_COPY.PRODUCTS.CANCEL,
      }),
    );

    // Navigate to page 2 -> filter by status draft -> archive last item -> clamps back to page 1
    fireEvent.change(
      screen.getByLabelText(ADMIN_CATALOG_COPY.PRODUCTS.FILTER_STATUS_LABEL),
      { target: { value: 'draft' } },
    );
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled();
    });

    const nextButton = screen.getByRole('button', {
      name: ADMIN_CATALOG_COPY.PRODUCTS.PAGINATION_NEXT,
    });
    await waitFor(() => {
      expect(nextButton).toBeEnabled();
    });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Item Terakhir Halaman 2')).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_BTN,
      }),
    );
    const archiveDialog = screen.getByRole('dialog');
    fireEvent.click(
      within(archiveDialog).getByRole('button', {
        name: ADMIN_CATALOG_COPY.PRODUCTS.ARCHIVE_CONFIRM_SUBMIT,
      }),
    );

    await waitFor(() => {
      expect(archiveSpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/Halaman 1 dari 2/i)).toBeTruthy();
    });
  });
});
