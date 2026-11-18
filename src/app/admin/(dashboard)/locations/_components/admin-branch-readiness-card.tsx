import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { StatusIndicator } from '@/components/common/status/status-indicator';
import { Card } from '@/components/ui/card';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type { AdminBranchItem } from '@/types/admin-catalog';
import { cn } from '@/utils';

interface AdminBranchReadinessCardProps {
  branches: AdminBranchItem[];
  bintaroAddressResolved: boolean;
  className?: string;
}

export function AdminBranchReadinessCard({
  branches,
  bintaroAddressResolved,
  className,
}: AdminBranchReadinessCardProps) {
  return (
    <Card tone="surface" className={cn('admin-readiness-card', className)}>
      <h3 className="admin-readiness-title">
        {ADMIN_CATALOG_COPY.LOCATIONS.READINESS_TITLE}
      </h3>

      <ul className="admin-readiness-notes">
        <li className="admin-readiness-note-item">
          <CheckCircle2
            size={15}
            className="admin-readiness-note-icon"
            aria-hidden="true"
          />
          <span>{ADMIN_CATALOG_COPY.LOCATIONS.SURABAYA_FINAL_NOTE}</span>
        </li>
        <li className="admin-readiness-note-item">
          {bintaroAddressResolved ? (
            <CheckCircle2
              size={15}
              className="admin-readiness-note-icon"
              aria-hidden="true"
            />
          ) : (
            <AlertTriangle
              size={15}
              className="admin-readiness-note-icon"
              aria-hidden="true"
            />
          )}
          <span>
            {bintaroAddressResolved
              ? 'Alamat cabang Bintaro sudah diisi oleh Owner.'
              : ADMIN_CATALOG_COPY.LOCATIONS.BINTARO_UNRESOLVED_NOTE}
          </span>
        </li>
      </ul>

      <div className="admin-readiness-branches">
        {branches.map((branch) => (
          <div key={branch.id} className="admin-readiness-branch">
            <p className="admin-readiness-branch-name">{branch.name}</p>
            <div className="admin-readiness-indicators">
              <StatusIndicator
                tone={
                  branch.readiness.hasConfirmedAddress ? 'success' : 'accent'
                }
                label={
                  branch.readiness.hasConfirmedAddress
                    ? 'Alamat Siap'
                    : 'Alamat Unresolved'
                }
              />
              <StatusIndicator
                tone={branch.readiness.hasMapsUrl ? 'success' : 'neutral'}
                label={
                  branch.readiness.hasMapsUrl ? 'Maps HTTPS' : 'Belum Ada Maps'
                }
              />
              <StatusIndicator
                tone={
                  branch.readiness.fulfillmentEnabled ? 'success' : 'neutral'
                }
                label={
                  branch.readiness.fulfillmentEnabled
                    ? 'Fulfillment Aktif'
                    : 'Fulfillment Nonaktif'
                }
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
