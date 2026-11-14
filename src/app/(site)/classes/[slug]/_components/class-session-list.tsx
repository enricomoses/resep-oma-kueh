'use client';

import { CalendarDays, MapPin, MessageCircle, Users } from 'lucide-react';

import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { PublicBranch } from '@/types/branch';
import type { PublicClassSession } from '@/types/classes';
import { cn } from '@/utils';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';
import { withBranch } from '@/utils/branch-url';
import {
  buildAskNextClassWhatsAppUrl,
  evaluateClassSessionAvailability,
  formatClassScheduleJakarta,
} from '@/utils/classes';
import { formatIdr } from '@/utils/currency';

interface ClassSessionListProps {
  programTitle: string;
  sessions: PublicClassSession[];
  activeSessionId: string | null;
  evaluatedMs: number;
  fallbackBranch: PublicBranch | null;
  branchCode: string | null;
  onSelectSession: (sessionId: string) => void;
  className?: string;
}

export function ClassSessionList({
  programTitle,
  sessions,
  activeSessionId,
  evaluatedMs,
  fallbackBranch,
  branchCode,
  onSelectSession,
  className,
}: ClassSessionListProps) {
  return (
    <Card tone="surface" className={cn('classes-sessions-card', className)}>
      <h2>Jadwal Sesi Cabang (WIB)</h2>
      {sessions.length === 0 ? (
        <div className="classes-empty-sessions">
          <p>{CLASSES_COPY.NO_FUTURE_SESSIONS_TITLE}</p>
          <p className="classes-meta-note">
            {CLASSES_COPY.NO_FUTURE_SESSIONS_BODY}
          </p>
          {fallbackBranch ? (
            <a
              href={buildAskNextClassWhatsAppUrl(
                fallbackBranch.whatsappNumber,
                fallbackBranch.name,
                programTitle,
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
      ) : (
        <div className="classes-session-list">
          {sessions.map((session) => {
            const evaluation = evaluateClassSessionAvailability(
              {
                startsAt: session.startsAt,
                endsAt: session.endsAt,
                registrationDeadlineAt: session.registrationDeadlineAt,
                capacity: session.capacity,
                seatsLeft: session.seatsLeft,
                status: session.status,
                isRegistrationOpen: session.isRegistrationOpen,
                branchIsActive: true,
                programIsPublic: true,
              },
              evaluatedMs,
            );
            const isSelected = activeSessionId === session.id;

            return (
              <Card
                key={session.id}
                tone={isSelected ? 'cream' : 'surface'}
                className={cn(
                  'classes-session-item',
                  !session.isRegisterable && 'classes-session-item--closed',
                )}
              >
                <div className="classes-badge-row">
                  <Badge tone="accent">
                    <MapPin size={14} aria-hidden="true" />
                    {session.branch.name}
                  </Badge>
                  <Badge tone={session.isRegisterable ? 'success' : 'neutral'}>
                    {evaluation.statusBadgeLabel}
                  </Badge>
                  <Badge tone="neutral">
                    {formatIdr(session.effectivePriceIdr)} / peserta
                    {session.hasPriceOverride ? ' (Harga cabang)' : ''}
                  </Badge>
                </div>

                <p className="classes-schedule-line">
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>
                    {formatClassScheduleJakarta(
                      session.startsAt,
                      session.endsAt,
                    )}
                  </span>
                </p>

                <p className="classes-meta-note">
                  <Users size={14} aria-hidden="true" className="mr-1 inline" />
                  {session.seatsLeft !== null
                    ? `Perkiraan sisa kuota: ${session.seatsLeft} dari ${session.capacity} kursi`
                    : `Kapasitas perkiraan: ${session.capacity} kursi (${CLASSES_COPY.UNKNOWN_SEATS_NOTE})`}
                </p>

                {session.registrationDeadlineAt ? (
                  <p className="classes-meta-note">
                    Batas pendaftaran:{' '}
                    {formatJakartaDateTimeDisplay(
                      session.registrationDeadlineAt,
                    )}
                  </p>
                ) : null}

                {session.isRegisterable ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={isSelected ? 'primary' : 'secondary'}
                    onClick={() => onSelectSession(session.id)}
                  >
                    {isSelected ? 'Sesi Terpilih' : 'Pilih Sesi Ini'}
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="secondary" disabled>
                    {evaluation.statusBadgeLabel}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
}
