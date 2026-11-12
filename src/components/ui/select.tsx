import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/utils';

interface SelectProps extends ComponentPropsWithRef<'select'> {
  sizeVariant?: 'regular' | 'compact';
}
export function Select({
  className,
  sizeVariant = 'regular',
  ...props
}: SelectProps) {
  return (
    <div className="ui-select-wrap">
      <select
        {...props}
        className={cn(
          'ui-control ui-select',
          sizeVariant === 'compact' && 'ui-control--compact',
          className,
        )}
      />
      <ChevronDown className="ui-select-icon" size={18} aria-hidden="true" />
    </div>
  );
}
