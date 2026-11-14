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

import { AdminShell } from '@/app/admin/(dashboard)/_components/admin-shell';
import { AdminLoginView } from '@/app/admin/login/_components/admin-login-view';
import { AdminResetPasswordView } from '@/app/admin/reset-password/_components/admin-reset-password-view';
import { AUTH_COPY } from '@/constants/auth.constant';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { ROUTES } from '@/constants/routes.constant';
import { ApiClientError } from '@/lib/errors';
import * as authService from '@/services/auth.service';
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
  userId: 'f1500000-0000-4000-8000-000000000001',
  email: 'owner@example.invalid',
  displayName: 'Oma Owner',
  role: 'owner',
  branchId: null,
  branchCode: null,
  branchName: null,
};

const STAFF_PROFILE: AdminSessionProfile = {
  userId: 'f1500000-0000-4000-8000-000000000002',
  email: 'staff@example.invalid',
  displayName: 'Admin Surabaya',
  role: 'branch_admin',
  branchId: 'f0400000-0000-4000-8000-000000000001',
  branchCode: 'surabaya',
  branchName: 'Surabaya',
};

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AdminLoginView', () => {
  it('renders login without public signup and displays error banners for profile/recovery status', () => {
    const client = createTestClient();
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <AdminLoginView
          nextPath={ROUTES.ADMIN}
          initialErrorReason="profile_missing"
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(AUTH_COPY.LOGIN_ERROR_BANNERS.profile_missing.title),
    ).toBeTruthy();
    expect(screen.getByText(AUTH_COPY.NO_PUBLIC_SIGNUP_NOTE)).toBeTruthy();
    expect(screen.queryByRole('link', { name: /daftar/i })).toBeNull();

    rerender(
      <QueryClientProvider client={client}>
        <AdminLoginView
          nextPath={ROUTES.ADMIN}
          initialErrorReason="recovery_expired"
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(AUTH_COPY.LOGIN_ERROR_BANNERS.recovery_expired.title),
    ).toBeTruthy();
  });

  it('switches to reset request mode, shows generic confirmation, and wipes previous private cache on account switch', async () => {
    const client = createTestClient();
    const staleKey = [
      ...QUERY_KEYS.ADMIN_ROOT,
      'private-drafts',
      STAFF_PROFILE.userId,
    ];
    client.setQueryData(staleKey, [{ id: 'stale-item' }]);

    vi.spyOn(authService, 'requestPasswordReset').mockResolvedValue({
      ok: true,
      data: {
        accepted: true,
        message: AUTH_COPY.GENERIC_RESET_RESPONSE,
      },
      requestId: 'reset-req-1',
    });

    vi.spyOn(authService, 'loginAdminRequest').mockResolvedValue({
      ok: true,
      data: {
        profile: OWNER_PROFILE,
        redirectTo: ROUTES.ADMIN,
      },
      requestId: 'login-req-1',
    });

    render(
      <QueryClientProvider client={client}>
        <AdminLoginView nextPath={ROUTES.ADMIN} />
      </QueryClientProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: AUTH_COPY.FORGOT_PASSWORD_TOGGLE }),
    );
    fireEvent.input(screen.getByLabelText(/Email admin/i), {
      target: { value: 'owner@example.invalid' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: AUTH_COPY.SUBMIT_RESET_REQUEST }),
    );

    await waitFor(() => {
      expect(screen.getByText(AUTH_COPY.GENERIC_RESET_RESPONSE)).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole('button', { name: AUTH_COPY.BACK_TO_LOGIN }),
    );
    fireEvent.input(screen.getByLabelText(/Email admin/i), {
      target: { value: 'owner@example.invalid' },
    });
    fireEvent.input(screen.getByLabelText(/Kata sandi/i), {
      target: { value: 'synthetic-password-123' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: AUTH_COPY.SUBMIT_LOGIN }),
    );

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith(ROUTES.ADMIN);
    });

    expect(client.getQueryData(staleKey)).toBeUndefined();
    expect(
      client.getQueryData(
        QUERY_KEYS.ADMIN_SESSION({
          userId: OWNER_PROFILE.userId,
          role: OWNER_PROFILE.role,
          branchId: OWNER_PROFILE.branchId,
        }),
      ),
    ).toEqual(OWNER_PROFILE);
  });

  it('surfaces API 403 error clearly when auth user lacks active admin profile', async () => {
    const client = createTestClient();
    vi.spyOn(authService, 'loginAdminRequest').mockRejectedValue(
      new ApiClientError({
        code: 'FORBIDDEN',
        status: 403,
        message: AUTH_COPY.ERROR_PROFILE_FORBIDDEN,
      }),
    );

    render(
      <QueryClientProvider client={client}>
        <AdminLoginView nextPath={ROUTES.ADMIN} />
      </QueryClientProvider>,
    );

    fireEvent.input(screen.getByLabelText(/Email admin/i), {
      target: { value: 'noprofile@example.invalid' },
    });
    fireEvent.input(screen.getByLabelText(/Kata sandi/i), {
      target: { value: 'synthetic-password-123' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: AUTH_COPY.SUBMIT_LOGIN }),
    );

    await waitFor(() => {
      expect(screen.getByText(AUTH_COPY.ERROR_PROFILE_FORBIDDEN)).toBeTruthy();
    });
  });
});

