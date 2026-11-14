'use client';

import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import Image from 'next/image';

import { MediaPlaceholder } from '@/components/common/media-placeholder';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicClassDetail } from '@/hooks/use-classes';
import type { InitialPublicClassDetail } from '@/types/classes';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';
import { formatClassAgeRange } from '@/utils/classes';
import { formatIdr } from '@/utils/currency';
import { ClassRegistrationPanel } from './class-registration-panel';

interface ClassDetailViewProps {
  slug: string;
  initial: InitialPublicClassDetail;
  className?: string;
}

export function ClassDetailView({
  slug,
  initial,
  className,
}: ClassDetailViewProps) {
  const { selected, code, items: activeBranches } = useBranches();
  const branchCode = selected?.code ?? code;

  const query = usePublicClassDetail(
    slug,
    branchCode,
    initial.status === 'success' ? initial.data : undefined,
  );

  const detail = query.data;

  return (
    <main
      id={SITE_COPY.MAIN_ID}
      tabIndex={-1}
      className={cn('content-container classes-main', className)}
    >
      <div className="classes-back-row">
        <ActionLink
          href={withBranch(ROUTES.CLASSES, branchCode)}
          variant="secondary"
          size="sm"
          prefetch={false}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke Daftar Kelas
        </ActionLink>
      </div>

      {query.isError || (!detail && initial.status === 'error') ? (
        <Feedback tone="error" title={CLASSES_COPY.ERROR_LOAD} />
      ) : detail ? (
        <div className="classes-detail-layout">
          <div className="classes-detail-summary">
            <Card className="classes-detail-hero-card">
              {detail.program.coverImageUrl ? (
                <div className="classes-detail-media-frame">
                  <Image
                    src={detail.program.coverImageUrl}
                    alt={detail.program.coverAltText}
                    fill
                    sizes="(max-width: 768px) 100vw, 560px"
                    className="classes-card-media-img"
                  />
                </div>
              ) : (
                <MediaPlaceholder
                  caption={detail.program.coverAltText}
                  className="classes-detail-media"
                />
              )}

              <div className="classes-badge-row">
                <Badge tone="accent">{CLASSES_COPY.EYEBROW}</Badge>
                <Badge tone="success">
                  Harga dasar {formatIdr(detail.program.basePriceIdr)}
                </Badge>
                {formatClassAgeRange(
                  detail.program.ageMin,
                  detail.program.ageMax,
                ) ? (
                  <Badge tone="neutral">
                    {formatClassAgeRange(
                      detail.program.ageMin,
                      detail.program.ageMax,
                    )}
                  </Badge>
                ) : null}
                {detail.program.durationMinutes ? (
                  <Badge tone="neutral">
                    <Clock size={14} aria-hidden="true" />
                    {detail.program.durationMinutes} menit
                  </Badge>
                ) : null}
              </div>

              <h1 className="editorial-heading">{detail.program.title}</h1>
              {detail.program.shortDescription ? (
                <p className="classes-subtitle">
                  {detail.program.shortDescription}
                </p>
              ) : null}
              <p className="classes-description">
                {detail.program.description}
              </p>

              {detail.program.includedItems.length > 0 ? (
                <div className="classes-included-box">
                  <h2>Termasuk dalam Kelas</h2>
                  <ul className="classes-included-list">
                    {detail.program.includedItems.map((item, idx) => (
                      <li key={`${idx}-${item}`}>
                        <CheckCircle2 size={16} aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          </div>

          <ClassRegistrationPanel
            program={detail.program}
            evaluatedAtUtc={detail.evaluatedAtUtc}
            selectedBranch={selected}
            activeBranches={activeBranches}
            branchCode={branchCode}
          />
        </div>
      ) : null}
    </main>
  );
}
