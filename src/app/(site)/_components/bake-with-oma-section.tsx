import { ArrowRight, CalendarDays, MapPin, Users } from 'lucide-react';
import Image from 'next/image';

import { MediaPlaceholder } from '@/components/common/media-placeholder';
import { SectionHeader } from '@/components/common/layout/section-header';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ROUTES } from '@/constants';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import type { HomeSectionResult, HomeUpcomingSession } from '@/types/home';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';
import { formatIdr } from '@/utils/currency';

const sessionDateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
});

function formatSessionStart(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${sessionDateFormatter.format(date)} WIB`;
}

interface BakeWithOmaSectionProps {
  title: string;
  body: string;
  upcomingClasses: HomeSectionResult<HomeUpcomingSession[]>;
  selectedBranchId: string | null;
  branchCode: string | null;
  className?: string;
}

export function BakeWithOmaSection({
  title,
  body,
  upcomingClasses,
  selectedBranchId,
  branchCode,
  className,
}: BakeWithOmaSectionProps) {
  const visibleSessions =
    upcomingClasses.status === 'success'
      ? upcomingClasses.data.filter(
          (session) =>
            selectedBranchId === null || session.branch.id === selectedBranchId,
        )
      : [];

  return (
    <section
      id={HOME_SECTION_IDS.CLASSES}
      className={cn('home-section', className)}
      aria-labelledby="home-classes-title"
    >
      <SectionHeader
        titleId="home-classes-title"
        title={title}
        subtitle={body}
        actions={
          <ActionLink
            href={withBranch(ROUTES.CLASSES, branchCode)}
            variant="secondary"
            prefetch={false}
          >
            {HOME_COPY.CLASSES_CTA}
          </ActionLink>
        }
      />
      {upcomingClasses.status === 'error' ? (
        <Feedback tone="error" title={HOME_COPY.CLASSES_ERROR}>
          <div className="home-inline-actions">
            <ActionLink
              href={withBranch(ROUTES.CONTACT, branchCode)}
              prefetch={false}
            >
              {HOME_COPY.CLASSES_CONTACT_CTA}
            </ActionLink>
          </div>
        </Feedback>
      ) : visibleSessions.length === 0 ? (
        <Card className="home-class-empty-card">
          <h3>{HOME_COPY.CLASSES_EMPTY}</h3>
          <p>{HOME_COPY.CLASSES_EMPTY_NOTE}</p>
          <div className="home-inline-actions">
            <ActionLink
              href={withBranch(ROUTES.CONTACT, branchCode)}
              variant="primary"
              prefetch={false}
            >
              {HOME_COPY.CLASSES_CONTACT_CTA}
              <ArrowRight size={16} aria-hidden="true" />
            </ActionLink>
            <ActionLink
              href={withBranch(ROUTES.CLASSES, branchCode)}
              variant="secondary"
              prefetch={false}
            >
              {HOME_COPY.CLASSES_CTA}
            </ActionLink>
          </div>
        </Card>
      ) : (
        <div className="home-classes-grid">
          {visibleSessions.map((session) => (
            <Card key={session.id} className="home-class-card">
              {session.program.coverImageUrl ? (
                <div className="home-card-media-frame">
                  <Image
                    src={session.program.coverImageUrl}
                    alt={session.program.coverAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="home-card-media-img"
                  />
                </div>
              ) : (
                <MediaPlaceholder
                  caption={session.program.coverAlt}
                  className="home-card-media"
                />
              )}
              <div className="home-badge-row">
                <Badge tone="accent">
                  <MapPin size={14} aria-hidden="true" />
                  {session.branch.name}
                </Badge>
                <Badge tone="success">
                  <Users size={14} aria-hidden="true" />
                  {session.seatsLeft !== null
                    ? `${HOME_COPY.CLASSES_SEATS_PREFIX} ${session.seatsLeft}`
                    : HOME_COPY.CLASSES_SEATS_OPEN}
                </Badge>
              </div>
              <div className="home-class-card-body">
                <h3>{session.program.title}</h3>
                <p>
                  {session.program.shortDescription ??
                    session.program.description}
                </p>
                <p className="home-class-schedule">
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>{formatSessionStart(session.startsAt)}</span>
                </p>
                {session.effectivePriceIdr ? (
                  <p className="home-class-price">
                    Mulai {formatIdr(session.effectivePriceIdr)}
                  </p>
                ) : null}
              </div>
              <ActionLink
                href={withBranch(
                  `${ROUTES.CLASSES}/${session.program.slug}`,
                  branchCode ?? session.branch.code,
                )}
                variant="secondary"
                prefetch={false}
              >
                {CLASSES_COPY.DETAIL_CTA}
                <ArrowRight size={16} aria-hidden="true" />
              </ActionLink>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
