'use client';

import { Search } from 'lucide-react';

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
    <Card tone="surface" className={cn('admin-avail-filter-card', className)}>
      <div className="admin-avail-filter-grid">
        <FormField id="avail-search" label="Cari Produk / SKU">
          {(fieldProps) => (
            <div className="admin-avail-search-wrap">
              <Search
                size={15}
                className="admin-avail-search-icon"
                aria-hidden="true"
              />
              <Input
                {...fieldProps}
                type="search"
                sizeVariant="compact"
                value={searchInput}
                placeholder="Nama kue, slug, SKU, atau ukuran..."
                onChange={(event) => onSearchChange(event.target.value)}
                className="admin-avail-search-input"
              />
            </div>
          )}
        </FormField>

        {isOwner ? (
          <FormField id="avail-branch-filter" label="Cabang">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                sizeVariant="compact"
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
          <div className="admin-avail-branch-readonly">
            <span className="admin-stat-label">Cabang Tugas</span>
            <span className="admin-avail-branch-pill">
              {branches[0]?.name ?? fallbackBranchName ?? 'Cabang Terbatas'}
            </span>
          </div>
        )}

        <FormField id="avail-listed-filter" label="Status Tampil">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              sizeVariant="compact"
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
              sizeVariant="compact"
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
