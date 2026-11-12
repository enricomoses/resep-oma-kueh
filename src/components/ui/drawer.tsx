'use client';

import { cn } from '@/utils';

import { ModalSurface } from './modal-surface';
import type { ModalSurfaceProps } from './modal-surface';

interface DrawerProps extends Omit<ModalSurfaceProps, 'kind' | 'className'> {
  className?: string;
}
export function Drawer({ className, ...props }: DrawerProps) {
  return <ModalSurface {...props} kind="drawer" className={cn(className)} />;
}
