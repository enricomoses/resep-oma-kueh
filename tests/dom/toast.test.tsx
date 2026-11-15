import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast } from 'react-toastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastMessage } from '@/components/common/feedback/toast-message';
import {
  dismissToast,
  notifyError,
  notifyInfo,
  notifySuccess,
  notifyWarning,
} from '@/lib/toast';
import { ToastProvider } from '@/providers/toast-provider';

afterEach(() => {
  toast.dismiss();
  toast.clearWaitingQueue();
  cleanup();
});

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

describe('Bakery Toastify integration', () => {
  it('mounts ToastProvider with the themed bakery wrapper and renders children', () => {
    const { container } = render(
      <ToastProvider>
        <p>Konten halaman aktif</p>
      </ToastProvider>,
    );

    expect(screen.getByText('Konten halaman aktif')).toBeInTheDocument();
    expect(container.querySelector('.Toastify')).toBeInTheDocument();
  });

  it('renders semantic bakery toasts for success, error, info, and warning', async () => {
    const { container } = render(<ToastProvider />);

    notifySuccess('Perubahan disimpan.');
    notifyError('Gagal memproses permintaan.');
    notifyInfo('Cabang diganti ke Surabaya.');
    notifyWarning('Perhatian stok terbatas.');

    await waitFor(() => {
      expect(screen.getByText('Perubahan disimpan.')).toBeInTheDocument();
      expect(
        screen.getByText('Gagal memproses permintaan.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Cabang diganti ke Surabaya.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Perhatian stok terbatas.')).toBeInTheDocument();
    });

    expect(container.querySelector('.bakery-toast--success')).toBeTruthy();
    expect(container.querySelector('.bakery-toast--error')).toBeTruthy();
    expect(container.querySelector('.bakery-toast--info')).toBeTruthy();
    expect(container.querySelector('.bakery-toast--warning')).toBeTruthy();
  });

  it('renders structured ToastMessage content with optional CTA action and dismisses on close button', async () => {
    render(<ToastProvider />);
    const handleAction = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      dismissToast('cart-added');
    });

    notifySuccess(
      <ToastMessage
        title="Item disiapkan untuk keranjang!"
        description="Bika Ambon Mini"
        meta="2 unit"
        actionHref="/cart?branch=surabaya"
        actionLabel="Lihat Keranjang"
        onAction={handleAction}
      />,
      { toastId: 'cart-added' },
    );

    const actionLink = await screen.findByRole('link', {
      name: 'Lihat Keranjang',
    });
    expect(actionLink).toHaveAttribute('href', '/cart?branch=surabaya');
    expect(screen.getByText('Bika Ambon Mini')).toBeInTheDocument();
    expect(screen.getByText('2 unit')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Tutup notifikasi' });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(actionLink);
    expect(handleAction).toHaveBeenCalledTimes(1);

    fireEvent.click(closeBtn);
    const toastNode = closeBtn.closest('[role="alert"], .bakery-toast');
    expect(toastNode).toBeTruthy();

    await waitFor(() => {
      expect(toastNode).toHaveAttribute('data-in', 'false');
    });

    if (toastNode) {
      fireEvent.animationEnd(toastNode);
    }

    await waitFor(() => {
      expect(
        screen.queryByText('Item disiapkan untuk keranjang!'),
      ).not.toBeInTheDocument();
    });
  });

  it('updates an active toast in-place when invoked with the same toastId', async () => {
    render(<ToastProvider />);

    notifyInfo('Sedang menyalin pesan...', { toastId: 'copy-status' });
    expect(
      await screen.findByText('Sedang menyalin pesan...'),
    ).toBeInTheDocument();

    notifySuccess('Pesan berhasil disalin.', { toastId: 'copy-status' });

    await waitFor(() => {
      expect(screen.getByText('Pesan berhasil disalin.')).toBeInTheDocument();
      expect(
        screen.queryByText('Sedang menyalin pesan...'),
      ).not.toBeInTheDocument();
    });
  });
});
