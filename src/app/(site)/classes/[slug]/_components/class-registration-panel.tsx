'use client';

import { MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CLASSES_COPY, CLASSES_LIMITS } from '@/constants/classes.constant';
import { useClassRegistrationFlow } from '@/hooks/use-class-registration-flow';
import type { PublicBranch } from '@/types/branch';
import type { PublicClassProgram } from '@/types/classes';
import { cn } from '@/utils';
import {
  buildAskNextClassWhatsAppUrl,
  formatClassScheduleJakarta,
} from '@/utils/classes';
import { formatIdr } from '@/utils/currency';

import { ClassRegistrationHandoff } from './class-registration-handoff';
import { ClassSessionList } from './class-session-list';

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

  const flow = useClassRegistrationFlow({ registerableSessions, branchCode });

  const evaluatedMs = Date.parse(evaluatedAtUtc);
  const safeEvalMs = Number.isFinite(evaluatedMs) ? evaluatedMs : 0;
  const fallbackBranch = selectedBranch ?? activeBranches[0] ?? null;

  return (
    <div className={cn('classes-registration-stack', className)}>
      <ClassSessionList
        programTitle={program.title}
        sessions={[...registerableSessions, ...nonRegisterableSessions]}
        activeSessionId={flow.activeSession?.id ?? null}
        evaluatedMs={safeEvalMs}
        fallbackBranch={fallbackBranch}
        branchCode={branchCode}
        onSelectSession={(sessionId) =>
          flow.form.setValue('sessionId', sessionId)
        }
      />

      {registerableSessions.length > 0 ? (
        <Card tone="cream" className="classes-register-card">
          <h2>{CLASSES_COPY.REGISTER_SECTION_TITLE}</h2>
          <Feedback tone="info" title={CLASSES_COPY.PRIVACY_NO_CHILD_NOTE} />

          {flow.serverError ? (
            <Feedback tone="error" title={flow.serverError} announce />
          ) : null}

          <form
            className="classes-register-form"
            onSubmit={flow.onSubmitForm}
            noValidate
          >
            <FormField
              id="class-session-select"
              label="Pilih Sesi Tersedia"
              error={flow.form.formState.errors.sessionId?.message}
              required
            >
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={flow.watchedSessionId}
                  onChange={(e) =>
                    flow.form.setValue('sessionId', e.target.value)
                  }
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
              helper={`Maksimal ${flow.maxSeatsAllowed} peserta per pengajuan WhatsApp.`}
              error={flow.form.formState.errors.attendeeCount?.message}
              required
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min={1}
                  max={flow.maxSeatsAllowed}
                  value={flow.watchedAttendees}
                  onChange={(e) => {
                    const nextVal = Number.parseInt(e.target.value || '1', 10);
                    flow.form.setValue(
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
              error={flow.form.formState.errors.adultContactName?.message}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  maxLength={CLASSES_LIMITS.MAX_ADULT_CONTACT_NAME_LENGTH}
                  placeholder="Contoh: Ibu Rina"
                  value={flow.watchedAdultName}
                  onChange={(e) =>
                    flow.form.setValue('adultContactName', e.target.value)
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
                  checked={flow.watchedManualConfirmed}
                  onChange={(e) =>
                    flow.form.setValue('manualConfirmed', e.target.checked)
                  }
                />
                <span>{CLASSES_COPY.MANUAL_CONFIRM_LABEL}</span>
              </label>
              {flow.form.formState.errors.manualConfirmed?.message ? (
                <p className="admin-field-error" role="alert">
                  {flow.form.formState.errors.manualConfirmed.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={flow.isPending}
              disabled={flow.isPending}
            >
              <MessageCircle size={16} aria-hidden="true" />
              {flow.isPending
                ? CLASSES_COPY.REGISTER_SUBMITTING
                : CLASSES_COPY.REGISTER_SUBMIT_CTA}
            </Button>
          </form>

          {flow.prepared ? (
            <ClassRegistrationHandoff
              prepared={flow.prepared}
              copyFeedback={flow.copyFeedback}
              onCopyMessage={flow.handleCopyMessage}
            />
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
