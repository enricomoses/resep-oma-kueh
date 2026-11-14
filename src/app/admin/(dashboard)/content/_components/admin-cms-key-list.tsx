'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PUBLIC_CMS_KEYS } from '@/constants/content.constant';
import type { AdminCmsEntry } from '@/types/admin-cms';
import type { PublicCmsKey } from '@/types/content';
import { cn } from '@/utils';
import { CMS_KEY_LABELS } from '@/utils/admin-cms';

interface AdminCmsKeyListProps {
  entries: AdminCmsEntry[];
  activeKey: PublicCmsKey | undefined;
  onSelectKey: (key: PublicCmsKey) => void;
  className?: string;
}

export function AdminCmsKeyList({
  entries,
  activeKey,
  onSelectKey,
  className,
}: AdminCmsKeyListProps) {
  return (
    <Card tone="surface" className={cn('admin-cms-nav-card', className)}>
      <h3 className="admin-card-title">Daftar Kunci Resmi (Allowlist)</h3>
      <ul className="admin-cms-key-list">
        {PUBLIC_CMS_KEYS.map((key) => {
          const entry = entries.find((item) => item.key === key);
          const isActive = activeKey === key;
          return (
            <li key={key}>
              <button
                type="button"
                className={cn(
                  'admin-cms-key-btn',
                  isActive && 'admin-cms-key-btn--active',
                )}
                onClick={() => onSelectKey(key)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="admin-cms-key-meta">
                  <span className="admin-cms-key-label">
                    {CMS_KEY_LABELS[key]}
                  </span>
                  <code className="admin-cms-key-code">{key}</code>
                </span>
                <Badge
                  tone={entry?.status === 'published' ? 'success' : 'neutral'}
                >
                  {entry?.status === 'published' ? 'Terpublikasi' : 'Draf'}
                </Badge>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
