import { ArrowRight, CalendarDays, MapPin, Users } from 'lucide-react';

import { BakingClassCard } from '@/components/common/classes/baking-class-card';
import type { ProductBadgeItem } from '@/components/common/commerce/product-badge-row';
import { EmptyState } from '@/components/common/feedback/empty-state';
import { SectionHeader } from '@/components/common/layout/section-header';
import { ActionLink } from '@/components/ui/action-link';
import { Feedback } from '@/components/ui/feedback';
import { ROUTES } from '@/constants';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import type { HomeSectionResult, HomeUpcomingSession } from '@/types/home';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

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
        <EmptyState
          icon={
            <CalendarDays size={24} strokeWidth={1.65} aria-hidden="true" />
          }
          title={HOME_COPY.CLASSES_EMPTY}
          description={HOME_COPY.CLASSES_EMPTY_NOTE}
          headingAs="h3"
          action={
            <>
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
            </>
          }
        />
      ) : (
        <div className="baking-class-grid">
          {visibleSessions.map((session) => {
            const badges: ProductBadgeItem[] = [
              {
                id: 'branch',
                label: session.branch.name,
                icon: <MapPin size={13} aria-hidden="true" />,
                tone: 'accent',
              },
              {
                id: 'seats',
                label:
                  session.seatsLeft !== null
                    ? `${HOME_COPY.CLASSES_SEATS_PREFIX} ${session.seatsLeft}`
                    : HOME_COPY.CLASSES_SEATS_OPEN,
                icon: <Users size={13} aria-hidden="true" />,
                tone: 'success',
              },
            ];

            return (
              <BakingClassCard
                key={session.id}
                title={session.program.title}
                titleAs="h3"
                description={
                  session.program.shortDescription ??
                  session.program.description
                }
                coverImageUrl={session.program.coverImageUrl ?? null}
                coverAlt={session.program.coverAlt}
                badges={badges}
                scheduleText={formatSessionStart(session.startsAt)}
                priceIdr={session.effectivePriceIdr ?? null}
                href={withBranch(
                  `${ROUTES.CLASSES}/${session.program.slug}`,
                  branchCode ?? session.branch.code,
                )}
                ctaLabel={CLASSES_COPY.DETAIL_CTA}
                ctaVariant="secondary"
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
