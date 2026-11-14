import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AskOmaWidget } from '@/components/common/chat/ask-oma-widget';
import { CHAT_COPY } from '@/constants/chat.constant';
import { ApiClientError } from '@/lib/errors';
import { ReactQueryProvider } from '@/providers';
import { BranchProvider } from '@/providers/branch-provider';
import type { PublicBranch } from '@/types/branch';
import type { ChatResponseData } from '@/types/chat';

const SURABAYA_BRANCH: PublicBranch = {
  id: 'f0400000-0000-4000-8000-000000000001',
  code: 'surabaya',
  name: 'Surabaya',
  city: 'Surabaya',
  whatsappNumber: '6281703384308',
  address: 'Rungkut Asri Tengah V No. 22, Surabaya',
  mapsUrl: null,
};

const BINTARO_BRANCH: PublicBranch = {
  id: 'f0400000-0000-4000-8000-000000000002',
  code: 'bintaro',
  name: 'Bintaro',
  city: 'Tangerang Selatan',
  whatsappNumber: '6285119785194',
  address: null,
  mapsUrl: null,
};

const mockSendChat = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/menu',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/services/chat.service', () => ({
  sendChatMessageRequest: (...args: unknown[]) => mockSendChat(...args),
}));

function installMatchMedia(matchesMobile: boolean) {
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('767px') ? matchesMobile : false,
    media: query,
    addEventListener: (_ev: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_ev: string, cb: () => void) => listeners.delete(cb),
    dispatchEvent: () => true,
  }));
}

function makeChatReply(overrides: Partial<ChatResponseData> = {}): {
  ok: true;
  data: ChatResponseData;
  requestId: string;
} {
  return {
    ok: true,
    requestId: 'chat-req-1',
    data: {
      answer: 'Ada Coffee Chiffon seharga Rp 18.000 di cabang Surabaya.',
      items: [
        {
          type: 'product',
          slug: 'coffee-chiffon',
          href: '/menu/coffee-chiffon?branch=surabaya',
          label: 'Coffee Chiffon',
          subtitle: 'Slice · Tersedia',
          priceLabel: 'Rp 18.000',
        },
      ],
      sourceType: 'catalog',
      operation: 'recommend_by_budget',
      branchId: SURABAYA_BRANCH.id,
      branchName: 'Surabaya',
      notice: CHAT_COPY.DEFAULT_CATALOG_NOTICE,
      coverage: { totalMatched: 1, returned: 1, truncated: false },
      ...overrides,
    },
  };
}

function renderWithBranch(
  initialSelectedId: string | null = SURABAYA_BRANCH.id,
) {
  if (initialSelectedId) {
    localStorage.setItem(
      'rok-branch',
      JSON.stringify({
        state: { selectedBranchId: initialSelectedId },
        version: 1,
      }),
    );
  }
  return render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: {
            items: [SURABAYA_BRANCH, BINTARO_BRANCH],
            resolvedBranchId: null,
          },
        }}
      >
        <AskOmaWidget />
      </BranchProvider>
    </ReactQueryProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  mockSendChat.mockReset();
  installMatchMedia(false);
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', 'true');
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(
    this: HTMLDialogElement,
  ) {
    this.removeAttribute('open');
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('F22 AskOmaWidget DOM, keyboard/IME, abort/generation lock, branch change & fallback', () => {
  it('opens desktop nonmodal panel, handles Enter vs Shift+Enter & IME composition, and prevents double send', async () => {
    let resolvePending!: (val: ReturnType<typeof makeChatReply>) => void;
    mockSendChat.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePending = resolve;
        }),
    );

    renderWithBranch(SURABAYA_BRANCH.id);
    fireEvent.click(
      screen.getByRole('button', { name: CHAT_COPY.TRIGGER_OPEN }),
    );

    expect(
      screen.getByRole('region', { name: CHAT_COPY.PANEL_LABEL }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();

    const textarea = screen.getByLabelText(
      CHAT_COPY.COMPOSER_LABEL,
    ) as HTMLTextAreaElement;

    // Shift+Enter should NOT send
    fireEvent.change(textarea, { target: { value: 'Baris 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(mockSendChat).not.toHaveBeenCalled();

    // IME composition should NOT send
    fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true });
    expect(mockSendChat).not.toHaveBeenCalled();

    // Regular Enter sends and activates synchronous busy lock blocking duplicate sends
    fireEvent.change(textarea, {
      target: { value: 'Chiffon di bawah 20 ribu' },
    });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(mockSendChat).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByRole('button', { name: CHAT_COPY.SEND_CTA }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: CHAT_COPY.STOP_CTA }),
    ).toBeEnabled();
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(mockSendChat).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePending(makeChatReply());
    });

    expect(
      await screen.findByText(/Coffee Chiffon seharga Rp 18.000/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Coffee Chiffon/i }),
    ).toHaveAttribute('href', '/menu/coffee-chiffon?branch=surabaya');
  });

  it('aborts pending request on Reset chat so stale late response is discarded', async () => {
    let capturedSignal: AbortSignal | undefined;
    let resolveLate!: (val: ReturnType<typeof makeChatReply>) => void;

    mockSendChat.mockImplementation(
      (_payload: unknown, signal?: AbortSignal) => {
        capturedSignal = signal;
        return new Promise((resolve) => {
          resolveLate = resolve;
        });
      },
    );

    renderWithBranch(SURABAYA_BRANCH.id);
    fireEvent.click(
      screen.getByRole('button', { name: CHAT_COPY.TRIGGER_OPEN }),
    );

    const textarea = screen.getByLabelText(CHAT_COPY.COMPOSER_LABEL);
    fireEvent.change(textarea, { target: { value: 'Promo aktif' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(capturedSignal?.aborted).toBe(false);

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(`^${CHAT_COPY.STOP_CTA}$`),
      }),
    );
    expect(capturedSignal?.aborted).toBe(true);

    await act(async () => {
      resolveLate(makeChatReply({ answer: 'Stale reply must never render' }));
    });

    expect(
      screen.queryByText(/Stale reply must never render/),
    ).not.toBeInTheDocument();
  });

  it('renders mobile modal drawer semantics via ModalSurface and recovers safely from DB 503 outage with WA fallback', async () => {
    installMatchMedia(true);
    mockSendChat.mockRejectedValue(
      new ApiClientError({
        code: 'UPSTREAM_ERROR',
        message: CHAT_COPY.OUTAGE_MESSAGE,
        status: 503,
      }),
    );

    renderWithBranch(SURABAYA_BRANCH.id);
    fireEvent.click(
      screen.getByRole('button', { name: CHAT_COPY.TRIGGER_OPEN }),
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Ada promo aktif apa sekarang?' }),
    );

    expect(
      await screen.findByText(CHAT_COPY.OUTAGE_MESSAGE),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'WhatsApp Surabaya' }),
    ).toHaveAttribute('href', 'https://wa.me/6281703384308');
  });
});
