'use client';

import { Clock, MapPin, MessageCircle, Users } from 'lucide-react';

import { BakingClassCard } from '@/components/common/classes/baking-class-card';
import type { ProductBadgeItem } from '@/components/common/commerce/product-badge-row';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { PublicBranch } from '@/types/branch';
import type { PublicClassProgram } from '@/types/classes';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';
import { withBranch } from '@/utils/branch-url';
import {
  buildAskNextClassWhatsAppUrl,
  evaluateClassSessionAvailability,
  formatClassAgeRange,
  formatClassScheduleJakarta,
} from '@/utils/classes';

interface ClassProgramCardProps {
  program: PublicClassProgram;
  evaluatedAtUtc: string;
  branchCode: string | null;
  contactBranch: PublicBranch | null;
  className?: string;
}

/**
 * Maps a public class program & its next upcoming session onto the shared
 * landscape BakingClassCard component.
 */
export function ClassProgramCard({
  program,
  evaluatedAtUtc,
  branchCode,
  contactBranch,
  className,
}: ClassProgramCardProps) {
  const ageLabel = formatClassAgeRange(program.ageMin, program.ageMax);
  const nextSession = program.upcomingSessions[0] ?? null;
  const evaluatedAtMs = Date.parse(evaluatedAtUtc);
  const nextEval = nextSession
    ? evaluateClassSessionAvailability(
        {
          startsAt: nextSession.startsAt,
          endsAt: nextSession.endsAt,
          registrationDeadlineAt: nextSession.registrationDeadlineAt,
          capacity: nextSession.capacity,
          seatsLeft: nextSession.seatsLeft,
          status: nextSession.status,
          isRegistrationOpen: nextSession.isRegistrationOpen,
          branchIsActive: true,
          programIsPublic: true,
        },
        Number.isFinite(evaluatedAtMs) ? evaluatedAtMs : 0,
      )
    : null;

  const effectivePrice = nextSession?.effectivePriceIdr ?? program.basePriceIdr;

  const badges: ProductBadgeItem[] = [
    ...(nextSession && nextEval
      ? [
          {
            id: 'branch',
            label: nextSession.branch.name,
            icon: <MapPin size={13} aria-hidden="true" />,
            tone: 'accent' as const,
          },
          {
            id: 'status',
            label: nextEval.statusBadgeLabel,
            tone: (nextSession.isRegisterable
              ? 'success'
              : 'neutral') as ProductBadgeItem['tone'],
          },
          {
            id: 'seats',
            label:
              nextSession.seatsLeft !== null
                ? `Sisa kuota: ${nextSession.seatsLeft}`
                : `Kapasitas ${nextSession.capacity}`,
            icon: <Users size={13} aria-hidden="true" />,
            tone: 'neutral' as const,
          },
        ]
      : [
          {
            id: 'no-sessions',
            label: CLASSES_COPY.NO_FUTURE_SESSIONS_BADGE,
            tone: 'neutral' as const,
          },
        ]),
    ...(ageLabel
      ? [
          {
            id: 'age',
            label: ageLabel,
            tone: 'neutral' as const,
          },
        ]
      : []),
    ...(program.durationMinutes
      ? [
          {
            id: 'duration',
            label: `${program.durationMinutes} menit`,
            icon: <Clock size={13} aria-hidden="true" />,
            tone: 'neutral' as const,
          },
        ]
      : []),
  ];

  const scheduleText = nextSession
    ? formatClassScheduleJakarta(nextSession.startsAt, nextSession.endsAt)
    : CLASSES_COPY.NO_FUTURE_SESSIONS_TITLE;

  const scheduleNote = nextSession?.registrationDeadlineAt
    ? `Batas daftar: ${formatJakartaDateTimeDisplay(nextSession.registrationDeadlineAt)}`
    : null;

  const scheduleAction =
    !nextSession && contactBranch ? (
      <a
        href={buildAskNextClassWhatsAppUrl(
          contactBranch.whatsappNumber,
          contactBranch.name,
          program.title,
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="baking-class-wa-link"
      >
        <MessageCircle size={14} aria-hidden="true" />
        <span>{CLASSES_COPY.ASK_NEXT_CLASS_CTA}</span>
      </a>
    ) : undefined;

  return (
    <BakingClassCard
      title={program.title}
      titleAs="h2"
      description={program.shortDescription ?? program.description}
      coverImageUrl={program.coverImageUrl}
      coverAlt={program.coverAltText}
      badges={badges}
      scheduleText={scheduleText}
      scheduleMuted={!nextSession}
      scheduleNote={scheduleNote}
      scheduleAction={scheduleAction}
      priceIdr={effectivePrice}
      href={withBranch(
        `${ROUTES.CLASSES}/${program.slug}`,
        branchCode ?? nextSession?.branch.code ?? null,
      )}
      ctaLabel={CLASSES_COPY.DETAIL_CTA}
      ctaVariant={
        program.registerableSessionCount > 0 ? 'primary' : 'secondary'
      }
      className={className}
    />
  );
}
