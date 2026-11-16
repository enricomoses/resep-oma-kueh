import { ArrowLeft } from 'lucide-react';
import type { ComponentProps } from 'react';

import { ActionLink } from '@/components/ui/action-link';
import { cn } from '@/utils';

interface BackLinkProps extends Omit<
  ComponentProps<typeof ActionLink>,
  'children'
> {
  label: string;
}

export function BackLink({ label, className, ...props }: BackLinkProps) {
  return (
    <ActionLink {...props} className={cn('ui-back-link', className)}>
      <ArrowLeft size={16} aria-hidden="true" className="ui-back-link-arrow" />
      <span className="ui-back-link-label">{label}</span>
    </ActionLink>
  );
}
