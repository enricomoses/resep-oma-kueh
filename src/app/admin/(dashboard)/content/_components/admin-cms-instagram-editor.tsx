'use client';

import { Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { CmsDraftFormState } from '@/types/admin-cms';
import { cn } from '@/utils';

interface AdminCmsInstagramEditorProps {
  form: CmsDraftFormState;
  getError: (field: string) => string | undefined;
  onChangeForm: (next: CmsDraftFormState) => void;
  onUploadItemImage: (index: number, file: File | undefined) => void;
  className?: string;
}

export function AdminCmsInstagramEditor({
  form,
  getError,
  onChangeForm,
  onUploadItemImage,
  className,
}: AdminCmsInstagramEditorProps) {
  return (
    <div className={cn('admin-cms-list-editor', className)}>
      <FormField
        id="cms-community-url"
        label="URL Profil Instagram"
        error={getError('url')}
        required
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="url"
            value={form.instagramFeedUrl}
            onChange={(e) =>
              onChangeForm({
                ...form,
                instagramFeedUrl: e.target.value,
              })
            }
          />
        )}
      </FormField>

      <div className="admin-card-head">
        <h4 className="admin-card-title">
          Kartu Komunitas Terkurasi ({form.instagramItems.length})
        </h4>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChangeForm({
              ...form,
              instagramItems: [
                ...form.instagramItems,
                {
                  image_path: '',
                  alt: '',
                  href: 'https://www.instagram.com/resepoma.kueh/',
                  media_approved: true,
                  previewUrl: null,
                },
              ],
            })
          }
        >
          <Plus size={14} aria-hidden="true" />
          Tambah Kartu
        </Button>
      </div>
      {getError('items') ? (
        <p className="ui-field-error">{getError('items')}</p>
      ) : null}

      {form.instagramItems.map((item, idx) => (
        <Card key={idx} tone="surface" className="admin-subpanel">
          <div className="admin-card-head">
            <span className="text-sm font-semibold">Kartu #{idx + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChangeForm({
                  ...form,
                  instagramItems: form.instagramItems.filter(
                    (_, i) => i !== idx,
                  ),
                })
              }
            >
              <Trash2 size={14} aria-hidden="true" />
              Hapus
            </Button>
          </div>

          {item.previewUrl ? (
            <div className="relative h-32 w-48 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
              <Image
                src={item.previewUrl}
                alt={item.alt || `Instagram card ${idx + 1}`}
                fill
                sizes="192px"
                unoptimized
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="admin-form-grid admin-form-grid--two">
            <FormField
              id={`ig-upload-${idx}`}
              label="Foto Kartu"
              error={getError(`items.${idx}.image_path`)}
            >
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => onUploadItemImage(idx, e.target.files?.[0])}
                />
              )}
            </FormField>
            <FormField
              id={`ig-alt-${idx}`}
              label="Alt & Judul Kartu"
              error={getError(`items.${idx}.alt`)}
              required
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  value={item.alt}
                  onChange={(e) => {
                    const next = [...form.instagramItems];
                    next[idx] = { ...item, alt: e.target.value };
                    onChangeForm({
                      ...form,
                      instagramItems: next,
                    });
                  }}
                />
              )}
            </FormField>
            <FormField
              id={`ig-href-${idx}`}
              label="Tautan Postingan Instagram"
              error={getError(`items.${idx}.href`)}
              required
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="url"
                  value={item.href}
                  onChange={(e) => {
                    const next = [...form.instagramItems];
                    next[idx] = { ...item, href: e.target.value };
                    onChangeForm({
                      ...form,
                      instagramItems: next,
                    });
                  }}
                />
              )}
            </FormField>
          </div>
        </Card>
      ))}
    </div>
  );
}
