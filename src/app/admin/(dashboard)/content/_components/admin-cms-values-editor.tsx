'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CmsDraftFormState } from '@/types/admin-cms';

interface AdminCmsValuesEditorProps {
  form: CmsDraftFormState;
  errorMessage?: string;
  onChangeForm: (next: CmsDraftFormState) => void;
}

/** Dynamic list editor for the `about.values` core brand values CMS entry. */
export function AdminCmsValuesEditor({
  form,
  errorMessage,
  onChangeForm,
}: AdminCmsValuesEditorProps) {
  return (
    <div className="admin-cms-list-editor">
      <div className="admin-card-head">
        <h4 className="admin-card-title">Daftar Nilai Utama</h4>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChangeForm({
              ...form,
              valuesItems: [...form.valuesItems, ''],
            })
          }
        >
          <Plus size={14} aria-hidden="true" />
          Tambah Nilai
        </Button>
      </div>
      {form.valuesItems.map((val, idx) => (
        <div key={idx} className="admin-inline-actions">
          <Input
            aria-label={`Nilai ke-${idx + 1}`}
            value={val}
            onChange={(e) => {
              const next = [...form.valuesItems];
              next[idx] = e.target.value;
              onChangeForm({ ...form, valuesItems: next });
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Hapus nilai ke-${idx + 1}`}
            onClick={() => {
              const next = form.valuesItems.filter((_, i) => i !== idx);
              onChangeForm({ ...form, valuesItems: next });
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
          </Button>
        </div>
      ))}
      {errorMessage ? <p className="ui-field-error">{errorMessage}</p> : null}
    </div>
  );
}
