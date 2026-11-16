import { CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';

import { SectionHeader } from '@/components/common/layout/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import type { ApprovedBranchContact, PublicBranch } from '@/types/branch';
import { cn } from '@/utils';

interface FindUsSectionProps {
  approvedBranches: readonly ApprovedBranchContact[];
  activeBranches: PublicBranch[];
  selectedBranchId: string | null;
  isBranchesError: boolean;
  onSelectBranch: (branch: PublicBranch) => void;
  className?: string;
}

const BRANCH_OPERATIONAL_HOURS: Record<string, string> = {
  surabaya: 'Setiap Hari, 08.00 WIB - 17.00 WIB',
  sby: 'Setiap Hari, 08.00 WIB - 17.00 WIB',
  bintaro: 'Senin - Sabtu, 08.00 WIB - 16.00 WIB',
  btr: 'Senin - Sabtu, 08.00 WIB - 16.00 WIB',
};

function formatWhatsappDisplay(number: string): string {
  return number.replace(/^62/, '0');
}

export function FindUsSection({
  approvedBranches,
  activeBranches,
  selectedBranchId,
  isBranchesError,
  onSelectBranch,
  className,
}: FindUsSectionProps) {
  return (
    <section
      id={HOME_SECTION_IDS.FIND_US}
      className={cn('home-section', className)}
      aria-labelledby="home-find-us-title"
    >
      <SectionHeader
        titleId="home-find-us-title"
        title={HOME_COPY.FIND_US_TITLE}
        subtitle={HOME_COPY.FIND_US_SUBTITLE}
      />
      <div className="home-find-us-grid">
        {approvedBranches.map((fallback) => {
          const active = !isBranchesError
            ? activeBranches.find((item) => item.code === fallback.code)
            : undefined;
          const isSelected = Boolean(active && active.id === selectedBranchId);
          const name = active?.name ?? fallback.name;
          const whatsappNumber =
            active?.whatsappNumber ?? fallback.whatsappNumber;
          const address = active ? active.address : fallback.address;
          const mapsUrl = active?.mapsUrl ?? null;
          const operationalHours =
            BRANCH_OPERATIONAL_HOURS[fallback.code.toLowerCase()] ??
            HOME_COPY.FIND_US_HOURS_PENDING;

          return (
            <Card key={fallback.code} className="home-branch-card">
              <div className="home-branch-card-header">
                <h3>{name}</h3>
                {isSelected ? (
                  <Badge tone="success">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    {HOME_COPY.FIND_US_SELECTED}
                  </Badge>
                ) : null}
              </div>
              <p className="home-branch-detail">
                {address && mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="home-branch-link"
                  >
                    <MapPin size={16} aria-hidden="true" />
                    <span>{address}</span>
                  </a>
                ) : (
                  <>
                    <MapPin size={16} aria-hidden="true" />
                    <span>{address ?? HOME_COPY.FIND_US_ADDRESS_PENDING}</span>
                  </>
                )}
              </p>
              <p className="home-branch-detail">
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="home-branch-link"
                  aria-label={`Hubungi WhatsApp cabang ${name}`}
                >
                  <Phone size={16} aria-hidden="true" />
                  <span>{formatWhatsappDisplay(whatsappNumber)}</span>
                </a>
              </p>
              <p className="home-branch-detail">
                <Clock size={16} aria-hidden="true" />
                <span>{operationalHours}</span>
              </p>
              <div className="home-branch-actions">
                {active ? (
                  <Button
                    variant={isSelected ? 'secondary' : 'primary'}
                    disabled={isSelected}
                    onClick={() => onSelectBranch(active)}
                  >
                    {isSelected
                      ? `${HOME_COPY.FIND_US_SELECTED} (${name})`
                      : `${HOME_COPY.FIND_US_SELECT_CTA} ${name}`}
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
