'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { BranchSelector } from '@/components/common/branch/branch-selector';
import { ActionLink } from '@/components/ui/action-link';
import { APP, ROUTES } from '@/constants';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

import { CartBadge } from './cart-badge';
import { SiteNav } from './site-nav';

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const { selected, code } = useBranches();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <div
        className={cn('site-mobile-backdrop', open && 'is-open')}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <header className={cn('site-header', className)}>
        <div className="content-container site-header-row">
          <ActionLink
            className="site-brand"
            href={withBranch(ROUTES.HOME, selected?.code ?? code)}
            aria-label={APP.NAME}
          >
            <Image
              src="/images/logo.png"
              alt={APP.NAME}
              width={36}
              height={36}
              priority
              className="h-9 w-auto object-contain"
            />
          </ActionLink>
          <SiteNav className="site-desktop-nav" />
          <div className="site-header-actions">
            <BranchSelector className="site-header-branch" />
            <CartBadge />
            <button
              type="button"
              className={cn('site-menu-toggle', open && 'is-open')}
              aria-label={SITE_COPY.OPEN_NAV}
              aria-expanded={open}
              aria-controls="site-mobile-menu"
              onClick={() => setOpen((prev) => !prev)}
            >
              <span className="site-hamburger" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
        <div
          id="site-mobile-menu"
          className={cn('site-mobile-menu', open && 'is-open')}
          aria-hidden={!open}
        >
          <div className="site-mobile-menu-inner">
            <div className="content-container site-mobile-menu-content">
              <SiteNav onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
