import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils';

interface InputProps extends ComponentPropsWithRef<'input'> {
  sizeVariant?: 'regular' | 'compact';
}
export function Input({
  className,
  sizeVariant = 'regular',
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        'ui-control',
        sizeVariant === 'compact' && 'ui-control--compact',
        className,
      )}
    />
  );
}
