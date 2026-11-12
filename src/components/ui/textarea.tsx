import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils';

interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  sizeVariant?: 'regular' | 'compact';
}
export function Textarea({
  className,
  sizeVariant = 'regular',
  ...props
}: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        'ui-control ui-textarea',
        sizeVariant === 'compact' && 'ui-control--compact',
        className,
      )}
    />
  );
}
