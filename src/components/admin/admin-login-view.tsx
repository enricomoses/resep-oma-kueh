'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, KeyRound, LockKeyhole, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { AUTH_COPY } from '@/constants/auth.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useAdminLogin, useRequestPasswordReset } from '@/hooks/use-admin-auth';
import { ApiClientError } from '@/lib/errors';
import type {
  AuthErrorReason,
  LoginRequest,
  PasswordResetRequest,
} from '@/types/auth';
import { cn } from '@/utils';
import {
  loginRequestSchema,
  passwordResetRequestSchema,
} from '@/validations/auth.schema';

interface AdminLoginViewProps {
  nextPath: string;
  initialErrorReason?: AuthErrorReason | null;
  className?: string;
}

export function AdminLoginView({
  nextPath,
  initialErrorReason,
  className,
}: AdminLoginViewProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loginMutation = useAdminLogin();
  const resetMutation = useRequestPasswordReset();

  const loginForm = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '', next: nextPath },
  });

  const resetForm = useForm<PasswordResetRequest>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
  });

  const bannerInfo = initialErrorReason
    ? AUTH_COPY.LOGIN_ERROR_BANNERS[initialErrorReason]
    : null;

  async function onSubmitLogin(values: LoginRequest) {
    setServerError(null);
    try {
      const result = await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
        next: nextPath,
      });
      router.replace(result.data.redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fieldErrors?.email?.[0]) {
          loginForm.setError('email', { message: err.fieldErrors.email[0] });
        }
        if (err.fieldErrors?.password?.[0]) {
          loginForm.setError('password', {
            message: err.fieldErrors.password[0],
          });
        }
        setServerError(err.message);
        return;
      }
      setServerError(AUTH_COPY.ERROR_INVALID_CREDENTIALS);
    }
  }

  async function onSubmitReset(values: PasswordResetRequest) {
    setServerError(null);
    setResetMessage(null);
    try {
      const result = await resetMutation.mutateAsync({ email: values.email });
      setResetMessage(result.data.message);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fieldErrors?.email?.[0]) {
          resetForm.setError('email', { message: err.fieldErrors.email[0] });
        }
        setServerError(err.message);
        return;
      }
      setServerError(AUTH_COPY.GENERIC_RESET_RESPONSE);
    }
  }

  function handleSwitchMode(targetMode: 'login' | 'reset') {
    setServerError(null);
    setResetMessage(null);
    setMode(targetMode);
  }

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
            <form
              key="login-form"
              className="admin-auth-form"
              onSubmit={loginForm.handleSubmit(onSubmitLogin)}
              noValidate
            >
              <FormField
                id="admin-login-email"
                label={AUTH_COPY.EMAIL_LABEL}
                error={loginForm.formState.errors.email?.message}
                required
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="email"
                    autoComplete="username"
                    placeholder={AUTH_COPY.EMAIL_PLACEHOLDER}
                    {...loginForm.register('email')}
                  />
                )}
              </FormField>

              <FormField
                id="admin-login-password"
                label={AUTH_COPY.PASSWORD_LABEL}
                error={loginForm.formState.errors.password?.message}
                required
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="password"
                    autoComplete="current-password"
                    {...loginForm.register('password')}
                  />
                )}
              </FormField>

              <div className="admin-auth-actions">
                <Button
                  type="submit"
                  loading={
                    loginForm.formState.isSubmitting || loginMutation.isPending
                  }
                  loadingLabel={AUTH_COPY.SUBMITTING_LOGIN}
                >
                  {AUTH_COPY.SUBMIT_LOGIN}
                </Button>

                <button
                  type="button"
                  className="ui-link admin-auth-mode-toggle"
                  onClick={() => handleSwitchMode('reset')}
                >
                  {AUTH_COPY.FORGOT_PASSWORD_TOGGLE}
                </button>
              </div>
            </form>
          ) : (
            <form
              key="reset-form"
              className="admin-auth-form"
              onSubmit={resetForm.handleSubmit(onSubmitReset)}
              noValidate
            >
              <FormField
                id="admin-reset-email"
                label={AUTH_COPY.EMAIL_LABEL}
                error={resetForm.formState.errors.email?.message}
                required
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="email"
                    autoComplete="username"
                    placeholder={AUTH_COPY.EMAIL_PLACEHOLDER}
                    {...resetForm.register('email')}
                  />
                )}
              </FormField>

              <div className="admin-auth-actions">
                <Button
                  type="submit"
                  loading={
                    resetForm.formState.isSubmitting || resetMutation.isPending
                  }
                  loadingLabel={AUTH_COPY.SUBMITTING_RESET_REQUEST}
                >
                  {AUTH_COPY.SUBMIT_RESET_REQUEST}
                </Button>

                <button
                  type="button"
                  className="ui-link admin-auth-mode-toggle"
                  onClick={() => handleSwitchMode('login')}
                >
                  {AUTH_COPY.BACK_TO_LOGIN}
                </button>
              </div>
            </form>
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
