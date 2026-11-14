'use client';

import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { AUTH_COPY } from '@/constants/auth.constant';
import type { LoginRequest } from '@/types/auth';
import { cn } from '@/utils';

interface AdminLoginFormProps {
  form: UseFormReturn<LoginRequest>;
  isSubmitting: boolean;
  onSubmit: (values: LoginRequest) => Promise<void>;
  onSwitchToReset: () => void;
  className?: string;
}

/** Credentials form for signing in to the admin workspace. */
export function AdminLoginForm({
  form,
  isSubmitting,
  onSubmit,
  onSwitchToReset,
  className,
}: AdminLoginFormProps) {
  return (
    <form
      key="login-form"
      className={cn('admin-auth-form', className)}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <FormField
        id="admin-login-email"
        label={AUTH_COPY.EMAIL_LABEL}
        error={form.formState.errors.email?.message}
        required
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="email"
            autoComplete="username"
            placeholder={AUTH_COPY.EMAIL_PLACEHOLDER}
            {...form.register('email')}
          />
        )}
      </FormField>

      <FormField
        id="admin-login-password"
        label={AUTH_COPY.PASSWORD_LABEL}
        error={form.formState.errors.password?.message}
        required
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        )}
      </FormField>

      <div className="admin-auth-actions">
        <Button
          type="submit"
          loading={isSubmitting}
          loadingLabel={AUTH_COPY.SUBMITTING_LOGIN}
        >
          {AUTH_COPY.SUBMIT_LOGIN}
        </Button>

        <button
          type="button"
          className="ui-link admin-auth-mode-toggle"
          onClick={onSwitchToReset}
        >
          {AUTH_COPY.FORGOT_PASSWORD_TOGGLE}
        </button>
      </div>
    </form>
  );
}
