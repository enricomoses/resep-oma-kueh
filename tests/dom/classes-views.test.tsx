import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminClassesView } from '@/app/admin/(dashboard)/classes/_components/admin-classes-view';
import { ClassDetailView } from '@/app/(site)/classes/[slug]/_components/class-detail-view';
import { ClassesView } from '@/app/(site)/classes/_components/classes-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { CLASSES_COPY } from '@/constants/classes.constant';
import type { AdminSessionProfile } from '@/types/auth';
import type { PublicBranch } from '@/types/branch';
import type {
  AdminClassBranchOption,
  AdminClassProgramItem,
  AdminClassSessionItem,
  PublicClassProgram,
} from '@/types/classes';

const BRANCH_SBY_ID = 'f0400000-0000-4000-8000-000000000001';
const BRANCH_BTR_ID = 'f0400000-0000-4000-8000-000000000002';
const PROGRAM_ID = 'f0400000-0000-4000-8000-000000000940';
const SESSION_OPEN_ID = 'f0400000-0000-4000-8000-000000000951';
const SESSION_CANCELLED_ID = 'f0400000-0000-4000-8000-000000000953';

const mockPrepareRegistration = vi.fn();
const mockReadClasses = vi.fn();
const mockReadClassDetail = vi.fn();
const mockCreateSession = vi.fn();
const mockUpdateSession = vi.fn();
const mockArchiveProgram = vi.fn();

const branchesState = vi.hoisted(() => ({
  selected: {
    id: 'f0400000-0000-4000-8000-000000000001',
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsappNumber: '6281703384308',
    address: 'Rungkut Asri Tengah V No. 22, Surabaya',
    mapsUrl: null,
  } as PublicBranch | null,
  items: [
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
      city: 'Tangerang Selatan',
      whatsappNumber: '6285119785194',
      address: null,
      mapsUrl: null,
    },
  ] as PublicBranch[],
}));

vi.mock('@/hooks/use-branches', () => ({
  useBranches: () => ({
    selected: branchesState.selected,
    code: branchesState.selected?.code ?? null,
    items: branchesState.items,
  }),
}));

vi.mock('@/services/classes.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/classes.service')>();
  return {
    ...actual,
    readPublicClassesRequest: (...args: unknown[]) => mockReadClasses(...args),
    readPublicClassDetailRequest: (...args: unknown[]) =>
      mockReadClassDetail(...args),
    prepareClassRegistrationRequest: (...args: unknown[]) =>
      mockPrepareRegistration(...args),
  };
});

vi.mock('@/services/admin-classes.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/admin-classes.service')>();
  return {
    ...actual,
    createAdminClassSessionRequest: (...args: unknown[]) =>
      mockCreateSession(...args),
    updateAdminClassSessionRequest: (...args: unknown[]) =>
      mockUpdateSession(...args),
    archiveAdminClassProgramRequest: (...args: unknown[]) =>
      mockArchiveProgram(...args),
  };
});

vi.mock('@/services/admin-catalog.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/admin-catalog.service')>();
  return {
    ...actual,
    uploadAdminProductMediaRequest: vi.fn(),
  };
});

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const SAMPLE_PROGRAM: PublicClassProgram = {
  id: PROGRAM_ID,
  title: 'Little Baker Chiffon Class',
  slug: 'little-baker-chiffon-class',
  shortDescription: 'Kelas baking anak.',
  description: 'Memanggang chiffon lembut bersama dapur Oma.',
  basePriceIdr: 185_000,
  ageMin: 4,
  ageMax: 12,
  durationMinutes: 90,
  coverImageUrl: null,
  coverAltText: 'Foto dapur kelas baking',
  includedItems: ['Bahan kue', 'Celemek pinjaman'],
  upcomingSessions: [
    {
      id: SESSION_OPEN_ID,
      programId: PROGRAM_ID,
      startsAt: '2027-06-15T03:00:00.000Z',
      endsAt: '2027-06-15T04:30:00.000Z',
      registrationDeadlineAt: '2027-06-14T12:00:00.000Z',
      capacity: 12,
      seatsLeft: null,
      capacityIsEstimate: true,
      effectivePriceIdr: 185_000,
      hasPriceOverride: false,
      status: 'scheduled',
      isRegistrationOpen: true,
      isRegisterable: true,
      unavailableReason: null,
      branch: {
        id: BRANCH_SBY_ID,
        code: 'surabaya',
        name: 'Surabaya',
        city: 'Surabaya',
        whatsappNumber: '6281703384308',
        address: 'Rungkut Asri Tengah V No. 22, Surabaya',
      },
    },
    {
      id: SESSION_CANCELLED_ID,
      programId: PROGRAM_ID,
      startsAt: '2027-06-16T03:00:00.000Z',
      endsAt: '2027-06-16T04:30:00.000Z',
      registrationDeadlineAt: '2027-06-15T12:00:00.000Z',
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
        id: BRANCH_BTR_ID,
        code: 'bintaro',
        name: 'Bintaro',
        city: 'Tangerang Selatan',
        whatsappNumber: '6285119785194',
        address: null,
      },
    },
  ],
  registerableSessionCount: 1,
};

