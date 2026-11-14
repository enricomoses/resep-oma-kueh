'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, KeyRound } from 'lucide-react';
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
import { useUpdatePassword } from '@/hooks/use-admin-auth';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminSessionProfile,
  AuthErrorReason,
  UpdatePasswordFormValues,
} from '@/types/auth';
import { cn } from '@/utils';
import { updatePasswordFormSchema } from '@/validations/auth.schema';

interface AdminResetPasswordViewProps {
  hasValidRecoverySession: boolean;
  errorReason?: AuthErrorReason | null;
  profile?: AdminSessionProfile | null;
  className?: string;
}

export function AdminResetPasswordView({
  hasValidRecoverySession,
  errorReason,
  profile,
  className,
}: AdminResetPasswordViewProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [updatedSuccess, setUpdatedSuccess] = useState(false);

  const updateMutation = useUpdatePassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const invalidBanner = errorReason
    ? AUTH_COPY.LOGIN_ERROR_BANNERS[errorReason]
    : {
        title: AUTH_COPY.RECOVERY_REQUIRED_TITLE,
        body: AUTH_COPY.RECOVERY_REQUIRED_BODY,
      };

  async function onSubmit(values: UpdatePasswordFormValues) {
    setServerError(null);
    try {
      const result = await updateMutation.mutateAsync({
        password: values.password,
      });
      setUpdatedSuccess(true);
      router.replace(result.data.redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fieldErrors?.password?.[0]) {
          setError('password', { message: err.fieldErrors.password[0] });
        }
        setServerError(err.message);
        return;
      }
      setServerError(AUTH_COPY.ERROR_RECOVERY_SESSION);
    }
  }

  return (
    <section className={cn('admin-auth-page', className)}>
      <div className="content-container admin-auth-container">
        <div className="admin-auth-top-link">
          <ActionLink href={ROUTES.ADMIN_LOGIN} variant="text">
            <ArrowLeft size={16} aria-hidden="true" />
            {AUTH_COPY.BACK_TO_LOGIN}
          </ActionLink>
        </div>

        <Card className="admin-auth-card" tone="surface">
          <header className="admin-auth-header">
            <span className="admin-auth-icon" aria-hidden="true">
              <KeyRound size={22} />
            </span>
            <div>
              <h1 className="admin-auth-title">
                {AUTH_COPY.RESET_PAGE_HEADING}
              </h1>
              <p className="admin-auth-subtitle">
                {AUTH_COPY.RESET_PAGE_SUBTITLE}
              </p>
            </div>
          </header>

          {!hasValidRecoverySession ? (
            <div className="admin-auth-invalid-block">
              <Feedback tone="error" title={invalidBanner.title} announce>
                <p>{invalidBanner.body}</p>
              </Feedback>
              <ActionLink href={ROUTES.ADMIN_LOGIN} variant="primary">
                {AUTH_COPY.BACK_TO_LOGIN}
              </ActionLink>
            </div>
          ) : (
            <>
              {profile ? (
                <p className="admin-auth-identity-note">
                  Akun terverifikasi: <strong>{profile.displayName}</strong>
                  {profile.email ? ` (${profile.email})` : ''}
                </p>
              ) : null}

              {serverError ? (
                <Feedback tone="error" title={serverError} announce />
              ) : null}

              {updatedSuccess ? (
                <Feedback
                  tone="success"
                  title={AUTH_COPY.UPDATE_PASSWORD_SUCCESS}
                  announce
                />
              ) : null}

              <form
                className="admin-auth-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <FormField
                  id="admin-new-password"
                  label={AUTH_COPY.NEW_PASSWORD_LABEL}
                  helper={AUTH_COPY.NEW_PASSWORD_HELPER}
                  error={errors.password?.message}
                  required
                >
                  {(fieldProps) => (
                    <Input
                      {...fieldProps}
                      type="password"
                      autoComplete="new-password"
                      {...register('password')}
                    />
                  )}
                </FormField>

                <FormField
                  id="admin-confirm-password"
                  label={AUTH_COPY.PASSWORD_CONFIRM_LABEL}
                  error={errors.confirmPassword?.message}
                  required
                >
                  {(fieldProps) => (
                    <Input
                      {...fieldProps}
                      type="password"
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                    />
                  )}
                </FormField>

                <div className="admin-auth-actions">
                  <Button
                    type="submit"
                    loading={isSubmitting || updateMutation.isPending}
                    loadingLabel={AUTH_COPY.SUBMITTING_UPDATE_PASSWORD}
                  >
                    {AUTH_COPY.SUBMIT_UPDATE_PASSWORD}
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
