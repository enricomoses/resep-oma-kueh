'use client';

import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { AUTH_COPY } from '@/constants/auth.constant';
import type { PasswordResetRequest } from '@/types/auth';
import { cn } from '@/utils';

interface AdminResetRequestFormProps {
  form: UseFormReturn<PasswordResetRequest>;
  isSubmitting: boolean;
  onSubmit: (values: PasswordResetRequest) => Promise<void>;
  onSwitchToLogin: () => void;
  className?: string;
}

/** Password-reset email request form inside the admin login card. */
export function AdminResetRequestForm({
  form,
  isSubmitting,
  onSubmit,
  onSwitchToLogin,
  className,
}: AdminResetRequestFormProps) {
  return (
    <form
      key="reset-form"
      className={cn('admin-auth-form', className)}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <FormField
        id="admin-reset-email"
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

      <div className="admin-auth-actions">
        <Button
          type="submit"
          loading={isSubmitting}
          loadingLabel={AUTH_COPY.SUBMITTING_RESET_REQUEST}
        >
          {AUTH_COPY.SUBMIT_RESET_REQUEST}
        </Button>

        <button
          type="button"
          className="ui-link admin-auth-mode-toggle"
          onClick={onSwitchToLogin}
        >
          {AUTH_COPY.BACK_TO_LOGIN}
        </button>
      </div>
    </form>
  );
}
