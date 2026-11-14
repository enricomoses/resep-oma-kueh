'use client';

import { CheckCircle2, Clock, ExternalLink, MapPin, Phone } from 'lucide-react';
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
    <Card className={cn('content-branch-card', className)}>
      <div className="home-branch-card-header">
        <h3>Cabang {branch.name}</h3>
        {isSelected ? (
          <Badge tone="success">
            <CheckCircle2 size={14} aria-hidden="true" />
            Cabang Aktif
          </Badge>
        ) : null}
      </div>
      <p className="content-card-desc">{branchDescription}</p>

      <dl className="content-detail-list">
        <div className="content-detail-item">
          <dt>
            <Phone size={16} aria-hidden="true" />
            <span>WhatsApp Resmi</span>
          </dt>
          <dd>
            <a
              href={`https://wa.me/${branch.whatsappNumber}`}
              className="ui-link"
            >
              {CONTENT_COPY.CONTACT_WA_CTA_PREFIX} {branch.name} (+
              {branch.whatsappNumber})
            </a>
          </dd>
        </div>

        <div className="content-detail-item">
          <dt>
            <MapPin size={16} aria-hidden="true" />
            <span>{CONTENT_COPY.CONTACT_ADDRESS_LABEL}</span>
          </dt>
          <dd>{branch.address ?? CONTENT_COPY.CONTACT_ADDRESS_PENDING}</dd>
        </div>

        <div className="content-detail-item">
          <dt>
            <ExternalLink size={16} aria-hidden="true" />
            <span>{CONTENT_COPY.CONTACT_MAPS_LABEL}</span>
          </dt>
          <dd>
            {branch.mapsUrl ? (
              <a
                href={branch.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-link"
              >
                {CONTENT_COPY.CONTACT_MAPS_CTA} {branch.name}
              </a>
            ) : (
              <span>{CONTENT_COPY.CONTACT_MAPS_PENDING}</span>
            )}
          </dd>
        </div>

        <div className="content-detail-item">
          <dt>
            <Clock size={16} aria-hidden="true" />
            <span>{CONTENT_COPY.CONTACT_HOURS_LABEL}</span>
          </dt>
          <dd>
            {branch.hours.length > 0 ? (
              <ul className="content-hours-list">
                {branch.hours.map((hour) => (
                  <li key={hour.id}>{formatBranchHour(hour)}</li>
                ))}
              </ul>
            ) : (
              <span>{CONTENT_COPY.CONTACT_HOURS_PENDING}</span>
            )}
          </dd>
        </div>
      </dl>

      {branch.liveBranch ? (
        <div className="home-branch-actions">
          <Button
            variant={isSelected ? 'secondary' : 'primary'}
            disabled={isSelected}
            onClick={() => {
              if (branch.liveBranch) {
                onSelect(branch.liveBranch);
              }
            }}
          >
            {isSelected
              ? `Cabang ${branch.name} Terpilih`
              : `Pilih Cabang ${branch.name}`}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
