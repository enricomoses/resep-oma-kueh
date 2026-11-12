'use client';

import { X } from 'lucide-react';
import { useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';

import { UI_COPY } from '@/constants/ui.constant';
import { useModal } from '@/hooks/use-modal';
import { cn } from '@/utils';

import { Button } from './button';

export interface ModalSurfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  kind: 'dialog' | 'drawer';
}
export function ModalSurface({
  open,
  onOpenChange,
  title,
  description,
  children,
  initialFocusRef,
  className,
  kind,
}: ModalSurfaceProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useModal(open, ref, initialFocusRef);
  return (
    <dialog
      ref={ref}
      className={cn(
        'ui-modal',
        kind === 'drawer' && 'ui-modal--drawer',
        className,
      )}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={(event) => {
        if (!event.currentTarget.open && open) onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onOpenChange(false);
      }}
    >
      <div className="ui-modal-inner">
        <header className="ui-modal-header">
          <div>
            <h2 id={titleId} className="ui-modal-title">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="ui-modal-description">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            className="ui-modal-close"
            aria-label={UI_COPY.CLOSE}
            onClick={() => onOpenChange(false)}
          >
            <X size={20} aria-hidden="true" />
          </Button>
        </header>
        <div className="ui-modal-body">{children}</div>
      </div>
    </dialog>
  );
}
