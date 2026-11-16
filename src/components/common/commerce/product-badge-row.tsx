'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';

export interface ProductBadgeItem {
  id: string;
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'danger';
}

interface ProductBadgeRowProps {
  items: ProductBadgeItem[];
  className?: string;
}

type PopoverAlign = 'left' | 'center' | 'right';

interface BadgeLayout {
  visibleCount: number;
  popoverAlign: PopoverAlign;
}

export function ProductBadgeRow({ items, className }: ProductBadgeRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreWrapRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<BadgeLayout | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const itemsSignature = items
    .map((item) => `${item.id}:${item.tone ?? 'neutral'}:${item.label}`)
    .join('|');

  const calculateLayout = useCallback(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    if (items.length === 0) {
      setLayout({ visibleCount: 0, popoverAlign: 'center' });
      return;
    }

    const containerWidth = row.clientWidth;
    if (containerWidth <= 0) return;

    const children = Array.from(measure.children) as HTMLElement[];
    const moreEl = children[items.length];
    if (!moreEl) return;

    const parsedGap = Number.parseFloat(getComputedStyle(row).columnGap || '8');
    const gap = Number.isFinite(parsedGap) ? parsedGap : 8;
    const badgeWidths = children
      .slice(0, items.length)
      .map((el) => el.offsetWidth);
    const moreWidth = moreEl.offsetWidth;

    const totalWidth =
      badgeWidths.reduce((sum, width) => sum + width, 0) +
      Math.max(0, items.length - 1) * gap;

    if (totalWidth <= containerWidth) {
      setLayout((prev) =>
        prev?.visibleCount === items.length && prev.popoverAlign === 'center'
          ? prev
          : { visibleCount: items.length, popoverAlign: 'center' },
      );
      return;
    }

    let usedWidth = 0;
    let fitCount = 0;
    for (let index = 0; index < badgeWidths.length; index += 1) {
      const candidateWidth = badgeWidths[index] + gap + moreWidth;
      if (usedWidth + candidateWidth <= containerWidth) {
        usedWidth += badgeWidths[index] + gap;
        fitCount += 1;
      } else {
        break;
      }
    }

    const moreCenter = usedWidth + moreWidth / 2;
    const ratio = moreCenter / containerWidth;
    const popoverAlign: PopoverAlign =
      ratio < 0.3 ? 'left' : ratio > 0.7 ? 'right' : 'center';

    setLayout((prev) =>
      prev?.visibleCount === fitCount && prev.popoverAlign === popoverAlign
        ? prev
        : { visibleCount: fitCount, popoverAlign },
    );
  }, [items.length]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      if (!cancelled) {
        calculateLayout();
      }
    });
    const observer = new ResizeObserver(() => {
      if (!cancelled) {
        calculateLayout();
      }
    });
    observer.observe(row);

    if (typeof document !== 'undefined' && 'fonts' in document) {
      void document.fonts.ready.then(() => {
        if (!cancelled) {
          calculateLayout();
        }
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [calculateLayout, itemsSignature]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        moreWrapRef.current &&
        !moreWrapRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const visibleCount = layout ? layout.visibleCount : items.length;
  const hasOverflow = layout !== null && visibleCount < items.length;
  const visibleItems = items.slice(0, visibleCount);

  return (
    <div
      ref={rowRef}
      className={cn(
        'product-badge-row',
        layout === null && 'product-badge-row--unmeasured',
        className,
      )}
    >
      {visibleItems.map((item) => (
        <Badge key={item.id} tone={item.tone} className="product-badge-item">
          {item.label}
        </Badge>
      ))}

      {hasOverflow ? (
        <div
          ref={moreWrapRef}
          className="product-badge-more-wrap"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onFocus={() => setIsOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="ui-badge product-badge-more"
            aria-label={`Lihat semua ${items.length} label produk`}
            aria-expanded={isOpen}
            aria-haspopup="true"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            ...
          </button>

          {isOpen ? (
            <div
              className="product-badge-popover"
              data-align={layout.popoverAlign}
              role="tooltip"
            >
              <div className="product-badge-popover-list">
                {items.map((item) => (
                  <Badge key={item.id} tone={item.tone}>
                    {item.label}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div
          ref={measureRef}
          className="product-badge-measure"
          aria-hidden="true"
        >
          {items.map((item) => (
            <Badge
              key={item.id}
              tone={item.tone}
              className="product-badge-item"
            >
              {item.label}
            </Badge>
          ))}
          <span className="ui-badge product-badge-more">...</span>
        </div>
      ) : null}
    </div>
  );
}
