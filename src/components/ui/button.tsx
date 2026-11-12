import { LoaderCircle } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

import { UI_COPY } from '@/constants/ui.constant';

import { buttonStyles } from './button.styles';
import type { ButtonSize, ButtonVariant } from './button.styles';

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
