'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CLASSES_COPY, CLASSES_LIMITS } from '@/constants/classes.constant';
import { ROUTES } from '@/constants/routes.constant';
import { usePrepareClassRegistration } from '@/hooks/use-classes';
import { ApiClientError } from '@/lib/errors';
import type { PublicBranch } from '@/types/branch';
import type {
  PrepareClassRegistrationResult,
  PublicClassProgram,
} from '@/types/classes';
import { cn } from '@/utils';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';
import { withBranch } from '@/utils/branch-url';
import {
  buildAskNextClassWhatsAppUrl,
  evaluateClassSessionAvailability,
  formatClassScheduleJakarta,
} from '@/utils/classes';
import { formatIdr } from '@/utils/currency';

const registrationFormSchema = z.object({
  sessionId: z.uuid('Pilih sesi kelas yang tersedia.'),
  attendeeCount: z.number().int().min(1, 'Minimal 1 peserta.').max(20),
  adultContactName: z
    .string()
    .trim()
    .max(CLASSES_LIMITS.MAX_ADULT_CONTACT_NAME_LENGTH)
    .refine((val) => !/<[/!A-Za-z]|<[^>]*>|javascript:/i.test(val), {
      message: 'Nama kontak tidak boleh mengandung tag HTML atau script.',
    }),
  manualConfirmed: z.boolean().refine((val) => val === true, {
    message: 'Centang konfirmasi alur WhatsApp manual sebelum melanjutkan.',
  }),
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

interface ClassRegistrationPanelProps {
  program: PublicClassProgram;
  evaluatedAtUtc: string;
  selectedBranch: PublicBranch | null;
  activeBranches: readonly PublicBranch[];
  branchCode: string | null;
  className?: string;
}

export function ClassRegistrationPanel({
  program,
  evaluatedAtUtc,
  selectedBranch,
  activeBranches,
  branchCode,
  className,
}: ClassRegistrationPanelProps) {
  const registerableSessions = program.upcomingSessions.filter(
    (session) => session.isRegisterable,
  );
  const nonRegisterableSessions = program.upcomingSessions.filter(
    (session) => !session.isRegisterable,
  );

  const [preparedEntry, setPreparedEntry] = useState<{
    key: string;
    result: PrepareClassRegistrationResult;
  } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copyFeedbackEntry, setCopyFeedbackEntry] = useState<{
    key: string;
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const prepareMutation = usePrepareClassRegistration();
  const defaultSessionId = registerableSessions[0]?.id ?? '';

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      sessionId: defaultSessionId,
      attendeeCount: 1,
      adultContactName: '',
      manualConfirmed: false,
    },
  });

  const watchedSessionId = useWatch({
    control: form.control,
    name: 'sessionId',
  });
  const watchedAttendees = useWatch({
    control: form.control,
    name: 'attendeeCount',
  });
  const watchedAdultName = useWatch({
    control: form.control,
    name: 'adultContactName',
  });
  const watchedManualConfirmed = useWatch({
    control: form.control,
    name: 'manualConfirmed',
  });

  const currentInputKey = `${watchedSessionId}|${watchedAttendees}|${watchedAdultName}|${branchCode ?? ''}`;
  const prepared =
    preparedEntry && preparedEntry.key === currentInputKey
      ? preparedEntry.result
      : null;
  const copyFeedback =
    copyFeedbackEntry && copyFeedbackEntry.key === currentInputKey
      ? { tone: copyFeedbackEntry.tone, text: copyFeedbackEntry.text }
      : null;

  useEffect(() => {
    if (
      registerableSessions.length > 0 &&
      !registerableSessions.some((session) => session.id === watchedSessionId)
    ) {
      form.setValue('sessionId', registerableSessions[0]!.id);
    }
  }, [registerableSessions, watchedSessionId, form]);

  const activeSession =
    registerableSessions.find((session) => session.id === watchedSessionId) ??
    registerableSessions[0] ??
    null;

  const maxSeatsAllowed = activeSession
    ? Math.min(
        activeSession.seatsLeft ?? activeSession.capacity,
        CLASSES_LIMITS.MAX_ATTENDEES_PER_REGISTRATION,
      )
    : CLASSES_LIMITS.MAX_ATTENDEES_PER_REGISTRATION;

  const evaluatedMs = Date.parse(evaluatedAtUtc);
  const safeEvalMs = Number.isFinite(evaluatedMs) ? evaluatedMs : 0;
  const fallbackBranch = selectedBranch ?? activeBranches[0] ?? null;

  async function onSubmit(values: RegistrationFormValues) {
    if (prepareMutation.isPending) return;
    setServerError(null);
    setCopyFeedbackEntry(null);
    const submitKey = `${values.sessionId}|${values.attendeeCount}|${values.adultContactName}|${branchCode ?? ''}`;

    try {
      const result = await prepareMutation.mutateAsync({
        sessionId: values.sessionId,
        attendeeCount: values.attendeeCount,
        adultContactName: values.adultContactName.trim() || null,
      });
      setPreparedEntry({ key: submitKey, result });
    } catch (err) {
      setPreparedEntry(null);
      if (err instanceof ApiClientError) {
        setServerError(err.message);
        return;
      }
      setServerError(CLASSES_COPY.WA_ERRORS.UPSTREAM_ERROR);
    }
  }

  async function handleCopyMessage() {
    if (!prepared) return;
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(prepared.whatsappMessage);
      setCopyFeedbackEntry({
        key: currentInputKey,
        tone: 'success',
        text: CLASSES_COPY.COPY_SUCCESS,
      });
    } catch {
      setCopyFeedbackEntry({
        key: currentInputKey,
        tone: 'error',
        text: CLASSES_COPY.COPY_FAILURE,
      });
    }
  }

  return (
    <div className={cn('classes-registration-stack', className)}>
      <Card tone="surface" className="classes-sessions-card">
        <h2>Jadwal Sesi Cabang (WIB)</h2>
        {program.upcomingSessions.length === 0 ? (
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
                  program.title,
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
            {[...registerableSessions, ...nonRegisterableSessions].map(
              (session) => {
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
                  safeEvalMs,
                );
                const isSelected = activeSession?.id === session.id;

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
                      <Badge
                        tone={session.isRegisterable ? 'success' : 'neutral'}
                      >
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
                      <Users
                        size={14}
                        aria-hidden="true"
                        className="mr-1 inline"
                      />
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
                        onClick={() => form.setValue('sessionId', session.id)}
                      >
                        {isSelected ? 'Sesi Terpilih' : 'Pilih Sesi Ini'}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled
                      >
                        {evaluation.statusBadgeLabel}
                      </Button>
                    )}
                  </Card>
                );
              },
            )}
          </div>
        )}
      </Card>

      {registerableSessions.length > 0 ? (
        <Card tone="cream" className="classes-register-card">
          <h2>{CLASSES_COPY.REGISTER_SECTION_TITLE}</h2>
          <Feedback tone="info" title={CLASSES_COPY.PRIVACY_NO_CHILD_NOTE} />

          {serverError ? (
            <Feedback tone="error" title={serverError} announce />
          ) : null}

          <form
            className="classes-register-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <FormField
              id="class-session-select"
              label="Pilih Sesi Tersedia"
              error={form.formState.errors.sessionId?.message}
              required
            >
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={watchedSessionId}
                  onChange={(e) => form.setValue('sessionId', e.target.value)}
                >
                  {registerableSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.branch.name} —{' '}
                      {formatClassScheduleJakarta(
                        session.startsAt,
                        session.endsAt,
                      )}{' '}
                      ({formatIdr(session.effectivePriceIdr)})
                    </option>
                  ))}
                </Select>
              )}
            </FormField>

            <FormField
              id="class-attendee-count"
              label="Jumlah Peserta"
              helper={`Maksimal ${maxSeatsAllowed} peserta per pengajuan WhatsApp.`}
              error={form.formState.errors.attendeeCount?.message}
              required
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min={1}
                  max={maxSeatsAllowed}
                  value={watchedAttendees}
                  onChange={(e) => {
                    const nextVal = Number.parseInt(e.target.value || '1', 10);
                    form.setValue(
                      'attendeeCount',
                      Number.isFinite(nextVal) ? nextVal : 1,
                    );
                  }}
                />
              )}
            </FormField>

            <FormField
              id="class-adult-contact-name"
              label="Nama Kontak Wali / Orang Tua (opsional)"
              helper="Opsional agar admin dapat menyapa saat membalas di WhatsApp. Jangan masukkan identitas anak."
              error={form.formState.errors.adultContactName?.message}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  maxLength={CLASSES_LIMITS.MAX_ADULT_CONTACT_NAME_LENGTH}
                  placeholder="Contoh: Ibu Rina"
                  value={watchedAdultName}
                  onChange={(e) =>
                    form.setValue('adultContactName', e.target.value)
                  }
                />
              )}
            </FormField>

            <div className="classes-consent-row">
              <label
                htmlFor="class-manual-confirmed"
                className="classes-checkbox-label"
              >
                <input
                  id="class-manual-confirmed"
                  type="checkbox"
                  checked={watchedManualConfirmed}
                  onChange={(e) =>
                    form.setValue('manualConfirmed', e.target.checked)
                  }
                />
                <span>{CLASSES_COPY.MANUAL_CONFIRM_LABEL}</span>
              </label>
              {form.formState.errors.manualConfirmed?.message ? (
                <p className="admin-field-error" role="alert">
                  {form.formState.errors.manualConfirmed.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={prepareMutation.isPending}
              disabled={prepareMutation.isPending}
            >
              <MessageCircle size={16} aria-hidden="true" />
              {prepareMutation.isPending
                ? CLASSES_COPY.REGISTER_SUBMITTING
                : CLASSES_COPY.REGISTER_SUBMIT_CTA}
            </Button>
          </form>

          {prepared ? (
            <div className="classes-wa-result-box" aria-live="polite">
              <h3>Pratinjau Pengajuan WhatsApp ({prepared.branchName})</h3>
              <p className="classes-meta-note">
                Estimasi total:{' '}
                <strong>{formatIdr(prepared.estimatedTotalIdr)}</strong> (
                {prepared.attendeeCount} x {formatIdr(prepared.unitPriceIdr)}) ·{' '}
                {prepared.manualConfirmationNote}
              </p>

              {prepared.requiresCopy ? (
                <Feedback tone="info" title={CLASSES_COPY.URL_TOO_LONG_NOTE} />
              ) : null}

              <label htmlFor="class-wa-message-preview" className="sr-only">
                Teks pesan WhatsApp
              </label>
              <textarea
                id="class-wa-message-preview"
                readOnly
                rows={10}
                value={prepared.whatsappMessage}
                className="classes-wa-textarea"
              />

              {copyFeedback ? (
                <Feedback
                  tone={copyFeedback.tone}
                  title={copyFeedback.text}
                  announce
                />
              ) : null}

              <div className="classes-inline-actions">
                <a
                  href={prepared.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-burgundy)] px-5 py-2.5 text-sm font-medium text-white"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  {CLASSES_COPY.OPEN_WHATSAPP_CTA}
                </a>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleCopyMessage()}
                >
                  {copyFeedback?.tone === 'success' ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )}
                  {CLASSES_COPY.COPY_MESSAGE_CTA}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      ) : program.upcomingSessions.length > 0 ? (
        <Card tone="cream" className="classes-empty-card">
          <h2>{CLASSES_COPY.NO_FUTURE_SESSIONS_TITLE}</h2>
          <p>{CLASSES_COPY.NO_FUTURE_SESSIONS_BODY}</p>
          {fallbackBranch ? (
            <a
              href={buildAskNextClassWhatsAppUrl(
                fallbackBranch.whatsappNumber,
                fallbackBranch.name,
                program.title,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-burgundy)] px-5 py-2.5 text-sm font-medium text-white"
            >
              <MessageCircle size={16} aria-hidden="true" />
              {CLASSES_COPY.ASK_NEXT_CLASS_CTA}
            </a>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
