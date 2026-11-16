'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Feedback } from '@/components/ui/feedback';
import { cn } from '@/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  error?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  children?: ReactNode;
  className?: string;
  actionsClassName?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  error,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  confirmVariant = 'primary',
  isLoading = false,
  loadingLabel,
  onConfirm,
  children,
  className,
  actionsClassName,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className={cn('ui-confirm-dialog', className)}
    >
      {error ? <Feedback tone="error" title={error} announce /> : null}
      {children ?? null}
      <div
        className={cn(
          'site-dialog-actions ui-confirm-dialog-actions',
          actionsClassName,
        )}
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isLoading}
          onClick={() => onOpenChange(false)}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          size="sm"
          loading={isLoading}
          loadingLabel={loadingLabel}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