const OWNER_PROFILE: AdminSessionProfile = {
  userId: 'f2100000-0000-4000-8000-000000000091',
  email: 'owner@resepomakueh.example',
  displayName: 'Owner Oma',
  role: 'owner',
  branchId: null,
  branchCode: null,
  branchName: null,
};

const STAFF_PROFILE: AdminSessionProfile = {
  userId: 'f2100000-0000-4000-8000-000000000092',
  email: 'sby@resepomakueh.example',
  displayName: 'Admin Surabaya',
  role: 'branch_admin',
  branchId: BRANCH_SBY_ID,
  branchCode: 'surabaya',
  branchName: 'Surabaya',
};

const ADMIN_BRANCHES: AdminClassBranchOption[] = [
  {
    id: BRANCH_SBY_ID,
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    isActive: true,
  },
  {
    id: BRANCH_BTR_ID,
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Tangerang Selatan',
    isActive: true,
  },
];

const ADMIN_PROGRAM: AdminClassProgramItem = {
  id: PROGRAM_ID,
  title: 'Little Baker Chiffon Class',
  slug: 'little-baker-chiffon-class',
  shortDescription: 'Kelas baking anak.',
  description: 'Memanggang chiffon lembut bersama dapur Oma.',
  basePriceIdr: 185_000,
  ageMin: 4,
  ageMax: 12,
  durationMinutes: 90,
  coverImagePath: 'approved/f0400000-0000-4000-8000-000000000001.webp',
  coverStorageBucket: 'class-images',
  coverIsApproved: true,
  coverAltText: 'Foto dapur kelas baking',
  coverPreviewUrl: null,
  needsOwnerReview: false,
  includedItems: ['Bahan kue', 'Celemek pinjaman'],
  status: 'published',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

const ADMIN_SESSION: AdminClassSessionItem = {
  id: SESSION_OPEN_ID,
  programId: PROGRAM_ID,
  programTitle: 'Little Baker Chiffon Class',
  programSlug: 'little-baker-chiffon-class',
  programStatus: 'published',
  programBasePriceIdr: 185_000,
  branchId: BRANCH_SBY_ID,
  branchCode: 'surabaya',
  branchName: 'Surabaya',
  branchIsActive: true,
  startsAt: '2027-06-15T03:00:00.000Z',
  endsAt: '2027-06-15T04:30:00.000Z',
  registrationDeadlineAt: '2027-06-14T12:00:00.000Z',
  capacity: 12,
  seatsLeft: null,
  priceOverrideIdr: null,
  effectivePriceIdr: 185_000,
  status: 'scheduled',
  isRegistrationOpen: true,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('F21 DOM public classes & detail registration views', () => {
  it('renders ClassesView program cards and Ask Next Class WA fallback when no sessions exist', () => {
    const emptySessionProgram: PublicClassProgram = {
      ...SAMPLE_PROGRAM,
      upcomingSessions: [],
      registerableSessionCount: 0,
    };
    const data = {
      items: [emptySessionProgram],
      resolvedBranchId: BRANCH_SBY_ID,
      evaluatedAtUtc: '2026-11-13T10:00:00.000Z',
    };
    mockReadClasses.mockResolvedValue({ ok: true, data, requestId: 'r1' });

    renderWithQuery(<ClassesView initial={{ status: 'success', data }} />);

    expect(screen.getByText('Little Baker Chiffon Class')).toBeInTheDocument();
    expect(screen.getByText(/Cabang terpilih: Surabaya/)).toBeInTheDocument();
    const askLink = screen.getByRole('link', {
      name: CLASSES_COPY.ASK_NEXT_CLASS_CTA,
    });
    expect(askLink).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/6281703384308?text='),
    );
  });

  it('handles unknown seats disclaimer, disabled cancelled button, WA preparation, clipboard fallback, and reset on edit', async () => {
    const detailData = {
      program: SAMPLE_PROGRAM,
      resolvedBranchId: BRANCH_SBY_ID,
      evaluatedAtUtc: '2026-11-13T10:00:00.000Z',
    };
    mockReadClassDetail.mockResolvedValue({
      ok: true,
      data: detailData,
      requestId: 'r2',
    });
    mockPrepareRegistration.mockResolvedValue({
      ok: true,
      data: {
        sessionId: SESSION_OPEN_ID,
        programId: PROGRAM_ID,
        programTitle: 'Little Baker Chiffon Class',
        programSlug: 'little-baker-chiffon-class',
        branchId: BRANCH_SBY_ID,
        branchCode: 'surabaya',
        branchName: 'Surabaya',
        startsAt: '2027-06-15T03:00:00.000Z',
        endsAt: '2027-06-15T04:30:00.000Z',
        registrationDeadlineAt: '2027-06-14T12:00:00.000Z',
        formattedScheduleJakarta: '15 Jun 2027, 10.00 WIB – 11.30 WIB',
        attendeeCount: 2,
        unitPriceIdr: 185_000,
        estimatedTotalIdr: 370_000,
        capacity: 12,
        seatsLeft: null,
        capacityIsEstimate: true,
        adultContactName: 'Ibu Sari',
        whatsappNumber: '6281703384308',
        whatsappUrl: 'https://wa.me/6281703384308?text=Halo',
        whatsappMessage: 'Halo Resep Oma Kueh Surabaya, daftar 2 peserta.',
        requiresCopy: false,
        manualConfirmationNote: CLASSES_COPY.CAPACITY_DISCLAIMER,
      },
      requestId: 'r3',
    });

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')),
      },
    });

    renderWithQuery(
      <ClassDetailView
        slug="little-baker-chiffon-class"
        initial={{ status: 'success', data: detailData }}
      />,
    );

    expect(
      screen.getByText(new RegExp(CLASSES_COPY.UNKNOWN_SEATS_NOTE)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: CLASSES_COPY.STATUS_BADGE.CANCELLED }),
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Jumlah Peserta/i), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText(/Nama Kontak/i), {
      target: { value: 'Ibu Sari' },
    });
    fireEvent.click(screen.getByLabelText(CLASSES_COPY.MANUAL_CONFIRM_LABEL));
    fireEvent.click(
      screen.getByRole('button', { name: CLASSES_COPY.REGISTER_SUBMIT_CTA }),
    );

    await waitFor(() => {
      expect(mockPrepareRegistration).toHaveBeenCalledWith({
        sessionId: SESSION_OPEN_ID,
        attendeeCount: 2,
        adultContactName: 'Ibu Sari',
      });
    });

    const waLink = await screen.findByRole('link', {
      name: CLASSES_COPY.OPEN_WHATSAPP_CTA,
    });
    expect(waLink).toHaveAttribute(
      'href',
      'https://wa.me/6281703384308?text=Halo',
    );

    // Clipboard failure shows clean manual copy fallback message
    fireEvent.click(
      screen.getByRole('button', { name: CLASSES_COPY.COPY_MESSAGE_CTA }),
    );
    await waitFor(() => {
      expect(screen.getByText(CLASSES_COPY.COPY_FAILURE)).toBeInTheDocument();
    });

    // Editing attendeeCount clears prepared WA preview immediately
    fireEvent.change(screen.getByLabelText(/Jumlah Peserta/i), {
      target: { value: '3' },
    });
    expect(
      screen.queryByRole('link', { name: CLASSES_COPY.OPEN_WHATSAPP_CTA }),
    ).not.toBeInTheDocument();
  });
});

