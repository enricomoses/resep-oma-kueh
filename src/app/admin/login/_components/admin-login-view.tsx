'use client';

import { ArrowLeft, KeyRound, LockKeyhole, ShieldAlert } from 'lucide-react';

import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { AUTH_COPY } from '@/constants/auth.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useAdminLoginFlow } from '@/hooks/use-admin-login-flow';
import type { AuthErrorReason } from '@/types/auth';
import { cn } from '@/utils';

import { AdminLoginForm } from './admin-login-form';
import { AdminResetRequestForm } from './admin-reset-request-form';

interface AdminLoginViewProps {
  nextPath: string;
  initialErrorReason?: AuthErrorReason | null;
  className?: string;
}

/** Admin login & password-reset request view. */
export function AdminLoginView({
  nextPath,
  initialErrorReason,
  className,
}: AdminLoginViewProps) {
  const {
    mode,
    serverError,
    resetMessage,
    loginForm,
    resetForm,
    isLoginSubmitting,
    isResetSubmitting,
    onSubmitLogin,
    onSubmitReset,
    handleSwitchMode,
  } = useAdminLoginFlow({ nextPath });

  const bannerInfo = initialErrorReason
    ? AUTH_COPY.LOGIN_ERROR_BANNERS[initialErrorReason]
    : null;

  return (
    <section className={cn('admin-auth-page', className)}>
      <div className="content-container admin-auth-container">
        <div className="admin-auth-top-link">
          <ActionLink href={ROUTES.HOME} variant="text">
            <ArrowLeft size={16} aria-hidden="true" />
            {AUTH_COPY.SHELL.BACK_TO_STOREFRONT}
          </ActionLink>
        </div>

        <Card className="admin-auth-card" tone="surface">
          <header className="admin-auth-header">
            <span className="admin-auth-icon" aria-hidden="true">
              {mode === 'login' ? (
                <LockKeyhole size={22} />
              ) : (
                <KeyRound size={22} />
              )}
            </span>
            <div>
              <h1 className="admin-auth-title">
                {mode === 'login'
                  ? AUTH_COPY.LOGIN_HEADING
                  : AUTH_COPY.RESET_REQUEST_HEADING}
              </h1>
              <p className="admin-auth-subtitle">
                {mode === 'login'
                  ? AUTH_COPY.LOGIN_SUBTITLE
                  : AUTH_COPY.RESET_REQUEST_SUBTITLE}
              </p>
            </div>
          </header>

          {bannerInfo && mode === 'login' ? (
            <Feedback tone="error" title={bannerInfo.title} announce>
              <p>{bannerInfo.body}</p>
            </Feedback>
          ) : null}

          {serverError ? (
            <Feedback tone="error" title={serverError} announce />
          ) : null}

          {resetMessage ? (
            <Feedback tone="success" title={resetMessage} announce />
          ) : null}

          {mode === 'login' ? (
            <AdminLoginForm
              form={loginForm}
              isSubmitting={isLoginSubmitting}
              onSubmit={onSubmitLogin}
              onSwitchToReset={() => handleSwitchMode('reset')}
            />
          ) : (
            <AdminResetRequestForm
              form={resetForm}
              isSubmitting={isResetSubmitting}
              onSubmit={onSubmitReset}
              onSwitchToLogin={() => handleSwitchMode('login')}
            />
          )}

          <p className="admin-auth-notice">
            <ShieldAlert size={16} aria-hidden="true" />
            <span>{AUTH_COPY.NO_PUBLIC_SIGNUP_NOTE}</span>
          </p>
        </Card>
      </div>
    </section>
  );
}
