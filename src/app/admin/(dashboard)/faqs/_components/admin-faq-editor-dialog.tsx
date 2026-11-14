'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { AdminPublishingStatus, FaqFormState } from '@/types/admin-cms';

interface AdminFaqEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FaqFormState;
  onFormChange: (next: FaqFormState) => void;
  fieldErrors: Record<string, string[]>;
  isSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function AdminFaqEditorDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  fieldErrors,
  isSaving,
  onSubmit,
}: AdminFaqEditorDialogProps) {
  function getError(field: string) {
    return fieldErrors[field]?.[0];
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={form.id ? 'Ubah FAQ' : 'Tambah FAQ Baru'}
      description="Gunakan teks polos tanpa HTML. Hanya FAQ Terpublikasi yang muncul di halaman publik dan Asisten Ask Oma."
    >
      <form onSubmit={onSubmit} className="admin-form-grid">
        <FormField
          id="faq-category"
          label="Kategori"
          error={getError('category')}
          required
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              value={form.category}
              onChange={(e) =>
                onFormChange({ ...form, category: e.target.value })
              }
            />
          )}
        </FormField>

        <FormField
          id="faq-question"
          label="Pertanyaan"
          error={getError('question')}
          required
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              value={form.question}
              onChange={(e) =>
                onFormChange({ ...form, question: e.target.value })
              }
            />
          )}
        </FormField>

        <FormField
          id="faq-answer"
          label="Jawaban"
          error={getError('answer')}
          required
        >
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={4}
              value={form.answer}
              onChange={(e) =>
                onFormChange({ ...form, answer: e.target.value })
              }
            />
          )}
        </FormField>

        <div className="admin-form-grid admin-form-grid--two">
          <FormField
            id="faq-sort-order"
            label="Urutan Tampil"
            error={getError('sortOrder')}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  onFormChange({ ...form, sortOrder: e.target.value })
                }
              />
            )}
          </FormField>

          <FormField id="faq-status" label="Status" error={getError('status')}>
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
                <option value="published">Terpublikasi</option>
                <option value="archived">Diarsipkan</option>
              </Select>
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
            Simpan FAQ
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
