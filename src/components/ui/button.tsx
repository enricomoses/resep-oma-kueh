import { LoaderCircle } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

import { UI_COPY } from '@/constants/ui.constant';
import { cn } from '@/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export function buttonStyles(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(
    'ui-button',
    `ui-button--${variant}`,
    size !== 'md' && `ui-button--${size}`,
    className,
  );
}

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
}
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel = UI_COPY.LOADING,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <>
          <LoaderCircle size={18} aria-hidden="true" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
