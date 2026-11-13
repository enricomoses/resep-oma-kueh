'use client';

import {
  FileText,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { PUBLIC_CMS_KEYS } from '@/constants/content.constant';
import { useUploadAdminProductMedia } from '@/hooks/use-admin-catalog';
import {
  useAdminCmsEntries,
  useSaveAdminCmsEntry,
} from '@/hooks/use-admin-cms';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminCmsContentStatus,
  AdminCmsEntry,
  AdminCmsListResponse,
} from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';
import type { PublicCmsKey } from '@/types/content';
import { cn } from '@/utils';

interface AdminContentViewProps {
  profile: AdminSessionProfile;
  initialData?: AdminCmsListResponse;
  className?: string;
}

const KEY_LABELS: Record<PublicCmsKey, string> = {
  'business.contacts': 'Kontak Resmi (Email & Instagram)',
  'home.hero': 'Hero Beranda',
  'home.story': 'Cerita Dapur di Beranda',
  'home.class_promo': 'Blok Promo Kelas Baking (Beranda)',
  'home.custom_business': 'Blok B2B / Custom Business',
  'about.story': 'Kisah & Dapur (Tentang Oma)',
  'about.values': 'Nilai Brand (About Values)',
  'footer.note': 'Catatan Footer Situs',
  'legal.privacy': 'Kebijakan Privasi',
  'legal.ordering_policy': 'Kebijakan Pemesanan',
  'community.instagram': 'Komunitas Instagram Terkurasi',
  'promo.shipping_banner': 'Banner Informasi Pengiriman',
};

interface InstagramItemDraft {
  image_path: string;
  alt: string;
  href: string;
  media_approved: boolean;
  previewUrl: string | null;
}

interface CmsDraftFormState {
  key: PublicCmsKey;
  expectedUpdatedAt: string | null;
  email: string;
  instagramUrl: string;
  headline: string;
  subcopy: string;
  title: string;
  body: string;
  text: string;
  valuesItems: string[];
  imagePath: string;
  imageAlt: string;
  mediaApproved: boolean;
  previewUrl: string | null;
  instagramFeedUrl: string;
  instagramItems: InstagramItemDraft[];
}

function entryToFormState(entry: AdminCmsEntry): CmsDraftFormState {
  const c = entry.content as Record<string, unknown>;
  const imagePath = typeof c.image_path === 'string' ? c.image_path : '';
  const rawInstagramItems = Array.isArray(c.items) ? c.items : [];
  const instagramItems: InstagramItemDraft[] =
    entry.key === 'community.instagram'
      ? rawInstagramItems.map((item) => {
          const obj = item as Record<string, unknown>;
          const path = typeof obj.image_path === 'string' ? obj.image_path : '';
          return {
            image_path: path,
            alt: typeof obj.alt === 'string' ? obj.alt : '',
            href: typeof obj.href === 'string' ? obj.href : '',
            media_approved: Boolean(obj.media_approved),
            previewUrl: path ? (entry.previewImageUrls[path] ?? null) : null,
          };
        })
      : [];

  return {
    key: entry.key,
    expectedUpdatedAt: entry.updatedAt,
    email: typeof c.email === 'string' ? c.email : '',
    instagramUrl: typeof c.instagram_url === 'string' ? c.instagram_url : '',
    headline: typeof c.headline === 'string' ? c.headline : '',
    subcopy: typeof c.subcopy === 'string' ? c.subcopy : '',
    title: typeof c.title === 'string' ? c.title : '',
    body: typeof c.body === 'string' ? c.body : '',
    text: typeof c.text === 'string' ? c.text : '',
    valuesItems:
      entry.key === 'about.values' && Array.isArray(c.items)
        ? (c.items as unknown[]).map((v) => String(v ?? ''))
        : [],
    imagePath,
    imageAlt: typeof c.image_alt === 'string' ? c.image_alt : '',
    mediaApproved: Boolean(c.media_approved),
    previewUrl: imagePath ? (entry.previewImageUrls[imagePath] ?? null) : null,
    instagramFeedUrl: typeof c.url === 'string' ? c.url : '',
    instagramItems,
  };
}

