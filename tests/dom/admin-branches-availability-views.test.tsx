import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminAvailabilityView } from '@/components/admin/admin-availability-view';
import { AdminLocationsView } from '@/components/admin/admin-locations-view';
import { AdminShell } from '@/components/admin/admin-shell';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminAvailabilityListResponse,
  AdminBranchesResponse,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';

const updateBranchMock = vi.fn();
const replaceHoursMock = vi.fn();
const upsertAvailabilityMock = vi.fn();
const bulkAvailabilityMock = vi.fn();
const readBranchesMock = vi.fn();
const readAvailabilityMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => ROUTES.ADMIN,
}));

vi.mock('@/services/admin-catalog.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/admin-catalog.service')>();
  return {
    ...actual,
    readAdminBranchesRequest: (...args: unknown[]) => readBranchesMock(...args),
    updateAdminBranchRequest: (...args: unknown[]) => updateBranchMock(...args),
    replaceAdminBranchHoursRequest: (...args: unknown[]) =>
      replaceHoursMock(...args),
    readAdminAvailabilityRequest: (...args: unknown[]) =>
      readAvailabilityMock(...args),
    upsertAdminAvailabilityRequest: (...args: unknown[]) =>
      upsertAvailabilityMock(...args),
    bulkUpdateAdminAvailabilityRequest: (...args: unknown[]) =>
      bulkAvailabilityMock(...args),
  };
});

const OWNER_PROFILE: AdminSessionProfile = {
  userId: 'f1800000-0000-4000-8000-000000000001',
  email: 'owner@resepomakueh.example',
  displayName: 'Owner Oma',
  role: 'owner',
  branchId: null,
  branchCode: null,
  branchName: null,
};

const SURABAYA_ID = 'f0400000-0000-4000-8000-000000000001';
const BINTARO_ID = 'f0400000-0000-4000-8000-000000000002';
const VAR_1 = 'b1800000-0000-4000-8000-000000000001';
const VAR_2 = 'b1800000-0000-4000-8000-000000000002';

const STAFF_SBY_PROFILE: AdminSessionProfile = {
  userId: 'f1800000-0000-4000-8000-000000000002',
  email: 'staff.sby@resepomakueh.example',
  displayName: 'Staf SBY',
  role: 'branch_admin',
  branchId: SURABAYA_ID,
  branchCode: 'surabaya',
  branchName: 'Surabaya',
};

const initialBranchesData: AdminBranchesResponse = {
  branches: [
    {
      id: SURABAYA_ID,
      code: 'surabaya',
      name: 'Surabaya',
      city: 'Surabaya',
      address: 'Rungkut Asri Tengah V No. 22, Surabaya',
      mapsUrl: null,
      whatsappNumber: '6281703384308',
      description: 'Dapur Surabaya',
      allowPickup: false,
      allowDelivery: false,
      sortOrder: 1,
      isActive: true,
      updatedAt: '2026-11-13T08:00:00.000Z',
      hours: [],
      readiness: {
        hasConfirmedAddress: true,
        hasMapsUrl: false,
        hasVerifiedHours: false,
        fulfillmentEnabled: false,
        officialEmail: 'resepoma.kueh2@gmail.com',
        whatsappTargetUrl: 'https://wa.me/6281703384308',
      },
    },
    {
      id: BINTARO_ID,
      code: 'bintaro',
      name: 'Bintaro',
      city: 'Tangerang Selatan',
      address: null,
      mapsUrl: null,
      whatsappNumber: '6285119785194',
      description: null,
      allowPickup: false,
      allowDelivery: false,
      sortOrder: 2,
      isActive: true,
      updatedAt: '2026-11-13T08:00:00.000Z',
      hours: [],
      readiness: {
        hasConfirmedAddress: false,
        hasMapsUrl: false,
        hasVerifiedHours: false,
        fulfillmentEnabled: false,
        officialEmail: 'resepoma.kueh2@gmail.com',
        whatsappTargetUrl: 'https://wa.me/6285119785194',
      },
    },
  ],
  approvedContacts: {
    email: 'resepoma.kueh2@gmail.com',
    instagramUrl: 'https://www.instagram.com/resepoma.kueh/',
    surabayaConfirmedAddress: 'Rungkut Asri Tengah V No. 22, Surabaya',
    bintaroAddressResolved: false,
  },
};

