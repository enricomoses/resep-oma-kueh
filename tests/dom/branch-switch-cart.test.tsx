import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BranchSelector } from '@/components/site/branch-selector';
import { SITE_COPY } from '@/constants/site.constant';
import { ReactQueryProvider } from '@/providers';
import { BranchProvider } from '@/providers/branch-provider';
import { useCartStore } from '@/stores/cart.store';

const { navigation, branchSurabaya, branchBintaro } = vi.hoisted(() => ({
  navigation: { replace: vi.fn() },
  branchSurabaya: {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsappNumber: '6281703384308',
    address: 'Jl. Rungkut Mapan',
    mapsUrl: null,
  },
  branchBintaro: {
    id: '22222222-2222-4222-8222-222222222222',
    code: 'bintaro',
    name: 'Bintaro',
    city: 'Tangerang Selatan',
    whatsappNumber: '6281299990001',
    address: null,
    mapsUrl: null,
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/menu',
  useSearchParams: () => new URLSearchParams('category=bread'),
  useRouter: () => navigation,
}));

vi.mock('@/services/branches.service', () => ({
  readBranches: vi.fn().mockResolvedValue({
    ok: true,
    data: {
      items: [branchSurabaya, branchBintaro],
      resolvedBranchId: null,
    },
    requestId: 'test-branches',
  }),
}));

describe('Branch Switch with Non-Empty Cart Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'rok-branch',
      JSON.stringify({
        state: { selectedBranchId: branchSurabaya.id },
        version: 1,
      }),
    );
    useCartStore.getState().clearCart();
    useCartStore.getState().setBranch(branchSurabaya.id, branchSurabaya.code);
    useCartStore.getState().setHydrated(true);

    // Add 1 line to cart
    useCartStore.getState().addLine({
      branchId: branchSurabaya.id,
      branchCode: branchSurabaya.code,
      variantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      quantity: 2,
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    navigation.replace.mockClear();
  });

  it('prompts confirmation dialog when user switches branch with a non-empty cart', async () => {
    render(
      <ReactQueryProvider>
        <BranchProvider
          initial={{
            status: 'success',
            data: {
              items: [branchSurabaya, branchBintaro],
              resolvedBranchId: branchSurabaya.id,
            },
          }}
        >
          <BranchSelector />
        </BranchProvider>
      </ReactQueryProvider>,
    );

    // Wait for hydration and Surabaya selection
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue(branchSurabaya.id);
    });
    const select = screen.getByRole('combobox');

    // Change branch to Bintaro
    fireEvent.change(select, { target: { value: branchBintaro.id } });

    // Confirmation dialog should open
    await waitFor(() => {
      expect(screen.getByText(SITE_COPY.SWITCH_TITLE)).toBeInTheDocument();
      expect(screen.getByText(SITE_COPY.SWITCH_BODY)).toBeInTheDocument();
    });

    // Verify cart was not modified or cleared
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().branchId).toBe(branchSurabaya.id);
  });

  it('cancels branch switch when clicking Cancel button and retains existing branch and cart', async () => {
    render(
      <ReactQueryProvider>
        <BranchProvider
          initial={{
            status: 'success',
            data: {
              items: [branchSurabaya, branchBintaro],
              resolvedBranchId: branchSurabaya.id,
            },
          }}
        >
          <BranchSelector />
        </BranchProvider>
      </ReactQueryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue(branchSurabaya.id);
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: branchBintaro.id } });

    await waitFor(() => {
      expect(screen.getByText(SITE_COPY.SWITCH_TITLE)).toBeInTheDocument();
    });

    // Click Cancel ("Tetap di cabang ini")
    const cancelBtn = screen.getByRole('button', { name: SITE_COPY.CANCEL });
    fireEvent.click(cancelBtn);

    // Dialog closes
    await waitFor(() => {
      const dialog = document.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    // Cart and branch intact
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().branchId).toBe(branchSurabaya.id);
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('confirms branch switch, updates cart branch, and keeps items without silently deleting them', async () => {
    render(
      <ReactQueryProvider>
        <BranchProvider
          initial={{
            status: 'success',
            data: {
              items: [branchSurabaya, branchBintaro],
              resolvedBranchId: branchSurabaya.id,
            },
          }}
        >
          <BranchSelector />
        </BranchProvider>
      </ReactQueryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue(branchSurabaya.id);
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: branchBintaro.id } });

    await waitFor(() => {
      expect(screen.getByText(SITE_COPY.SWITCH_TITLE)).toBeInTheDocument();
    });

    // Click Continue ("Periksa dan lanjutkan")
    const continueBtn = screen.getByRole('button', {
      name: SITE_COPY.SWITCH_CONTINUE,
    });
    fireEvent.click(continueBtn);

    // Dialog closes
    await waitFor(() => {
      const dialog = document.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    // Cart branch updated to Bintaro, lines retained!
    expect(useCartStore.getState().branchId).toBe(branchBintaro.id);
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0].branchId).toBe(branchBintaro.id);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);

    // Navigation replaced with new branch
    expect(navigation.replace).toHaveBeenCalled();
  });
});
