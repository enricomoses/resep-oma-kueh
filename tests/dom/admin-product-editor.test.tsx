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

import { AdminProductEditorView } from '@/app/admin/(dashboard)/products/[id]/edit/_components/admin-product-editor-view';
import { ApiClientError } from '@/lib/errors';
import type { AdminProductEditorAggregate } from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';

const saveMock = vi.fn();
const uploadMock = vi.fn();

vi.mock('@/services/admin-catalog.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/admin-catalog.service')>();
  return {
    ...actual,
    saveAdminProductConfigurationRequest: (...args: unknown[]) =>
      saveMock(...args),
    uploadAdminProductMediaRequest: (...args: unknown[]) => uploadMock(...args),
    readAdminProductEditorRequest: vi.fn(async () => ({
      ok: true,
      data: {
        product: baseAggregate.product,
        editor: baseAggregate,
      },
      requestId: 'req-refetch',
    })),
  };
});

const ownerProfile: AdminSessionProfile = {
  userId: 'f1700000-0000-4000-8000-000000000001',
  email: 'owner@resepomakueh.example',
  displayName: 'Owner Oma',
  role: 'owner',
  branchId: null,
  branchCode: null,
  branchName: null,
};

const PROD_ID = 'a1700000-0000-4000-8000-000000000001';
const CAT_PUB_ID = 'c1700000-0000-4000-8000-000000000001';
const VAR_ID = 'b1700000-0000-4000-8000-000000000001';
const GF_TAG_ID = 'd1700000-0000-4000-8000-000000000001';

const baseAggregate: AdminProductEditorAggregate = {
  product: {
    id: PROD_ID,
    name: 'Chiffon Pandan',
    slug: 'chiffon-pandan',
    shortDescription: 'Lembut harum pandan asli.',
    description: 'Panggang segar setiap pagi.',
    ingredientsInfo: null,
    storageInstructions: null,
    productType: 'simple',
    isFeatured: false,
    isBestSeller: false,
    isNew: true,
    status: 'draft',
    needsOwnerReview: true,
    sortOrder: 10,
    createdAt: '2026-11-11T00:00:00Z',
    updatedAt: '2026-11-12T00:00:00Z',
    categories: [
      {
        id: CAT_PUB_ID,
        name: 'Chiffon Cake',
        slug: 'chiffon-cake',
        status: 'published',
        isPrimary: true,
      },
    ],
    readiness: {
      hasPublishedCategory: true,
      activeVariantCount: 1,
      hasActiveBranchOffer: true,
      approvedImageCount: 0,
      needsOwnerReview: true,
      isPublishReady: false,
      missingReasons: [],
    },
  },
  categories: [{ categoryId: CAT_PUB_ID, isPrimary: true }],
  variants: [
    {
      id: VAR_ID,
      sku: 'ROK-PANDAN-20',
      name: '20 cm',
      sizeLabel: '20 cm',
      basePriceIdr: 135_000,
      status: 'active',
      sortOrder: 10,
      maxQuantityPerOrder: 99,
      isDefault: true,
      bundleRecipe: null,
      bundleUnitsTotal: null,
      bundleRulesVerified: false,
      branchOfferCount: 1,
      fixedComponents: [],
      optionGroups: [],
      dietaryTags: [
        {
          dietaryTagId: GF_TAG_ID,
          verificationStatus: 'pending',
          verifiedAt: null,
          note: null,
        },
      ],
      allergens: [],
    },
  ],
  images: [],
  referenceData: {
    categories: [
      {
        id: CAT_PUB_ID,
        name: 'Chiffon Cake',
        slug: 'chiffon-cake',
        parentId: null,
        parentName: null,
        description: null,
        sortOrder: 10,
        status: 'published',
        childCount: 0,
        productRefCount: 1,
        createdAt: '2026-11-11T00:00:00Z',
        updatedAt: '2026-11-11T00:00:00Z',
      },
    ],
    dietaryTags: [
      {
        id: GF_TAG_ID,
        slug: 'gluten-free',
        name: 'Gluten-Free',
        description: null,
      },
    ],
    allergens: [
      {
        id: 'e1700000-0000-4000-8000-000000000001',
        slug: 'egg',
        name: 'Telur',
      },
    ],
    componentVariants: [],
  },
};

function renderWithQuery(children: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
  );
}

describe('AdminProductEditorView', () => {
  beforeEach(() => {
    saveMock.mockReset();
    uploadMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps persisted SKU immutable, updates live preview price, and blocks verified dietary claim without evidence note', async () => {
    renderWithQuery(
      <AdminProductEditorView
        profile={ownerProfile}
        productId={PROD_ID}
        initialAggregate={baseAggregate}
      />,
    );

    const skuInput = screen.getByDisplayValue('ROK-PANDAN-20');
    expect(skuInput).toBeDisabled();

    // Initial live preview uses basePriceIdr 135.000
    expect(screen.getByText(/135\.000/)).toBeInTheDocument();

    // Change price in variant editor -> live MenuProductCard preview updates immediately via shared calculator
    const priceInput = screen.getByDisplayValue('135000');
    fireEvent.change(priceInput, { target: { value: '160000' } });
    expect(screen.getByText(/160\.000/)).toBeInTheDocument();

    // Switch dietary verification status to verified WITHOUT evidence note -> submit catches missing evidence cleanly
    const verifySelect = screen.getByDisplayValue(
      'Pending / Belum Terverifikasi',
    );
    fireEvent.change(verifySelect, { target: { value: 'verified' } });

    fireEvent.click(
      screen.getByRole('button', { name: /Simpan Konfigurasi Draf/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Konfigurasi produk belum valid/i),
      ).toBeInTheDocument();
    });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('surfaces 409 concurrency conflict reload banner from server save', async () => {
    saveMock.mockRejectedValueOnce(
      new ApiClientError({
        message:
          'Produk ini telah diubah oleh sesi lain. Muat ulang data sebelum menyimpan kembali.',
        status: 409,
        code: 'CONFLICT',
      }),
    );

    renderWithQuery(
      <AdminProductEditorView
        profile={ownerProfile}
        productId={PROD_ID}
        initialAggregate={baseAggregate}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Simpan Konfigurasi Draf/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Produk ini telah diubah oleh sesi lain/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getAllByRole('button', { name: /Muat Ulang Data Terbaru/i })
        .length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders bundle 12-slice customizer section when productType switches to bundle and soft-archives variants', () => {
    renderWithQuery(
      <AdminProductEditorView
        profile={ownerProfile}
        productId={PROD_ID}
        initialAggregate={baseAggregate}
      />,
    );

    const typeSelect = screen.getByDisplayValue('Tunggal (1 SKU)');
    fireEvent.change(typeSelect, { target: { value: 'bundle' } });

    expect(
      screen.getByText(/Komposisi Paket Chiffon Slice Mix \(12 Potong\)/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Arsipkan Varian/i }));
    expect(screen.getByText('archived')).toBeInTheDocument();
  });
});
