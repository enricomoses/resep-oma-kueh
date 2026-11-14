'use client';

import { usePathname } from 'next/navigation';

import { ActionLink } from '@/components/ui/action-link';
import { SITE_COPY, SITE_NAV } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface SiteNavProps {
  className?: string;
  onNavigate?: () => void;
}

export function SiteNav({ className, onNavigate }: SiteNavProps) {
  const pathname = usePathname();
  const { selected, code } = useBranches();

  return (
    <nav aria-label={SITE_COPY.NAV} className={cn('site-nav', className)}>
      {SITE_NAV.map((item) => (
        <ActionLink
          key={item.href}
          href={withBranch(item.href, selected?.code ?? code)}
          prefetch={false}
          aria-current={
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(`${item.href}/`))
              ? 'page'
              : undefined
          }
          onClick={onNavigate}
        >
          {item.label}
        </ActionLink>
      ))}
    </nav>
  );
}