describe('AdminResetPasswordView', () => {
  it('hides password form when recovery session is absent and validates confirmation mismatch when present', async () => {
    const client = createTestClient();
    const { rerender } = render(
      <QueryClientProvider client={client}>
        <AdminResetPasswordView
          hasValidRecoverySession={false}
          errorReason="recovery_expired"
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(AUTH_COPY.LOGIN_ERROR_BANNERS.recovery_expired.title),
    ).toBeTruthy();
    expect(screen.queryByLabelText(/Kata sandi baru/i)).toBeNull();

    const updateSpy = vi
      .spyOn(authService, 'updateAdminPasswordRequest')
      .mockResolvedValue({
        ok: true,
        data: { updated: true, redirectTo: ROUTES.ADMIN },
        requestId: 'update-req-1',
      });

    rerender(
      <QueryClientProvider client={client}>
        <AdminResetPasswordView
          hasValidRecoverySession
          profile={OWNER_PROFILE}
        />
      </QueryClientProvider>,
    );

    fireEvent.input(screen.getByLabelText(/^Kata sandi baru/i), {
      target: { value: 'new-strong-password' },
    });
    fireEvent.input(screen.getByLabelText(/Konfirmasi kata sandi baru/i), {
      target: { value: 'mismatch-password' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: AUTH_COPY.SUBMIT_UPDATE_PASSWORD }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(AUTH_COPY.VALIDATION.PASSWORD_MISMATCH),
      ).toBeTruthy();
    });
    expect(updateSpy).not.toHaveBeenCalled();

    fireEvent.input(screen.getByLabelText(/Konfirmasi kata sandi baru/i), {
      target: { value: 'new-strong-password' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: AUTH_COPY.SUBMIT_UPDATE_PASSWORD }),
    );

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        password: 'new-strong-password',
      });
      expect(navigation.replace).toHaveBeenCalledWith(ROUTES.ADMIN);
    });
  });
});

describe('AdminGuardedShell and private query cache cleanup', () => {
  it('renders identity scope and clears all private admin query keys on logout', async () => {
    const client = createTestClient();
    const sessionKey = QUERY_KEYS.ADMIN_SESSION({
      userId: STAFF_PROFILE.userId,
      role: STAFF_PROFILE.role,
      branchId: STAFF_PROFILE.branchId,
    });
    const privateBranchDataKey = [
      ...QUERY_KEYS.ADMIN_ROOT,
      'offers',
      STAFF_PROFILE.branchId,
    ];
    client.setQueryData(privateBranchDataKey, [{ sku: 'DEMO-1' }]);

    vi.spyOn(authService, 'logoutAdminRequest').mockResolvedValue({
      ok: true,
      data: { loggedOut: true },
      requestId: 'logout-req-1',
    });

    render(
      <QueryClientProvider client={client}>
        <AdminShell initialProfile={STAFF_PROFILE} />
      </QueryClientProvider>,
    );

    const sidebar = within(screen.getByLabelText('Sidebar admin'));
    expect(sidebar.getByText('Admin Surabaya')).toBeTruthy();
    expect(sidebar.getByText(/Surabaya \(surabaya\)/i)).toBeTruthy();
    expect(client.getQueryData(sessionKey)).toEqual(STAFF_PROFILE);

    fireEvent.click(
      screen.getByRole('button', { name: AUTH_COPY.SHELL.LOGOUT_BUTTON }),
    );

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith(ROUTES.ADMIN_LOGIN);
    });

    expect(client.getQueryData(sessionKey)).toBeUndefined();
    expect(client.getQueryData(privateBranchDataKey)).toBeUndefined();
  });
});
