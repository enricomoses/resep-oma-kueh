import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminPromotionsView } from '@/app/admin/(dashboard)/promotions/_components/admin-promotions-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import type { AdminSessionProfile } from '@/types/auth';
import type { AdminPromotionsListResponse } from '@/types/promotion';

const createPromotionMock = vi.fn();
const savePromotionMock = vi.fn();
const archivePromotionMock = vi.fn();
const saveShippingBannerMock = vi.fn();
const uploadMediaMock = vi.fn();

vi.mock('@/services/admin-catalog.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/admin-catalog.service')>();
  return {
    ...actual,
    createAdminPromotionRequest: (...args: unknown[]) =>
      createPromotionMock(...args),
    saveAdminPromotionRequest: (...args: unknown[]) =>
      savePromotionMock(...args),
    archiveAdminPromotionRequest: (...args: unknown[]) =>
      archivePromotionMock(...args),
    saveAdminShippingBannerRequest: (...args: unknown[]) =>
      saveShippingBannerMock(...args),
    uploadAdminProductMediaRequest: (...args: unknown[]) =>
      uploadMediaMock(...args),
  };
});

const OWNER_PROFILE: AdminSessionProfile = {
  userId: 'f1900000-0000-4000-8000-000000000001',
  email: 'owner@resepomakueh.example',
  displayName: 'Owner Oma',
  role: 'owner',
  branchId: null,
  branchCode: null,
  branchName: null,
};

const BRANCH_SBY_ID = 'f0400000-0000-4000-8000-000000000001';
const PROMO_ID = 'd1900000-0000-4000-8000-000000000001';

const initialData: AdminPromotionsListResponse = {
  promotions: [
    {
      id: PROMO_ID,
      title: 'Promo Weekend Chiffon',
      slug: 'promo-weekend-chiffon',
      description: 'Diskon 10% akhir pekan',
      discountType: 'percentage',
      discountValue: 10,
      minSpendIdr: 100_000,
      maxDiscountIdr: 25_000,
      scope: 'all',
      startsAt: '2026-11-10T02:00:00.000Z',
      endsAt: '2026-11-20T16:59:00.000Z',
      priority: 10,
      status: 'published',
      isEnabled: true,
      isStackable: false,
      clockState: 'active',
      bannerImagePath: null,
      bannerImageUrl: null,
      branchIds: [],
      categoryIds: [],
      productIds: [],
      variantIds: [],
      createdAt: '2026-11-09T02:00:00.000Z',
      updatedAt: '2026-11-09T03:00:00.000Z',
    },
  ],
  shippingBanner: {
    title: 'Info Ongkos Kirim Surabaya',
    body: 'Ongkir dihitung manual oleh admin WhatsApp cabang.',
    status: 'draft',
    updatedAt: '2026-11-09T03:00:00.000Z',
  },
  references: {
    branches: [
      {
        id: BRANCH_SBY_ID,
        code: 'surabaya',
        name: 'Surabaya',
        isActive: true,
      },
    ],
    categories: [
      {
        id: 'c1900000-0000-4000-8000-000000000001',
        label: 'Chiffon Cake',
        secondaryLabel: 'chiffon-cake',
        isPublishEligible: true,
      },
    ],
    products: [],
    variants: [],
  },
};

function renderWithQuery(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <AdminPromotionsView profile={OWNER_PROFILE} initialData={initialData} />
    </QueryClientProvider>,
  );
}

describe('F19 AdminPromotionsView DOM interactions & invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Jakarta schedule, shared calc preview, creates promo, archives promo, and invalidates admin & public queries', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const createdItem = {
      ...initialData.promotions[0],
      id: 'd1900000-0000-4000-8000-000000000002',
      title: 'Promo Natal',
      slug: 'promo-natal',
      updatedAt: '2026-11-13T08:00:00.000Z',
    };

    createPromotionMock.mockResolvedValue({
      ok: true,
      data: { promotion: createdItem },
      requestId: 'req-create',
    });

    archivePromotionMock.mockResolvedValue({
      ok: true,
      data: {
        promotion: {
          ...initialData.promotions[0],
          status: 'archived',
          isEnabled: false,
          updatedAt: '2026-11-13T09:00:00.000Z',
        },
      },
      requestId: 'req-archive',
    });

    saveShippingBannerMock.mockResolvedValue({
      ok: true,
      data: {
        shippingBanner: {
          title: 'Info Ongkos Kirim Surabaya',
          body: 'Ongkir dikonfirmasi admin WhatsApp.',
          status: 'published',
          updatedAt: '2026-11-13T10:00:00.000Z',
        },
      },
      requestId: 'req-banner',
    });

    renderWithQuery(queryClient);

    expect(screen.getByText('Promo Weekend Chiffon')).toBeTruthy();
    expect(screen.getByText('Semua Cabang Aktif')).toBeTruthy();

    // Open create form and verify shared calc live preview updates
    fireEvent.click(
      screen.getByRole('button', {
        name: ADMIN_CATALOG_COPY.PROMOTIONS.ADD_BUTTON,
      }),
    );

    const titleInput = screen.getByLabelText('Judul Promo');
    fireEvent.change(titleInput, { target: { value: 'Promo Natal' } });

    expect(
      screen.getByText('Pratinjau Perhitungan Shared Engine'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Promosi' }));

    await waitFor(() => {
      expect(createPromotionMock).toHaveBeenCalledTimes(1);
    });

    const calledKeys = invalidateSpy.mock.calls.map(
      (call) => (call[0] as { queryKey?: unknown }).queryKey,
    );
    expect(calledKeys).toContainEqual(QUERY_KEYS.ADMIN_ROOT);
    expect(calledKeys).toContainEqual(['resep-oma-kueh', 'promotions']);
    expect(calledKeys).toContainEqual(['resep-oma-kueh', 'catalog']);
    expect(calledKeys).toContainEqual(['resep-oma-kueh', 'cart-validate']);

    // Save shipping banner
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Banner Info' }));
    await waitFor(() => {
      expect(saveShippingBannerMock).toHaveBeenCalledTimes(1);
    });

    // Archive existing promotion with confirmation dialog
    fireEvent.click(screen.getByRole('button', { name: 'Arsipkan' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: ADMIN_CATALOG_COPY.PROMOTIONS.ARCHIVE_CONFIRM_SUBMIT,
      }),
    );

    await waitFor(() => {
      expect(archivePromotionMock).toHaveBeenCalledWith(PROMO_ID, {
        expectedUpdatedAt: initialData.promotions[0].updatedAt,
      });
    });
  });
});