function buildContentPayloadFromForm(
  form: CmsDraftFormState,
): Record<string, unknown> {
  switch (form.key) {
    case 'business.contacts':
      return {
        email: form.email.trim(),
        instagram_url: form.instagramUrl.trim(),
      };
    case 'home.hero': {
      const payload: Record<string, unknown> = {
        headline: form.headline.trim(),
        subcopy: form.subcopy.trim(),
      };
      if (form.imagePath.trim().length > 0) {
        payload.image_path = form.imagePath.trim();
        payload.image_alt = form.imageAlt.trim();
        payload.media_approved = form.mediaApproved;
      } else if (form.imageAlt.trim().length > 0) {
        payload.image_alt = form.imageAlt.trim();
      }
      return payload;
    }
    case 'home.story':
    case 'home.class_promo':
    case 'home.custom_business':
    case 'about.story': {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        body: form.body.trim(),
      };
      if (form.imagePath.trim().length > 0) {
        payload.image_path = form.imagePath.trim();
        payload.image_alt = form.imageAlt.trim();
        payload.media_approved = form.mediaApproved;
      } else if (form.imageAlt.trim().length > 0) {
        payload.image_alt = form.imageAlt.trim();
      }
      return payload;
    }
    case 'about.values':
      return {
        items: form.valuesItems
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      };
    case 'footer.note':
      return {
        text: form.text.trim(),
      };
    case 'legal.privacy':
    case 'legal.ordering_policy':
    case 'promo.shipping_banner':
      return {
        title: form.title.trim(),
        body: form.body.trim(),
      };
    case 'community.instagram':
      return {
        url: form.instagramFeedUrl.trim(),
        items: form.instagramItems.map((item) => ({
          image_path: item.image_path.trim(),
          alt: item.alt.trim(),
          href: item.href.trim(),
          media_approved: true as const,
        })),
      };
  }
}

