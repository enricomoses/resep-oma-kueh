'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AUTH_COPY } from '@/constants/auth.constant';
import { ApiClientError } from '@/lib/errors';
import type { LoginRequest, PasswordResetRequest } from '@/types/auth';
import {
  loginRequestSchema,
  passwordResetRequestSchema,
} from '@/validations/auth.schema';

import { useAdminLogin, useRequestPasswordReset } from './use-admin-auth';

interface UseAdminLoginFlowOptions {
  nextPath: string;
}

/** Controller hook managing admin login and password-reset request mode and submissions. */
export function useAdminLoginFlow({ nextPath }: UseAdminLoginFlowOptions) {
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

  return {
    mode,
    serverError,
    resetMessage,
    loginForm,
    resetForm,
    isLoginSubmitting:
      loginForm.formState.isSubmitting || loginMutation.isPending,
    isResetSubmitting:
      resetForm.formState.isSubmitting || resetMutation.isPending,
    onSubmitLogin,
    onSubmitReset,
    handleSwitchMode,
  };
}
