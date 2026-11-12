import Link from 'next/link';
import type { ComponentProps } from 'react';

import { cn } from '@/utils';

import { buttonStyles } from './button.styles';
import type { ButtonSize, ButtonVariant } from './button.styles';

interface ActionLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant | 'text';
  size?: ButtonSize;
}
export function ActionLink({
  className,
  variant = 'text',
  size = 'md',
  ...props
}: ActionLinkProps) {
  return (
    <Link
      {...props}
      className={
        variant === 'text'
          ? cn('ui-link', className)
          : buttonStyles(variant, size, className)
      }
    />
  );
}
