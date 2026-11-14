'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';

import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { APP, ROUTES } from '@/constants';
import { SITE_COPY } from '@/constants/site.constant';
import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { useBranches } from '@/hooks/use-branches';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

import { BranchSelector } from '@/components/common/branch/branch-selector';
import { CartBadge } from './cart-badge';
import { SiteNav } from './site-nav';

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const { selected, code } = useBranches();

  return (
    <header className={cn('site-header', className)}>
      <div className="content-container site-header-row">
        <ActionLink
          className="site-brand"
          href={withBranch(ROUTES.HOME, selected?.code ?? code)}
        >
          <span>{APP.NAME}</span>
          <small>{FOUNDATION_COPY.LOGO_NOTE}</small>
        </ActionLink>
        <SiteNav className="site-desktop-nav" />
        <div className="site-header-actions">
          <CartBadge />
          <Button
            className="site-menu-toggle"
            variant="secondary"
            aria-label={SITE_COPY.OPEN_NAV}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="content-container site-branch-row">
        <BranchSelector />
      </div>
      <Drawer open={open} onOpenChange={setOpen} title={SITE_COPY.MOBILE_NAV}>
        <SiteNav onNavigate={() => setOpen(false)} />
      </Drawer>
    </header>
  );
}
