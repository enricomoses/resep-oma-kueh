'use client';

import { StatusIndicator } from '@/components/common/status/status-indicator';
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
      <div className="admin-cms-nav-head">
        <h3 className="admin-cms-nav-title">Daftar Kunci Resmi (Allowlist)</h3>
      </div>
      <ul className="admin-cms-key-list">
        {PUBLIC_CMS_KEYS.map((key) => {
          const entry = entries.find((item) => item.key === key);
          const isActive = activeKey === key;
          const isPublished = entry?.status === 'published';

          return (
            <li key={key} className="admin-cms-key-item">
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
                <StatusIndicator
                  tone={isPublished ? 'success' : 'neutral'}
                  label={isPublished ? 'Terpublikasi' : 'Draf'}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