const initialAvailabilityData: AdminAvailabilityListResponse = {
  items: [
    {
      branchId: SURABAYA_ID,
      branchCode: 'surabaya',
      branchName: 'Surabaya',
      variantId: VAR_1,
      productId: 'a1800000-0000-4000-8000-000000000001',
      productName: 'Chiffon Cheese',
      productSlug: 'chiffon-cheese',
      productStatus: 'published',
      productType: 'simple',
      sku: 'ROK-CHS-20',
      variantLabel: '20 cm',
      variantStatus: 'active',
      basePriceIdr: 120000,
      priceOverrideIdr: null,
      effectivePriceIdr: 120000,
      isListed: true,
      availabilityStatus: 'available',
      stockQuantity: 5,
      hasOfferRow: true,
      offerUpdatedAt: '2026-11-13T08:00:00.000Z',
      variantUpdatedAt: '2026-11-13T08:00:00.000Z',
    },
    {
      branchId: SURABAYA_ID,
      branchCode: 'surabaya',
      branchName: 'Surabaya',
      variantId: VAR_2,
      productId: 'a1800000-0000-4000-8000-000000000001',
      productName: 'Chiffon Cheese',
      productSlug: 'chiffon-cheese',
      productStatus: 'published',
      productType: 'simple',
      sku: 'ROK-CHS-15',
      variantLabel: '15 cm',
      variantStatus: 'active',
      basePriceIdr: 85000,
      priceOverrideIdr: null,
      effectivePriceIdr: 85000,
      isListed: false,
      availabilityStatus: 'unconfirmed',
      stockQuantity: null,
      hasOfferRow: false,
      offerUpdatedAt: null,
      variantUpdatedAt: '2026-11-13T08:00:00.000Z',
    },
  ],
  branches: [
    { id: SURABAYA_ID, code: 'surabaya', name: 'Surabaya', isActive: true },
    { id: BINTARO_ID, code: 'bintaro', name: 'Bintaro', isActive: true },
  ],
  pagination: {
    page: 1,
    pageSize: 24,
    totalCount: 2,
    totalPages: 1,
  },
};

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe('F18 Admin Locations & Availability DOM Views', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readBranchesMock.mockResolvedValue({
      ok: true,
      data: initialBranchesData,
      requestId: 'req-b',
    });
    readAvailabilityMock.mockResolvedValue({
      ok: true,
      data: initialAvailabilityData,
      requestId: 'req-a',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('shows availability nav link for staff & owner, but locations nav link only for owner', () => {
    const client = createClient();
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <AdminShell initialProfile={STAFF_SBY_PROFILE}>
          <div>Staff</div>
        </AdminShell>
      </QueryClientProvider>,
    );

    const sidebarStaff = within(screen.getByLabelText('Sidebar admin'));
    expect(
      sidebarStaff.getByRole('link', { name: /Ketersediaan Cabang/i }),
    ).toHaveAttribute('href', ROUTES.ADMIN_AVAILABILITY);
    expect(
      sidebarStaff.queryByRole('link', { name: /Lokasi & Jam Cabang/i }),
    ).toBeNull();

    rerender(
      <QueryClientProvider client={client}>
        <AdminShell initialProfile={OWNER_PROFILE}>
          <div>Owner</div>
        </AdminShell>
      </QueryClientProvider>,
    );

    const sidebarOwner = within(screen.getByLabelText('Sidebar admin'));
    expect(
      sidebarOwner.getByRole('link', { name: /Lokasi & Jam Cabang/i }),
    ).toHaveAttribute('href', ROUTES.ADMIN_LOCATIONS);
  });

  it('renders readiness, enforces WA reverify + invalid overnight rejection, and invalidates public caches on save', async () => {
    const client = createClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    updateBranchMock.mockResolvedValue({
      ok: true,
      data: {
        branch: {
          ...initialBranchesData.branches[0],
          whatsappNumber: '6281911223344',
          updatedAt: '2026-11-13T09:00:00.000Z',
        },
      },
      requestId: 'req-patch',
    });

    render(
      <QueryClientProvider client={client}>
        <AdminLocationsView
          profile={OWNER_PROFILE}
          initialData={initialBranchesData}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(ADMIN_CATALOG_COPY.LOCATIONS.SURABAYA_FINAL_NOTE),
    ).toBeTruthy();
    expect(
      screen.getByText(ADMIN_CATALOG_COPY.LOCATIONS.BINTARO_UNRESOLVED_NOTE),
    ).toBeTruthy();

    // Change WhatsApp -> preview shows normalized wa.me URL & save requires reverification check
    const waInput = screen.getByLabelText(/Nomor WhatsApp Cabang/i);
    fireEvent.change(waInput, { target: { value: '0819-1122-3344' } });
    expect(
      screen.getByRole('link', { name: 'https://wa.me/6281911223344' }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: /Simpan Pengaturan Cabang/i }),
    );
    expect(
      (
        await screen.findAllByText(
          ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.WHATSAPP_REVERIFY_REQUIRED,
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(updateBranchMock).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByLabelText(ADMIN_CATALOG_COPY.LOCATIONS.WA_REVERIFY_LABEL),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Simpan Pengaturan Cabang/i }),
    );

    await waitFor(() => expect(updateBranchMock).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['resep-oma-kueh', 'branches'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['resep-oma-kueh', 'cart-validate'],
    });

    // Reject invalid overnight hours (e.g. Senin 22:00 to 02:00) on client before RPC
    fireEvent.change(screen.getByLabelText('Buka (Senin)'), {
      target: { value: '22:00' },
    });
    fireEvent.change(screen.getByLabelText('Tutup (Senin)'), {
      target: { value: '02:00' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Simpan Jam Mingguan/i }),
    );
    expect(
      (
        await screen.findAllByText(
          ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_OVERNIGHT_RANGE,
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(replaceHoursMock).not.toHaveBeenCalled();
  });

  it('hides price inputs from staff and shows truthful partial failure report on bulk availability update', async () => {
    const client = createClient();
    bulkAvailabilityMock.mockResolvedValue({
      ok: true,
      data: {
        totalCount: 2,
        succeededCount: 1,
        failedCount: 1,
        results: [
          {
            branchId: SURABAYA_ID,
            variantId: VAR_1,
            ok: true,
            status: 200,
            errorCode: null,
            message: null,
            offer: initialAvailabilityData.items[0],
          },
          {
            branchId: SURABAYA_ID,
            variantId: VAR_2,
            ok: false,
            status: 409,
            errorCode: 'CONFLICT',
            message: ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STALE_CONFLICT,
            offer: null,
          },
        ],
      },
      requestId: 'req-bulk',
    });

    const { rerender } = render(
      <QueryClientProvider client={client}>
        <AdminAvailabilityView
          profile={STAFF_SBY_PROFILE}
          initialData={{
            ...initialAvailabilityData,
            branches: [initialAvailabilityData.branches[0]],
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(ADMIN_CATALOG_COPY.AVAILABILITY.STAFF_SCOPE_NOTE),
    ).toBeTruthy();
    expect(screen.queryByLabelText(/Harga Dasar/i)).toBeNull();
    expect(screen.queryByLabelText(/Override Cabang/i)).toBeNull();

    // Select all visible SKUs and submit bulk
    fireEvent.click(
      screen.getByRole('button', { name: /Pilih Semua di Halaman/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Terapkan ke 2 SKU Terpilih/i }),
    );

    expect(
      await screen.findByText(/1 dari 2 SKU berhasil diperbarui; 1 gagal\./i),
    ).toBeTruthy();
    expect(
      screen.getByText(ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STALE_CONFLICT),
    ).toBeTruthy();

    // Owner view exposes Base Price + Override Price inputs and row save errors
    upsertAvailabilityMock.mockRejectedValueOnce(
      new ApiClientError({
        code: 'CONFLICT',
        status: 409,
        message: ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STALE_CONFLICT,
      }),
    );

    rerender(
      <QueryClientProvider client={client}>
        <AdminAvailabilityView
          profile={OWNER_PROFILE}
          initialData={initialAvailabilityData}
        />
      </QueryClientProvider>,
    );

    const baseInputs = screen.getAllByLabelText(/Harga Dasar \(Rp\)/i);
    expect(baseInputs.length).toBe(2);
    fireEvent.change(baseInputs[0]!, { target: { value: '135000' } });
    fireEvent.click(
      screen.getAllByRole('button', { name: /Simpan Baris/i })[0]!,
    );

    expect(
      await screen.findByText(
        ADMIN_CATALOG_COPY.AVAILABILITY.ERRORS.STALE_CONFLICT,
      ),
    ).toBeTruthy();
  });
});
