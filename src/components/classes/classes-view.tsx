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

import { MediaPlaceholder } from '@/app/_components';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicClasses } from '@/hooks/use-classes';
import type { PublicClassesListData } from '@/types/classes';
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

export type InitialPublicClasses =
  { status: 'success'; data: PublicClassesListData } | { status: 'error' };

interface ClassesViewProps {
  initial: InitialPublicClasses;
  className?: string;
}

export function ClassesView({ initial, className }: ClassesViewProps) {
  const { selected, code, items: activeBranches } = useBranches();
  const branchCode = selected?.code ?? code;

  const query = usePublicClasses(
    branchCode,
    initial.status === 'success' ? initial.data : undefined,
  );

  const data = query.data;
  const contactBranch = selected ?? activeBranches[0] ?? null;

  return (
    <main
      id={SITE_COPY.MAIN_ID}
      tabIndex={-1}
      className={cn('content-container classes-main', className)}
    >
      <header className="classes-hero-header">
        <Badge tone="accent">{CLASSES_COPY.EYEBROW}</Badge>
        <h1 className="editorial-heading">{CLASSES_COPY.TITLE}</h1>
        <p className="classes-subtitle">{CLASSES_COPY.SUBTITLE}</p>
        <p className="classes-policy-note">
          {CLASSES_COPY.NO_FALSE_DATES_NOTE}
        </p>
        {selected ? (
          <Badge tone="success">
            <MapPin size={14} aria-hidden="true" />
            Cabang terpilih: {selected.name}
          </Badge>
        ) : (
          <Badge tone="neutral">
            Menampilkan jadwal dari seluruh cabang aktif
          </Badge>
        )}
      </header>

      <Feedback tone="info" title={CLASSES_COPY.CAPACITY_DISCLAIMER} />

      {query.isError || (!data && initial.status === 'error') ? (
        <Feedback tone="error" title={CLASSES_COPY.ERROR_LOAD}>
          <div className="classes-inline-actions">
            <ActionLink
              href={withBranch(ROUTES.CONTACT, branchCode)}
              variant="secondary"
              prefetch={false}
            >
              {CLASSES_COPY.ASK_NEXT_CLASS_CTA}
            </ActionLink>
          </div>
        </Feedback>
      ) : !data || data.items.length === 0 ? (
        <Card tone="cream" className="classes-empty-card">
          <h2>{CLASSES_COPY.EMPTY_PROGRAMS_TITLE}</h2>
          <p>{CLASSES_COPY.EMPTY_PROGRAMS_BODY}</p>
          <div className="classes-inline-actions">
            {contactBranch ? (
              <a
                href={buildAskNextClassWhatsAppUrl(
                  contactBranch.whatsappNumber,
                  contactBranch.name,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-burgundy)] px-5 py-2.5 text-sm font-medium text-white"
              >
                <MessageCircle size={16} aria-hidden="true" />
                {CLASSES_COPY.ASK_NEXT_CLASS_CTA}
              </a>
            ) : (
              <ActionLink
                href={withBranch(ROUTES.CONTACT, branchCode)}
                variant="primary"
                prefetch={false}
              >
                {CLASSES_COPY.ASK_NEXT_CLASS_CTA}
              </ActionLink>
            )}
          </div>
        </Card>
      ) : (
        <div className="classes-program-grid">
          {data.items.map((program) => {
            const ageLabel = formatClassAgeRange(
              program.ageMin,
              program.ageMax,
            );
            const nextSession = program.upcomingSessions[0] ?? null;
            const evaluatedAtMs = Date.parse(data.evaluatedAtUtc);
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
              <Card key={program.id} className="classes-program-card">
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
                  <Badge tone="accent">
                    Mulai {formatIdr(program.basePriceIdr)}
                  </Badge>
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
                      <Badge
                        tone={
                          nextSession.isRegisterable ? 'success' : 'neutral'
                        }
                      >
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
                        {formatJakartaDateTimeDisplay(
                          nextSession.registrationDeadlineAt,
                        )}
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
                      program.registerableSessionCount > 0
                        ? 'primary'
                        : 'secondary'
                    }
                    prefetch={false}
                  >
                    {CLASSES_COPY.DETAIL_CTA}
                    <ArrowRight size={16} aria-hidden="true" />
                  </ActionLink>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
