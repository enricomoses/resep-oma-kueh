import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
    <Card tone="cream" className={cn('admin-readiness-card', className)}>
      <h3 className="admin-row-title">
        {ADMIN_CATALOG_COPY.LOCATIONS.READINESS_TITLE}
      </h3>
      <ul className="admin-readiness-list">
        <li>
          <CheckCircle2 size={15} aria-hidden="true" />{' '}
          <span>{ADMIN_CATALOG_COPY.LOCATIONS.SURABAYA_FINAL_NOTE}</span>
        </li>
        <li>
          {bintaroAddressResolved ? (
            <CheckCircle2 size={15} aria-hidden="true" />
          ) : (
            <AlertTriangle size={15} aria-hidden="true" />
          )}{' '}
          <span>
            {bintaroAddressResolved
              ? 'Alamat cabang Bintaro sudah diisi oleh Owner.'
              : ADMIN_CATALOG_COPY.LOCATIONS.BINTARO_UNRESOLVED_NOTE}
          </span>
        </li>
      </ul>

      <div className="admin-readiness-badges">
        {branches.map((branch) => (
          <div key={branch.id} className="admin-readiness-branch-row">
            <strong>{branch.name}</strong>
            <Badge
              tone={branch.readiness.hasConfirmedAddress ? 'success' : 'accent'}
            >
              {branch.readiness.hasConfirmedAddress
                ? 'Alamat Siap'
                : 'Alamat Unresolved'}
            </Badge>
            <Badge tone={branch.readiness.hasMapsUrl ? 'success' : 'neutral'}>
              {branch.readiness.hasMapsUrl ? 'Maps HTTPS' : 'Belum Ada Maps'}
            </Badge>
            <Badge
              tone={branch.readiness.fulfillmentEnabled ? 'success' : 'neutral'}
            >
              {branch.readiness.fulfillmentEnabled
                ? 'Fulfillment Aktif'
                : 'Fulfillment Nonaktif'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
