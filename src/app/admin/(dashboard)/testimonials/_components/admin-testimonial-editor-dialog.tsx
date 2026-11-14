'use client';

import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  AdminPublishingStatus,
  TestimonialFormState,
} from '@/types/admin-cms';

interface AdminTestimonialEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: TestimonialFormState;
  onFormChange: (next: TestimonialFormState) => void;
  fieldErrors: Record<string, string[]>;
  isSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function AdminTestimonialEditorDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  fieldErrors,
  isSaving,
  onSubmit,
}: AdminTestimonialEditorDialogProps) {
  function getError(field: string) {
    return fieldErrors[field]?.[0];
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={form.id ? 'Ubah Testimoni & Bukti Izin' : 'Tambah Draf Testimoni'}
      description="Simpan catatan izin tanpa mengunggah screenshot WhatsApp atau data pribadi pelanggan."
    >
      <form onSubmit={onSubmit} className="admin-form-grid">
        <FormField
          id="testimonial-display-name"
          label="Nama Tampil Publik (Anonim by default)"
          error={getError('displayName')}
          required
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              value={form.displayName}
              onChange={(e) =>
                onFormChange({ ...form, displayName: e.target.value })
              }
            />
          )}
        </FormField>

        <FormField
          id="testimonial-quote"
          label="Kutipan Testimoni"
          error={getError('quote')}
          required
        >
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={4}
              value={form.quote}
              onChange={(e) => onFormChange({ ...form, quote: e.target.value })}
            />
          )}
        </FormField>

        <div className="admin-form-grid admin-form-grid--two">
          <FormField
            id="testimonial-rating"
            label="Rating (1–5, opsional)"
            error={getError('rating')}
          >
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={form.rating}
                onChange={(e) =>
                  onFormChange({ ...form, rating: e.target.value })
                }
              >
                <option value="">Tanpa Rating</option>
                <option value="5">5 / 5</option>
                <option value="4">4 / 5</option>
                <option value="3">3 / 5</option>
                <option value="2">2 / 5</option>
                <option value="1">1 / 5</option>
              </Select>
            )}
          </FormField>

          <FormField
            id="testimonial-status"
            label="Status Publikasi"
            error={getError('status')}
          >
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={form.status}
                onChange={(e) =>
                  onFormChange({
                    ...form,
                    status: e.target.value as AdminPublishingStatus,
                  })
                }
              >
                <option value="draft">Draf</option>
                <option value="published">Terpublikasi (Wajib Izin)</option>
                <option value="archived">Diarsipkan</option>
              </Select>
            )}
          </FormField>
        </div>

        <div className="admin-form-grid admin-form-grid--two">
          <FormField
            id="testimonial-source-label"
            label="Label Sumber"
            error={getError('sourceLabel')}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={form.sourceLabel}
                onChange={(e) =>
                  onFormChange({ ...form, sourceLabel: e.target.value })
                }
              />
            )}
          </FormField>

          <FormField
            id="testimonial-source-url"
            label="URL Sumber (HTTPS opsional)"
            error={getError('sourceUrl')}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="url"
                placeholder="https://..."
                value={form.sourceUrl}
                onChange={(e) =>
                  onFormChange({ ...form, sourceUrl: e.target.value })
                }
              />
            )}
          </FormField>
        </div>

        <div className="admin-form-grid admin-form-grid--two">
          <FormField
            id="testimonial-consent-at"
            label="Tanggal Persetujuan Privat (consent_at)"
            error={getError('consentAt')}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="date"
                value={form.consentAt}
                onChange={(e) =>
                  onFormChange({ ...form, consentAt: e.target.value })
                }
              />
            )}
          </FormField>

          <FormField
            id="testimonial-consent-ref"
            label="Referensi Bukti Izin Privat (Non-PII)"
            helper="Contoh: Izin tertulis arsip internal #2026-11 (tanpa nomor HP/nama lengkap)."
            error={getError('consentReference')}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={form.consentReference}
                onChange={(e) =>
                  onFormChange({ ...form, consentReference: e.target.value })
                }
              />
            )}
          </FormField>
        </div>

        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSaving}
            loadingLabel="Menyimpan..."
          >
            Simpan Testimoni
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
