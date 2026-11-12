'use client';

import { cn } from '@/utils';

import { ModalSurface } from './modal-surface';
import type { ModalSurfaceProps } from './modal-surface';

interface DialogProps extends Omit<ModalSurfaceProps, 'kind' | 'className'> {
  className?: string;
}
export function Dialog({ className, ...props }: DialogProps) {
  return <ModalSurface {...props} kind="dialog" className={cn(className)} />;
}
