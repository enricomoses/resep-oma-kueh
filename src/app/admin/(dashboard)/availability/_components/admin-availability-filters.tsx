'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type {
  AdminAvailabilityListResponse,
  AdminOfferAvailabilityStatus,
} from '@/types/admin-catalog';
import { cn } from '@/utils';

interface AdminAvailabilityFiltersProps {
  isOwner: boolean;
  branches: AdminAvailabilityListResponse['branches'];
  fallbackBranchName?: string | null;
  searchInput: string;
  branchIdFilter: string;
  listedFilter: 'all' | 'listed' | 'unlisted';
  statusFilter: 'all' | AdminOfferAvailabilityStatus;
  onSearchChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onListedChange: (value: 'all' | 'listed' | 'unlisted') => void;
  onStatusChange: (value: 'all' | AdminOfferAvailabilityStatus) => void;
  className?: string;
}

/** Filter bar card for searching SKU availability across branches and statuses. */
export function AdminAvailabilityFilters({
  isOwner,
  branches,
  fallbackBranchName,
  searchInput,
  branchIdFilter,
  listedFilter,
  statusFilter,
  onSearchChange,
  onBranchChange,
  onListedChange,
  onStatusChange,
  className,
}: AdminAvailabilityFiltersProps) {
  return (
    <Card tone="surface" className={cn('admin-filter-card', className)}>
      <div className="admin-filter-grid">
        <FormField id="avail-search" label="Cari Produk / SKU">
          {(fieldProps) => (
            <Input
              {...fieldProps}
              value={searchInput}
              placeholder="Nama kue, slug, SKU, atau ukuran..."
              onChange={(event) => onSearchChange(event.target.value)}
            />
          )}
        </FormField>

        {isOwner ? (
          <FormField id="avail-branch-filter" label="Cabang">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={branchIdFilter}
                onChange={(event) => onBranchChange(event.target.value)}
              >
                <option value="">Semua Cabang</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        ) : (
          <div className="admin-staff-branch-pill">
            <span className="admin-stat-label">Cabang Tugas</span>
            <Badge tone="accent">
              {branches[0]?.name ?? fallbackBranchName ?? 'Cabang Terbatas'}
            </Badge>
          </div>
        )}

        <FormField id="avail-listed-filter" label="Status Tampil">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={listedFilter}
              onChange={(event) =>
                onListedChange(
                  event.target.value as 'all' | 'listed' | 'unlisted',
                )
              }
            >
              <option value="all">Semua</option>
              <option value="listed">Tampil di Cabang</option>
              <option value="unlisted">Disembunyikan</option>
            </Select>
          )}
        </FormField>

        <FormField id="avail-status-filter" label="Status Ketersediaan">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={statusFilter}
              onChange={(event) =>
                onStatusChange(
                  event.target.value as 'all' | AdminOfferAvailabilityStatus,
                )
              }
            >
              <option value="all">Semua Status</option>
              <option value="available">Tersedia</option>
              <option value="sold_out">Habis (Sold Out)</option>
              <option value="unconfirmed">Belum Dikonfirmasi</option>
            </Select>
          )}
        </FormField>
      </div>
    </Card>
  );
}
