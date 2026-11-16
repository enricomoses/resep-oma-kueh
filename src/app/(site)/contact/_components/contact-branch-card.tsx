'use client';

import { CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CONTENT_COPY } from '@/constants/content.constant';
import type { PublicBranch } from '@/types/branch';
import type { PublicBranchHour } from '@/types/content';
import { cn } from '@/utils';

const DAY_LABELS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

const BRANCH_OPERATIONAL_HOURS: Record<string, string> = {
  surabaya: 'Setiap Hari, 08.00 WIB - 17.00 WIB',
  bintaro: 'Senin - Sabtu, 08.00 WIB - 16.00 WIB',
};

function formatWhatsappDisplay(number: string): string {
  return number.replace(/^62/, '0');
}

function formatBranchHour(hour: PublicBranchHour) {
  const day = DAY_LABELS[hour.dayOfWeek] ?? `Hari ${hour.dayOfWeek}`;
  if (hour.isClosed) {
    return `${day}: Tutup${hour.note ? ` (${hour.note})` : ''}`;
  }
  const timeRange =
    hour.opensAt && hour.closesAt
      ? `${hour.opensAt}–${hour.closesAt}`
      : 'Sesuai konfirmasi';
  return `${day}: ${timeRange}${hour.note ? ` (${hour.note})` : ''}`;
}

export interface ResolvedContactBranch {
  code: 'surabaya' | 'bintaro';
  name: string;
  whatsappNumber: string;
  address: string | null;
  mapsUrl: string | null;
  hours: PublicBranchHour[];
  liveBranch: PublicBranch | null;
}

interface ContactBranchCardProps {
  branch: ResolvedContactBranch;
  isSelected: boolean;
  onSelect: (branch: PublicBranch) => void;
  className?: string;
}

export function ContactBranchCard({
  branch,
  isSelected,
  onSelect,
  className,
}: ContactBranchCardProps) {
  const branchDescription =
    branch.code === 'surabaya'
      ? CONTENT_COPY.CONTACT_SURABAYA_DESC
      : CONTENT_COPY.CONTACT_BINTARO_DESC;

  return (
    <Card
      className={cn(
        'content-branch-card',
        isSelected && 'is-active',
        className,
      )}
    >
      <header className="content-branch-header">
        <div className="content-branch-header-top">
          <h3 className="content-branch-title">Cabang {branch.name}</h3>
          {isSelected ? (
            <Badge tone="success">
              <CheckCircle2 size={14} aria-hidden="true" />
              Cabang Aktif
            </Badge>
          ) : null}
        </div>
        <p className="content-branch-desc">{branchDescription}</p>
      </header>

      <dl className="content-branch-details">
        <div className="content-branch-detail-row">
          <span className="content-branch-detail-icon" aria-hidden="true">
            <Phone size={16} />
          </span>
          <div className="content-branch-detail-body">
            <dt className="content-branch-detail-label">WhatsApp</dt>
            <dd className="content-branch-detail-value">
              <a
                href={`https://wa.me/${branch.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="content-branch-link"
                aria-label={`Hubungi WhatsApp cabang ${branch.name}`}
              >
                <span>{formatWhatsappDisplay(branch.whatsappNumber)}</span>
              </a>
            </dd>
          </div>
        </div>

        <div className="content-branch-detail-row">
          <span className="content-branch-detail-icon" aria-hidden="true">
            <MapPin size={16} />
          </span>
          <div className="content-branch-detail-body">
            <dt className="content-branch-detail-label">Alamat</dt>
            <dd
              className={cn(
                'content-branch-detail-value',
                !branch.address && 'is-muted',
              )}
            >
              {branch.address && branch.mapsUrl ? (
                <a
                  href={branch.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="content-branch-link"
                >
                  <span>{branch.address}</span>
                </a>
              ) : (
                (branch.address ?? CONTENT_COPY.CONTACT_ADDRESS_PENDING)
              )}
            </dd>
          </div>
        </div>

        <div className="content-branch-detail-row">
          <span className="content-branch-detail-icon" aria-hidden="true">
            <Clock size={16} />
          </span>
          <div className="content-branch-detail-body">
            <dt className="content-branch-detail-label">
              {CONTENT_COPY.CONTACT_HOURS_LABEL}
            </dt>
            <dd className="content-branch-detail-value">
              {branch.hours.length > 0 ? (
                <ul className="content-hours-list">
                  {branch.hours.map((hour) => (
                    <li key={hour.id}>{formatBranchHour(hour)}</li>
                  ))}
                </ul>
              ) : (
                <span>
                  {BRANCH_OPERATIONAL_HOURS[branch.code] ??
                    CONTENT_COPY.CONTACT_HOURS_PENDING}
                </span>
              )}
            </dd>
          </div>
        </div>
      </dl>

      {branch.liveBranch ? (
        <div className="content-branch-footer">
          <Button
            variant={isSelected ? 'secondary' : 'primary'}
            disabled={isSelected}
            className="w-full justify-center"
            onClick={() => {
              if (branch.liveBranch) {
                onSelect(branch.liveBranch);
              }
            }}
          >
            {isSelected ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
            {isSelected
              ? `Cabang ${branch.name} Terpilih`
              : `Pilih Cabang ${branch.name}`}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
