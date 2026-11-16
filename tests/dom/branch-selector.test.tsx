import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BranchSelector } from '@/components/common/branch/branch-selector';
import { SITE_COPY } from '@/constants/site.constant';
import { ApiClientError } from '@/lib/errors';
import { BranchProvider } from '@/providers/branch-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { branchesService } from '@/services/branches.service';
import type { BranchInitial } from '@/types/branch';

const { mockSearchParams, branchSurabaya } = vi.hoisted(() => ({
  mockSearchParams: { value: '' },
  branchSurabaya: {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'surabaya',
    name: 'Surabaya',
    city: 'Surabaya',
    whatsappNumber: '6281703384308',
    address: 'Jl. Rungkut Mapan',
    mapsUrl: null,
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(mockSearchParams.value),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/services/branches.service', () => ({
  branchesService: {
    getAll: vi.fn(),
  },
}));

function renderBranchSelector(initial: BranchInitial) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ToastProvider>
          <BranchProvider initial={initial}>{children}</BranchProvider>
        </ToastProvider>
      </QueryClientProvider>
    );
  }

  return render(<BranchSelector />, { wrapper: Wrapper });
}

describe('BranchSelector error and toast behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    mockSearchParams.value = '';
    vi.mocked(branchesService.getAll).mockReset();
  });

  afterEach(() => {
    toast.dismiss();
    toast.clearWaitingQueue();
    cleanup();
    localStorage.clear();
  });

  it('renders only the simple retry button in navbar and shows error via Toastify when branch fetch fails', async () => {
    vi.mocked(branchesService.getAll)
      .mockRejectedValueOnce(new ApiClientError({ code: 'UPSTREAM_ERROR' }))
      .mockResolvedValueOnce({
        ok: true,
        data: {
          items: [branchSurabaya],
          resolvedBranchId: null,
        },
        requestId: 'retry-success',
      });

    const { container } = renderBranchSelector({ status: 'error' });

    const retryButton = await screen.findByRole('button', {
      name: SITE_COPY.RETRY,
    });
    expect(retryButton).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    const selectorRoot = container.querySelector('.branch-selector');
    expect(selectorRoot).not.toHaveTextContent(SITE_COPY.BRANCH_ERROR);

    await waitFor(() => {
      expect(screen.getByText(SITE_COPY.BRANCH_ERROR)).toBeInTheDocument();
    });
    expect(container.querySelector('.bakery-toast--error')).toBeTruthy();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: SITE_COPY.RETRY }),
    ).not.toBeInTheDocument();
  });

  it('shows warning via Toastify for empty branch list without inline navbar text', async () => {
    mockSearchParams.value = 'branch=empty-fixture';
    vi.mocked(branchesService.getAll).mockResolvedValue({
      ok: true,
      data: {
        items: [],
        resolvedBranchId: null,
      },
      requestId: 'empty-branches',
    });

    const { container } = renderBranchSelector({
      status: 'success',
      data: { items: [branchSurabaya], resolvedBranchId: null },
    });

    await waitFor(() => {
      expect(screen.getByText(SITE_COPY.BRANCH_EMPTY)).toBeInTheDocument();
    });

    expect(container.querySelector('.bakery-toast--warning')).toBeTruthy();
    const selectorRoot = container.querySelector('.branch-selector');
    expect(selectorRoot).not.toHaveTextContent(SITE_COPY.BRANCH_EMPTY);
    expect(
      screen.queryByRole('button', { name: SITE_COPY.RETRY }),
    ).not.toBeInTheDocument();
  });

  it('shows warning via Toastify for invalid URL branch without inline navbar text', async () => {
    mockSearchParams.value = 'branch=retired-fixture';
    vi.mocked(branchesService.getAll).mockResolvedValue({
      ok: true,
      data: {
        items: [branchSurabaya],
        resolvedBranchId: null,
      },
      requestId: 'invalid-branch',
    });

    const { container } = renderBranchSelector({
      status: 'success',
      data: { items: [branchSurabaya], resolvedBranchId: null },
    });

    await waitFor(() => {
      expect(screen.getByText(SITE_COPY.BRANCH_INVALID)).toBeInTheDocument();
    });

    expect(container.querySelector('.bakery-toast--warning')).toBeTruthy();
    const selectorRoot = container.querySelector('.branch-selector');
    expect(selectorRoot).not.toHaveTextContent(SITE_COPY.BRANCH_INVALID);
  });
});
