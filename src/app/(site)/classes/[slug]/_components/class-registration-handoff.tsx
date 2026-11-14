'use client';

import { Check, Copy, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { CLASSES_COPY } from '@/constants/classes.constant';
import type { PrepareClassRegistrationResult } from '@/types/classes';
import { cn } from '@/utils';
import { formatIdr } from '@/utils/currency';

interface ClassRegistrationHandoffProps {
  prepared: PrepareClassRegistrationResult;
  copyFeedback: { tone: 'success' | 'error'; text: string } | null;
  onCopyMessage: () => void;
  className?: string;
}

export function ClassRegistrationHandoff({
  prepared,
  copyFeedback,
  onCopyMessage,
  className,
}: ClassRegistrationHandoffProps) {
  return (
    <div className={cn('classes-wa-result-box', className)} aria-live="polite">
      <h3>Pratinjau Pengajuan WhatsApp ({prepared.branchName})</h3>
      <p className="classes-meta-note">
        Estimasi total: <strong>{formatIdr(prepared.estimatedTotalIdr)}</strong>{' '}
        ({prepared.attendeeCount} x {formatIdr(prepared.unitPriceIdr)}) ·{' '}
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
        <Feedback tone={copyFeedback.tone} title={copyFeedback.text} announce />
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
        <Button type="button" variant="secondary" onClick={onCopyMessage}>
          {copyFeedback?.tone === 'success' ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
          {CLASSES_COPY.COPY_MESSAGE_CTA}
        </Button>
      </div>
    </div>
  );
}