describe('F21 DOM AdminClassesView owner vs branch_admin behavior', () => {
  it('shows owner program controls & consent release gate and allows archiving via Dialog', async () => {
    mockArchiveProgram.mockResolvedValue({
      ok: true,
      data: { item: { ...ADMIN_PROGRAM, status: 'archived' } },
      requestId: 'r4',
    });

    renderWithQuery(
      <AdminClassesView
        profile={OWNER_PROFILE}
        initialPrograms={{ items: [ADMIN_PROGRAM] }}
        initialSessions={{ items: [ADMIN_SESSION] }}
        branches={ADMIN_BRANCHES}
      />,
    );

    expect(
      screen.getByText(ADMIN_CATALOG_COPY.CLASSES.PHOTO_CONSENT_RELEASE_GATE),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', {
        name: ADMIN_CATALOG_COPY.CLASSES.ADD_PROGRAM,
      }).length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Arsipkan/i }));
    fireEvent.click(
      screen.getByRole('button', {
        name: ADMIN_CATALOG_COPY.CLASSES.ARCHIVE_PROGRAM_SUBMIT,
      }),
    );

    await waitFor(() => {
      expect(mockArchiveProgram).toHaveBeenCalledWith(PROGRAM_ID, {
        expectedUpdatedAt: ADMIN_PROGRAM.updatedAt,
      });
    });
  });

  it('locks program management and priceOverrideIdr for branch_admin and omits priceOverrideIdr from session payload', async () => {
    mockCreateSession.mockResolvedValue({
      ok: true,
      data: { item: ADMIN_SESSION },
      requestId: 'r5',
    });

    renderWithQuery(
      <AdminClassesView
        profile={STAFF_PROFILE}
        initialPrograms={{ items: [ADMIN_PROGRAM] }}
        initialSessions={{ items: [ADMIN_SESSION] }}
        branches={[ADMIN_BRANCHES[0]]}
      />,
    );

    expect(
      screen.getByText(ADMIN_CATALOG_COPY.CLASSES.STAFF_PRICE_LOCK_NOTE),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: ADMIN_CATALOG_COPY.CLASSES.ADD_PROGRAM,
      }),
    ).toBeNull();

    fireEvent.click(
      screen.getAllByRole('button', {
        name: ADMIN_CATALOG_COPY.CLASSES.ADD_SESSION,
      })[0],
    );

    const priceOverrideInput = screen.getByLabelText(/Override Harga/i);
    expect(priceOverrideInput).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Buat Sesi Cabang/i }));

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledTimes(1);
    });
    const sentPayload = mockCreateSession.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(sentPayload.branchId).toBe(BRANCH_SBY_ID);
    expect('priceOverrideIdr' in sentPayload).toBe(false);
  });
});
