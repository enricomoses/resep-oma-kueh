'use client';

import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  MessageCircle,
  Users,
} from 'lucide-react';
import Image from 'next/image';

import { MediaPlaceholder } from '@/components/common/media-placeholder';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { PublicBranch } from '@/types/branch';
import type { PublicClassProgram } from '@/types/classes';
import { cn } from '@/utils';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';
import { withBranch } from '@/utils/branch-url';
import {
  buildAskNextClassWhatsAppUrl,
  evaluateClassSessionAvailability,
  formatClassAgeRange,
  formatClassScheduleJakarta,
} from '@/utils/classes';
import { formatIdr } from '@/utils/currency';

interface ClassProgramCardProps {
  program: PublicClassProgram;
  evaluatedAtUtc: string;
  branchCode: string | null;
  contactBranch: PublicBranch | null;
  className?: string;
}

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

  return (
    <Card className={cn('classes-program-card', className)}>
      {program.coverImageUrl ? (
        <div className="classes-card-media-frame">
          <Image
            src={program.coverImageUrl}
            alt={program.coverAltText}
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="classes-card-media-img"
          />
        </div>
      ) : (
        <MediaPlaceholder
          caption={program.coverAltText}
          className="classes-card-media"
        />
      )}

      <div className="classes-badge-row">
        <Badge tone="accent">Mulai {formatIdr(program.basePriceIdr)}</Badge>
        {ageLabel ? <Badge tone="neutral">{ageLabel}</Badge> : null}
        {program.durationMinutes ? (
          <Badge tone="neutral">
            <Clock size={14} aria-hidden="true" />
            {program.durationMinutes} menit
          </Badge>
        ) : null}
      </div>

      <div className="classes-card-body">
        <h2>{program.title}</h2>
        <p>{program.shortDescription ?? program.description}</p>
      </div>

      {nextSession && nextEval ? (
        <div className="classes-next-session-box">
          <div className="classes-badge-row">
            <Badge tone="accent">
              <MapPin size={14} aria-hidden="true" />
              {nextSession.branch.name}
            </Badge>
            <Badge tone={nextSession.isRegisterable ? 'success' : 'neutral'}>
              {nextEval.statusBadgeLabel}
            </Badge>
            <Badge tone="neutral">
              <Users size={14} aria-hidden="true" />
              {nextSession.seatsLeft !== null
                ? `Sisa kuota: ${nextSession.seatsLeft}`
                : `Kapasitas perkiraan ${nextSession.capacity}`}
            </Badge>
          </div>
          <p className="classes-schedule-line">
            <CalendarDays size={15} aria-hidden="true" />
            <span>
              {formatClassScheduleJakarta(
                nextSession.startsAt,
                nextSession.endsAt,
              )}
            </span>
          </p>
          {nextSession.registrationDeadlineAt ? (
            <p className="classes-meta-note">
              Batas daftar:{' '}
              {formatJakartaDateTimeDisplay(nextSession.registrationDeadlineAt)}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="classes-next-session-box">
          <p className="classes-meta-note">
            {CLASSES_COPY.NO_FUTURE_SESSIONS_TITLE}
          </p>
          {contactBranch ? (
            <a
              href={buildAskNextClassWhatsAppUrl(
                contactBranch.whatsappNumber,
                contactBranch.name,
                program.title,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="classes-wa-inquiry-link"
            >
              <MessageCircle size={15} aria-hidden="true" />
              {CLASSES_COPY.ASK_NEXT_CLASS_CTA}
            </a>
          ) : null}
        </div>
      )}

      <div className="classes-card-actions">
        <ActionLink
          href={withBranch(
            `${ROUTES.CLASSES}/${program.slug}`,
            branchCode ?? nextSession?.branch.code ?? null,
          )}
          variant={
            program.registerableSessionCount > 0 ? 'primary' : 'secondary'
          }
          prefetch={false}
        >
          {CLASSES_COPY.DETAIL_CTA}
          <ArrowRight size={16} aria-hidden="true" />
        </ActionLink>
      </div>
    </Card>
  );
}