export function AdminContentView({
  profile,
  initialData,
  className,
}: AdminContentViewProps) {
  const cmsQuery = useAdminCmsEntries(profile, initialData);
  const saveMutation = useSaveAdminCmsEntry();
  const uploadMutation = useUploadAdminProductMedia();

  const entries = useMemo(() => cmsQuery.data?.items ?? [], [cmsQuery.data]);
  const [selectedKey, setSelectedKey] = useState<PublicCmsKey>('home.hero');
  const activeEntry = useMemo(
    () =>
      entries.find((item) => item.key === selectedKey) ?? entries[0] ?? null,
    [entries, selectedKey],
  );

  const [formState, setFormState] = useState<CmsDraftFormState | null>(() =>
    activeEntry ? entryToFormState(activeEntry) : null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentForm =
    formState && formState.key === activeEntry?.key
      ? formState
      : activeEntry
        ? entryToFormState(activeEntry)
        : null;

  function handleSelectKey(key: PublicCmsKey) {
    setSelectedKey(key);
    setActionError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    const found = entries.find((item) => item.key === key);
    if (found) {
      setFormState(entryToFormState(found));
    }
  }

  async function handleRefresh() {
    setActionError(null);
    const result = await cmsQuery.refetch();
    const refreshed = result.data?.items.find(
      (item) => item.key === selectedKey,
    );
    if (refreshed) {
      setFormState(entryToFormState(refreshed));
    }
  }

  async function handleMainImageUpload(file: File | undefined) {
    if (!file || !currentForm) return;
    setActionError(null);
    try {
      const response = await uploadMutation.mutateAsync(file);
      setFormState({
        ...currentForm,
        imagePath: response.data.storagePath,
        previewUrl: response.data.previewUrl,
        mediaApproved: true,
      });
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal mengunggah berkas foto.',
      );
    }
  }

  async function handleInstagramImageUpload(
    index: number,
    file: File | undefined,
  ) {
    if (!file || !currentForm) return;
    setActionError(null);
    try {
      const response = await uploadMutation.mutateAsync(file);
      const next = [...currentForm.instagramItems];
      const existing = next[index];
      if (!existing) return;
      next[index] = {
        ...existing,
        image_path: response.data.storagePath,
        previewUrl: response.data.previewUrl,
        media_approved: true,
      };
      setFormState({
        ...currentForm,
        instagramItems: next,
      });
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : 'Gagal mengunggah berkas foto Instagram.',
      );
    }
  }

  async function handleSave(targetStatus: AdminCmsContentStatus) {
    if (!currentForm) return;
    setActionError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    try {
      const response = await saveMutation.mutateAsync({
        key: currentForm.key,
        payload: {
          status: targetStatus,
          expectedUpdatedAt: currentForm.expectedUpdatedAt,
          content: buildContentPayloadFromForm(currentForm),
        },
      });
      setFormState(entryToFormState(response.data.item));
      setSuccessMessage(
        targetStatus === 'published'
          ? `Konten "${currentForm.key}" berhasil dipublikasikan.`
          : `Draf konten "${currentForm.key}" berhasil disimpan.`,
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setActionError(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
        return;
      }
      setActionError('Gagal menyimpan perubahan konten.');
    }
  }

  function getError(field: string): string | undefined {
    return fieldErrors[field]?.[0];
  }

  const supportsSingleMedia =
    currentForm?.key === 'home.hero' ||
    currentForm?.key === 'home.story' ||
    currentForm?.key === 'home.class_promo' ||
    currentForm?.key === 'home.custom_business' ||
    currentForm?.key === 'about.story';

  const supportsTitleBody =
    currentForm?.key === 'home.story' ||
    currentForm?.key === 'home.class_promo' ||
    currentForm?.key === 'home.custom_business' ||
    currentForm?.key === 'about.story' ||
    currentForm?.key === 'legal.privacy' ||
    currentForm?.key === 'legal.ordering_policy' ||
    currentForm?.key === 'promo.shipping_banner';

  return (
    <section
      className={cn('admin-module-page', className)}
      aria-labelledby="admin-content-title"
    >
      <div className="admin-module-header">
        <div>
          <h2 id="admin-content-title" className="admin-section-title">
            {ADMIN_CATALOG_COPY.CMS.TITLE}
          </h2>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.CMS.SUBTITLE}
          </p>
        </div>
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void handleRefresh()}
            loading={cmsQuery.isFetching}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {ADMIN_CATALOG_COPY.CMS.REFRESH}
          </Button>
        </div>
      </div>

      {actionError ? (
        <Feedback tone="error" title={actionError} announce>
          {fieldErrors.root?.[0] ? <p>{fieldErrors.root[0]}</p> : null}
        </Feedback>
      ) : null}

      {successMessage ? (
        <Feedback tone="success" title={successMessage} announce />
      ) : null}

      <div className="admin-cms-layout">
        <Card tone="surface" className="admin-cms-nav-card">
          <h3 className="admin-card-title">Daftar Kunci Resmi (Allowlist)</h3>
          <ul className="admin-cms-key-list">
            {PUBLIC_CMS_KEYS.map((key) => {
              const entry = entries.find((item) => item.key === key);
              const isActive = currentForm?.key === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    className={cn(
                      'admin-cms-key-btn',
                      isActive && 'admin-cms-key-btn--active',
                    )}
                    onClick={() => handleSelectKey(key)}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="admin-cms-key-meta">
                      <span className="admin-cms-key-label">
                        {KEY_LABELS[key]}
                      </span>
                      <code className="admin-cms-key-code">{key}</code>
                    </span>
                    <Badge
                      tone={
                        entry?.status === 'published' ? 'success' : 'neutral'
                      }
                    >
                      {entry?.status === 'published' ? 'Terpublikasi' : 'Draf'}
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card tone="cream" className="admin-cms-editor-card">
          {!currentForm || !activeEntry ? (
            <p className="admin-section-subtitle">Memuat skema konten CMS...</p>
          ) : (
            <div className="admin-cms-editor-stack">
              <div className="admin-card-head">
                <div>
                  <h3 className="admin-card-title">
                    <FileText
                      size={18}
                      aria-hidden="true"
                      className="mr-1 inline"
                    />
                    {KEY_LABELS[currentForm.key]}
                  </h3>
                  <p className="admin-section-subtitle">
                    Kunci: <code>{currentForm.key}</code> ·{' '}
                    {activeEntry.isPersisted
                      ? 'Tersimpan di DB'
                      : 'Template Awal'}
                    {activeEntry.updatedAt
                      ? ` · Diperbarui ${new Date(activeEntry.updatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`
                      : ''}
                  </p>
                </div>
                <Badge
                  tone={
                    activeEntry.status === 'published' ? 'success' : 'accent'
                  }
                >
                  {activeEntry.status === 'published' ? 'Terpublikasi' : 'Draf'}
                </Badge>
              </div>

              {activeEntry.releaseWarnings.length > 0 ? (
                <Feedback
                  tone="info"
                  title="Catatan Review Owner & Release Gate"
                >
                  <ul className="list-disc pl-4 text-xs">
                    {activeEntry.releaseWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </Feedback>
              ) : null}

              {currentForm.key === 'business.contacts' ? (
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
                        value={currentForm.email}
                        onChange={(e) =>
                          setFormState({
                            ...currentForm,
                            email: e.target.value,
                          })
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
                        value={currentForm.instagramUrl}
                        onChange={(e) =>
                          setFormState({
                            ...currentForm,
                            instagramUrl: e.target.value,
                          })
                        }
                      />
                    )}
                  </FormField>
                </div>
              ) : null}

              {currentForm.key === 'home.hero' ? (
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
                        value={currentForm.headline}
                        onChange={(e) =>
                          setFormState({
                            ...currentForm,
                            headline: e.target.value,
                          })
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
                        value={currentForm.subcopy}
                        onChange={(e) =>
                          setFormState({
                            ...currentForm,
                            subcopy: e.target.value,
                          })
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
                        value={currentForm.title}
                        onChange={(e) =>
                          setFormState({
                            ...currentForm,
                            title: e.target.value,
                          })
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
                        value={currentForm.body}
                        onChange={(e) =>
                          setFormState({ ...currentForm, body: e.target.value })
                        }
                      />
                    )}
                  </FormField>
                </div>
              ) : null}

              {supportsSingleMedia ? (
                <Card tone="surface" className="admin-subpanel">
                  <div className="admin-card-head">
                    <div>
                      <h4 className="admin-card-title">
                        Media Brand (Bucket: brand-assets)
                      </h4>
                      <p className="admin-section-subtitle">
                        {currentForm.key === 'home.hero'
                          ? 'Wajib mengunggah dan menyetujui foto sebelum publikasi Hero.'
                          : 'Opsional; jika diisi saat publikasi wajib mencantumkan teks alt dan persetujuan.'}
                      </p>
                    </div>
                    {currentForm.imagePath ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormState({
                            ...currentForm,
                            imagePath: '',
                            previewUrl: null,
                            mediaApproved: false,
                          })
                        }
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Hapus Media
                      </Button>
                    ) : null}
                  </div>

                  {currentForm.previewUrl ? (
                    <div className="relative h-44 w-full max-w-md overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
                      <Image
                        src={currentForm.previewUrl}
                        alt={currentForm.imageAlt || 'Pratinjau aset brand'}
                        fill
                        sizes="448px"
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="admin-form-grid admin-form-grid--two">
                    <FormField
                      id="cms-image-upload"
                      label="Unggah Foto Baru (JPG/PNG/WebP/AVIF <= 5 MiB)"
                      error={getError('image_path')}
                    >
                      {(fieldProps) => (
                        <div className="admin-inline-actions">
                          <input
                            {...fieldProps}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={(e) =>
                              void handleMainImageUpload(e.target.files?.[0])
                            }
                            disabled={uploadMutation.isPending}
                          />
                          {uploadMutation.isPending ? (
                            <span className="text-xs">
                              <Upload
                                size={14}
                                aria-hidden="true"
                                className="mr-1 inline"
                              />
                              Mengunggah...
                            </span>
                          ) : null}
                        </div>
                      )}
                    </FormField>

                    <FormField
                      id="cms-image-alt"
                      label="Teks Alt Foto"
                      error={getError('image_alt')}
                    >
                      {(fieldProps) => (
                        <Input
                          {...fieldProps}
                          value={currentForm.imageAlt}
                          onChange={(e) =>
                            setFormState({
                              ...currentForm,
                              imageAlt: e.target.value,
                            })
                          }
                        />
                      )}
                    </FormField>
                  </div>

                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={currentForm.mediaApproved}
                      onChange={(e) =>
                        setFormState({
                          ...currentForm,
                          mediaApproved: e.target.checked,
                        })
                      }
                    />
                    <span>
                      Media disetujui Owner untuk dipublikasikan
                      (media_approved)
                    </span>
                  </label>
                </Card>
              ) : null}

              {currentForm.key === 'about.values' ? (
                <div className="admin-cms-list-editor">
                  <div className="admin-card-head">
                    <h4 className="admin-card-title">Daftar Nilai Utama</h4>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setFormState({
                          ...currentForm,
                          valuesItems: [...currentForm.valuesItems, ''],
                        })
                      }
                    >
                      <Plus size={14} aria-hidden="true" />
                      Tambah Nilai
                    </Button>
                  </div>
                  {currentForm.valuesItems.map((val, idx) => (
                    <div key={idx} className="admin-inline-actions">
                      <Input
                        aria-label={`Nilai ke-${idx + 1}`}
                        value={val}
                        onChange={(e) => {
                          const next = [...currentForm.valuesItems];
                          next[idx] = e.target.value;
                          setFormState({ ...currentForm, valuesItems: next });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Hapus nilai ke-${idx + 1}`}
                        onClick={() => {
                          const next = currentForm.valuesItems.filter(
                            (_, i) => i !== idx,
                          );
                          setFormState({ ...currentForm, valuesItems: next });
                        }}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                  {getError('items') ? (
                    <p className="ui-field-error">{getError('items')}</p>
                  ) : null}
                </div>
              ) : null}

              {currentForm.key === 'footer.note' ? (
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
                      value={currentForm.text}
                      onChange={(e) =>
                        setFormState({ ...currentForm, text: e.target.value })
                      }
                    />
                  )}
                </FormField>
              ) : null}

              {currentForm.key === 'community.instagram' ? (
                <div className="admin-cms-list-editor">
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
                        value={currentForm.instagramFeedUrl}
                        onChange={(e) =>
                          setFormState({
                            ...currentForm,
                            instagramFeedUrl: e.target.value,
                          })
                        }
                      />
                    )}
                  </FormField>

                  <div className="admin-card-head">
                    <h4 className="admin-card-title">
                      Kartu Komunitas Terkurasi (
                      {currentForm.instagramItems.length})
                    </h4>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setFormState({
                          ...currentForm,
                          instagramItems: [
                            ...currentForm.instagramItems,
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

                  {currentForm.instagramItems.map((item, idx) => (
                    <Card key={idx} tone="surface" className="admin-subpanel">
                      <div className="admin-card-head">
                        <span className="text-sm font-semibold">
                          Kartu #{idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFormState({
                              ...currentForm,
                              instagramItems: currentForm.instagramItems.filter(
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
                              onChange={(e) =>
                                void handleInstagramImageUpload(
                                  idx,
                                  e.target.files?.[0],
                                )
                              }
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
                                const next = [...currentForm.instagramItems];
                                next[idx] = { ...item, alt: e.target.value };
                                setFormState({
                                  ...currentForm,
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
                                const next = [...currentForm.instagramItems];
                                next[idx] = { ...item, href: e.target.value };
                                setFormState({
                                  ...currentForm,
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
              ) : null}

              <div className="admin-inline-actions pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  loading={saveMutation.isPending}
                  loadingLabel="Menyimpan..."
                  onClick={() => void handleSave('draft')}
                >
                  {ADMIN_CATALOG_COPY.CMS.SAVE_DRAFT}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  loading={saveMutation.isPending}
                  loadingLabel="Mempublikasikan..."
                  onClick={() => void handleSave('published')}
                >
                  <ShieldAlert size={16} aria-hidden="true" />
                  {ADMIN_CATALOG_COPY.CMS.PUBLISH}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
