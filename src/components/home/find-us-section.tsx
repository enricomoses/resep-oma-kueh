import { CheckCircle2, ExternalLink, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import { cn } from '@/utils';
import type { PublicBranch } from '@/types/branch';

interface ApprovedBranchContact {
  code: string;
  name: string;
  whatsappNumber: string;
  address: string | null;
}

interface FindUsSectionProps {
  approvedBranches: readonly ApprovedBranchContact[];
  activeBranches: PublicBranch[];
  selectedBranchId: string | null;
  isBranchesError: boolean;
  onSelectBranch: (branch: PublicBranch) => void;
  className?: string;
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
      <div className="home-section-header">
        <div>
          <h2 id="home-find-us-title" className="editorial-heading">
            {HOME_COPY.FIND_US_TITLE}
          </h2>
          <p className="home-section-subtitle">{HOME_COPY.FIND_US_SUBTITLE}</p>
        </div>
      </div>
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
                <MapPin size={16} aria-hidden="true" />
                <span>{address ?? HOME_COPY.FIND_US_ADDRESS_PENDING}</span>
              </p>
              <p className="home-branch-detail">
                <Phone size={16} aria-hidden="true" />
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  className="ui-link"
                  aria-label={`Hubungi WhatsApp cabang ${name}`}
                >
                  +{whatsappNumber}
                </a>
              </p>
              <p className="home-price-note">
                {HOME_COPY.FIND_US_HOURS_PENDING}
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
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ui-link"
                  >
                    {HOME_COPY.FIND_US_MAPS_CTA}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
