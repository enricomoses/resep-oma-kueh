'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';

import { cn } from '@/utils';

interface ToastMessageProps {
  title: string;
  description?: string;
  meta?: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: (event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

/** Renders structured multi-line bakery toast content with optional CTA link. */
export function ToastMessage({
  title,
  description,
  meta,
  actionHref,
  actionLabel,
  onAction,
  className,
}: ToastMessageProps) {
  return (
    <div className={cn('bakery-toast-content', className)}>
      <p className="bakery-toast-title">{title}</p>
      {description ? <p className="bakery-toast-desc">{description}</p> : null}
      {meta ? <p className="bakery-toast-meta">{meta}</p> : null}
      {actionHref && actionLabel ? (
        <div className="bakery-toast-actions">
          <Link
            href={actionHref}
            className="bakery-toast-action"
            onClick={onAction}
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
