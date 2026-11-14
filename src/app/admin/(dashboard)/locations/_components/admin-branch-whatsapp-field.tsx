'use client';

import { ExternalLink } from 'lucide-react';

import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';

interface AdminBranchWhatsappFieldProps {
  branchId: string;
  whatsappNumber: string;
  waTargetPreview: string | null;
  whatsappChanged: boolean;
  confirmWhatsappChange: boolean;
  whatsappError?: string;
  confirmError?: string;
  onWhatsappChange: (value: string) => void;
  onConfirmChange: (checked: boolean) => void;
}

/** WhatsApp number field with live wa.me target preview and change re-verification checkbox. */
export function AdminBranchWhatsappField({
  branchId,
  whatsappNumber,
  waTargetPreview,
  whatsappChanged,
  confirmWhatsappChange,
  whatsappError,
  confirmError,
  onWhatsappChange,
  onConfirmChange,
}: AdminBranchWhatsappFieldProps) {
  return (
    <>
      <FormField
        id={`branch-wa-${branchId}`}
        label="Nomor WhatsApp Cabang"
        required
        helper="Format digit internasional tanpa tanda + (contoh 6281703384308). Awalan 08 akan dinormalisasi ke 62."
        error={whatsappError}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            inputMode="tel"
            value={whatsappNumber}
            onChange={(event) => onWhatsappChange(event.target.value)}
          />
        )}
      </FormField>

      {waTargetPreview ? (
        <div className="admin-wa-preview-box">
          <span>{ADMIN_CATALOG_COPY.LOCATIONS.WA_PREVIEW_PREFIX}</span>{' '}
          <a
            href={waTargetPreview}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-wa-preview-link"
          >
            <span>{waTargetPreview}</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      ) : (
        <Feedback
          tone="error"
          title={ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_WHATSAPP}
        />
      )}

      {whatsappChanged ? (
        <div className="admin-confirm-box">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={confirmWhatsappChange}
              onChange={(event) => onConfirmChange(event.target.checked)}
            />
            <span>{ADMIN_CATALOG_COPY.LOCATIONS.WA_REVERIFY_LABEL}</span>
          </label>
          {confirmError ? (
            <p className="admin-field-error">{confirmError}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
