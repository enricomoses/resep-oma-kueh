'use client';

import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CmsDraftFormState } from '@/types/admin-cms';
import { supportsCmsTitleBody } from '@/utils/admin-cms';

interface AdminCmsTextFieldsProps {
  form: CmsDraftFormState;
  getError: (field: string) => string | undefined;
  onChangeForm: (next: CmsDraftFormState) => void;
}

/** Key-specific text fieldsets for contacts, home hero, title+body blocks, and footer note. */
export function AdminCmsTextFields({
  form,
  getError,
  onChangeForm,
}: AdminCmsTextFieldsProps) {
  const supportsTitleBody = supportsCmsTitleBody(form.key);

  return (
    <>
      {form.key === 'business.contacts' ? (
        <div className="admin-form-grid">
          <FormField
            id="cms-email"
            label="Email Resmi"
            error={getError('email')}
            required
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="email"
                value={form.email}
                onChange={(e) =>
                  onChangeForm({ ...form, email: e.target.value })
                }
              />
            )}
          </FormField>
          <FormField
            id="cms-instagram-url"
            label="Tautan Instagram Resmi"
            helper="Harus berformat https://www.instagram.com/<handle>/"
            error={getError('instagram_url')}
            required
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="url"
                value={form.instagramUrl}
                onChange={(e) =>
                  onChangeForm({ ...form, instagramUrl: e.target.value })
                }
              />
            )}
          </FormField>
        </div>
      ) : null}

      {form.key === 'home.hero' ? (
        <div className="admin-form-grid">
          <FormField
            id="cms-hero-headline"
            label="Headline Hero"
            error={getError('headline')}
            required
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={form.headline}
                onChange={(e) =>
                  onChangeForm({ ...form, headline: e.target.value })
                }
              />
            )}
          </FormField>
          <FormField
            id="cms-hero-subcopy"
            label="Subcopy Hero"
            error={getError('subcopy')}
            required
          >
            {(fieldProps) => (
              <Textarea
                {...fieldProps}
                rows={3}
                value={form.subcopy}
                onChange={(e) =>
                  onChangeForm({ ...form, subcopy: e.target.value })
                }
              />
            )}
          </FormField>
        </div>
      ) : null}

      {supportsTitleBody ? (
        <div className="admin-form-grid">
          <FormField
            id="cms-block-title"
            label="Judul Bagian"
            error={getError('title')}
            required
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={form.title}
                onChange={(e) =>
                  onChangeForm({ ...form, title: e.target.value })
                }
              />
            )}
          </FormField>
          <FormField
            id="cms-block-body"
            label="Naskah Polos (Tanpa HTML)"
            error={getError('body')}
            required
          >
            {(fieldProps) => (
              <Textarea
                {...fieldProps}
                rows={5}
                value={form.body}
                onChange={(e) =>
                  onChangeForm({ ...form, body: e.target.value })
                }
              />
            )}
          </FormField>
        </div>
      ) : null}

      {form.key === 'footer.note' ? (
        <FormField
          id="cms-footer-note"
          label="Catatan Footer"
          error={getError('text')}
          required
        >
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={3}
              value={form.text}
              onChange={(e) => onChangeForm({ ...form, text: e.target.value })}
            />
          )}
        </FormField>
      ) : null}
    </>
  );
}
