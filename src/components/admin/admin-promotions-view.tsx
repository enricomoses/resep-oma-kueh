'use client';

import { Plus, RefreshCw, Sparkles, Tag, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import {
  PROMOTION_COPY,
  PROMOTION_DISCOUNT_TYPES,
  PROMOTION_SCOPES,
  PROMOTION_STATUSES,
} from '@/constants/promotion.constant';
import {
  useAdminPromotions,
  useArchiveAdminPromotion,
  useCreateAdminPromotion,
  useSaveAdminShippingBanner,
  useUpdateAdminPromotion,
  useUploadAdminProductMedia,
} from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminPromotionItem,
  AdminPromotionsListResponse,
  AdminPromotionTargetSummary,
  PromotionDiscountType,
  PromotionScope,
  PromotionStatus,
  SaveAdminPromotionInput,
} from '@/types/promotion';
import { cn, formatIdr } from '@/utils';
import {
  buildPromotionPreviewExamples,
  derivePromotionClockState,
  formatJakartaDateTimeDisplay,
  fromJakartaDateTimeInputValue,
  toJakartaDateTimeInputValue,
} from '@/utils/admin-promotions';

interface AdminPromotionsViewProps {
  profile: AdminSessionProfile;
  initialData?: AdminPromotionsListResponse;
  className?: string;
}

interface PromotionFormState {
  id: string | null;
  expectedUpdatedAt: string | null;
  title: string;
  slug: string;
  description: string;
  discountType: PromotionDiscountType;
  discountValue: string;
  maxDiscountIdr: string;
  minSpendIdr: string;
  scope: PromotionScope;
  startsAtLocal: string;
  endsAtLocal: string;
  priority: string;
  status: PromotionStatus;
  isEnabled: boolean;
  bannerImagePath: string | null;
  bannerDraftPath: string | null;
  bannerPreviewUrl: string | null;
  branchIds: string[];
  categoryIds: string[];
  productIds: string[];
  variantIds: string[];
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function createEmptyPromotionForm(): PromotionFormState {
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    id: null,
    expectedUpdatedAt: null,
    title: '',
    slug: '',
    description: '',
    discountType: 'percentage',
    discountValue: '10',
    maxDiscountIdr: '',
    minSpendIdr: '0',
    scope: 'all',
    startsAtLocal: toJakartaDateTimeInputValue(now.toISOString()),
    endsAtLocal: toJakartaDateTimeInputValue(oneWeekLater.toISOString()),
    priority: '10',
    status: 'draft',
    isEnabled: false,
    bannerImagePath: null,
    bannerDraftPath: null,
    bannerPreviewUrl: null,
    branchIds: [],
    categoryIds: [],
    productIds: [],
    variantIds: [],
  };
}

function mapItemToForm(item: AdminPromotionItem): PromotionFormState {
  return {
    id: item.id,
    expectedUpdatedAt: item.updatedAt,
    title: item.title,
    slug: item.slug,
    description: item.description ?? '',
    discountType: item.discountType,
    discountValue: String(item.discountValue),
    maxDiscountIdr:
      item.maxDiscountIdr === null ? '' : String(item.maxDiscountIdr),
    minSpendIdr: String(item.minSpendIdr),
    scope: item.scope,
    startsAtLocal: toJakartaDateTimeInputValue(item.startsAt),
    endsAtLocal: toJakartaDateTimeInputValue(item.endsAt),
    priority: String(item.priority),
    status: item.status,
    isEnabled: item.isEnabled,
    bannerImagePath:
      item.bannerImagePath && item.bannerImagePath.startsWith('approved/')
        ? item.bannerImagePath
        : null,
    bannerDraftPath: null,
    bannerPreviewUrl: item.bannerImageUrl,
    branchIds: [...item.branchIds],
    categoryIds: [...item.categoryIds],
    productIds: [...item.productIds],
    variantIds: [...item.variantIds],
  };
}

function toggleIdInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function getClockBadgeTone(clockState: 'scheduled' | 'active' | 'ended') {
  if (clockState === 'active') return 'success' as const;
  if (clockState === 'scheduled') return 'accent' as const;
  return 'neutral' as const;
}

export function AdminPromotionsView({
  profile,
  initialData,
  className,
}: AdminPromotionsViewProps) {
  const { data, isFetching, isError, refetch } = useAdminPromotions(
    profile,
    initialData,
  );
  const createMutation = useCreateAdminPromotion();
  const updateMutation = useUpdateAdminPromotion();
  const archiveMutation = useArchiveAdminPromotion();
  const shippingBannerMutation = useSaveAdminShippingBanner();
  const uploadBannerMutation = useUploadAdminProductMedia();

  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<PromotionFormState>(() =>
    createEmptyPromotionForm(),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminPromotionItem | null>(
    null,
  );

  const [bannerForm, setBannerForm] = useState(() => ({
    title: data?.shippingBanner.title ?? '',
    body: data?.shippingBanner.body ?? '',
    status: data?.shippingBanner.status ?? ('draft' as 'draft' | 'published'),
    expectedUpdatedAt: data?.shippingBanner.updatedAt ?? null,
    syncedUpdatedAt: data?.shippingBanner.updatedAt ?? null,
  }));
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  if (
    data?.shippingBanner &&
    data.shippingBanner.updatedAt !== bannerForm.syncedUpdatedAt
  ) {
    setBannerForm({
      title: data.shippingBanner.title,
      body: data.shippingBanner.body,
      status: data.shippingBanner.status,
      expectedUpdatedAt: data.shippingBanner.updatedAt,
      syncedUpdatedAt: data.shippingBanner.updatedAt,
    });
  }

  const previewExamples = useMemo(() => {
    const discountValue = Number(formState.discountValue);
    const minSpendIdr = Number.parseInt(formState.minSpendIdr || '0', 10);
    const maxDiscountIdr =
      formState.maxDiscountIdr.trim() === ''
        ? null
        : Number.parseInt(formState.maxDiscountIdr, 10);
    const priority = Number.parseInt(formState.priority || '0', 10);

    return buildPromotionPreviewExamples({
      id: formState.id ?? undefined,
      title: formState.title || 'Pratinjau Promo',
      discountType: formState.discountType,
      discountValue: Number.isFinite(discountValue) ? discountValue : 0,
      minSpendIdr: Number.isFinite(minSpendIdr) ? minSpendIdr : 0,
      maxDiscountIdr:
        maxDiscountIdr !== null && Number.isFinite(maxDiscountIdr)
          ? maxDiscountIdr
          : null,
      priority: Number.isFinite(priority) ? priority : 0,
    });
  }, [
    formState.discountType,
    formState.discountValue,
    formState.id,
    formState.maxDiscountIdr,
    formState.minSpendIdr,
    formState.priority,
    formState.title,
  ]);

  const promotions = data?.promotions ?? [];
  const references = data?.references ?? {
    branches: [],
    categories: [],
    products: [],
    variants: [],
  };

  function openCreateForm() {
    setFormState(createEmptyPromotionForm());
    setSlugTouched(false);
    setFormError(null);
    setFieldErrors({});
    setUploadError(null);
    setFormOpen(true);
  }

  function openEditForm(item: AdminPromotionItem) {
    setFormState(mapItemToForm(item));
    setSlugTouched(true);
    setFormError(null);
    setFieldErrors({});
    setUploadError(null);
    setFormOpen(true);
  }

  async function handleBannerFileChange(file: File | null) {
    if (!file) return;
    setUploadError(null);
    setIsUploadingBanner(true);
    try {
      const response = await uploadBannerMutation.mutateAsync(file);
      setFormState((prev) => ({
        ...prev,
        bannerDraftPath: response.data.storagePath,
        bannerPreviewUrl: response.data.previewUrl,
      }));
    } catch (err) {
      if (err instanceof ApiClientError) {
        setUploadError(err.message);
      } else {
        setUploadError('Gagal mengunggah banner promosi.');
      }
    } finally {
      setIsUploadingBanner(false);
    }
  }

  async function handleSavePromotion() {
    setFormError(null);
    setFieldErrors({});
    setFeedbackMsg(null);

    const startsAt = fromJakartaDateTimeInputValue(formState.startsAtLocal);
    const endsAt = fromJakartaDateTimeInputValue(formState.endsAtLocal);
    if (!startsAt || !endsAt) {
      setFormError('Format tanggal/jam WIB tidak valid.');
      return;
    }

    const discountValue = Number(formState.discountValue);
    const minSpendIdr = Number.parseInt(formState.minSpendIdr || '0', 10);
    const maxDiscountIdr =
      formState.maxDiscountIdr.trim() === ''
        ? null
        : Number.parseInt(formState.maxDiscountIdr, 10);
    const priority = Number.parseInt(formState.priority || '0', 10);

    if (
      !Number.isFinite(discountValue) ||
      !Number.isFinite(minSpendIdr) ||
      !Number.isFinite(priority)
    ) {
      setFormError(
        'Periksa kembali angka diskon, minimum belanja, dan prioritas.',
      );
      return;
    }
    if (maxDiscountIdr !== null && !Number.isFinite(maxDiscountIdr)) {
      setFormError('Batas diskon per baris harus berupa bilangan bulat.');
      return;
    }

    const payload: SaveAdminPromotionInput = {
      expectedUpdatedAt: formState.id ? formState.expectedUpdatedAt : null,
      title: formState.title,
      slug: formState.slug,
      description:
        formState.description.trim() === '' ? null : formState.description,
      discountType: formState.discountType,
      discountValue,
      maxDiscountIdr,
      minSpendIdr,
      scope: formState.scope,
      startsAt,
      endsAt,
      priority,
      status: formState.status,
      isEnabled: formState.isEnabled,
      isStackable: false,
      bannerImagePath: formState.bannerImagePath,
      ...(formState.bannerDraftPath
        ? { bannerDraftPath: formState.bannerDraftPath }
        : {}),
      branchIds: formState.branchIds,
      categoryIds: formState.scope === 'category' ? formState.categoryIds : [],
      productIds: formState.scope === 'product' ? formState.productIds : [],
      variantIds: formState.scope === 'variant' ? formState.variantIds : [],
    };

    try {
      const response = formState.id
        ? await updateMutation.mutateAsync({ id: formState.id, payload })
        : await createMutation.mutateAsync(payload);

      setFeedbackMsg(
        `Promosi "${response.data.promotion.title}" berhasil disimpan.`,
      );
      setFormOpen(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setFormError('Gagal menyimpan promosi.');
      }
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setFormError(null);
    setFeedbackMsg(null);
    try {
      const response = await archiveMutation.mutateAsync({
        id: archiveTarget.id,
        expectedUpdatedAt: archiveTarget.updatedAt,
      });
      setFeedbackMsg(
        `Promosi "${response.data.promotion.title}" berhasil diarsipkan dan dinonaktifkan.`,
      );
      setArchiveTarget(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError('Gagal mengarsipkan promosi.');
      }
      setArchiveTarget(null);
    }
  }

  async function handleSaveShippingBanner() {
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const response = await shippingBannerMutation.mutateAsync({
        expectedUpdatedAt: bannerForm.expectedUpdatedAt,
        title: bannerForm.title,
        body: bannerForm.body,
        status: bannerForm.status,
      });
      setBannerForm({
        title: response.data.shippingBanner.title,
        body: response.data.shippingBanner.body,
        status: response.data.shippingBanner.status,
        expectedUpdatedAt: response.data.shippingBanner.updatedAt,
        syncedUpdatedAt: response.data.shippingBanner.updatedAt,
      });
      setBannerSuccess('Banner info pengiriman berhasil disimpan.');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setBannerError(err.message);
      } else {
        setBannerError('Gagal menyimpan banner info pengiriman.');
      }
    }
  }

  function renderScopeTargets(
    items: AdminPromotionTargetSummary[],
    selectedIds: string[],
    onToggle: (id: string) => void,
    emptyText: string,
  ) {
    if (items.length === 0) {
      return <p className="text-muted-foreground text-xs">{emptyText}</p>;
    }
    return (
      <div className="grid max-h-48 gap-2 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-sand)] p-3 sm:grid-cols-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-start gap-2 text-xs"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">{item.label}</span>
              {item.secondaryLabel ? (
                <span className="text-muted-foreground block text-[11px]">
                  {item.secondaryLabel}
                </span>
              ) : null}
              {!item.isPublishEligible ? (
                <span className="block text-[11px] text-danger">
                  Belum terpublikasi / nonaktif
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={cn('admin-page space-y-6', className)}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {ADMIN_CATALOG_COPY.PROMOTIONS.TITLE}
          </h1>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.PROMOTIONS.SUBTITLE}
          </p>
        </div>
        <div className="admin-inline-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {ADMIN_CATALOG_COPY.PROMOTIONS.REFRESH}
          </Button>
          <Button variant="primary" size="sm" onClick={openCreateForm}>
            <Plus size={15} aria-hidden="true" />
            {ADMIN_CATALOG_COPY.PROMOTIONS.ADD_BUTTON}
          </Button>
        </div>
      </div>

      {feedbackMsg ? (
        <Feedback tone="success" title={feedbackMsg} announce />
      ) : null}
      {formError && !formOpen ? (
        <Feedback tone="error" title={formError} announce />
      ) : null}
      {isError ? (
        <Feedback
          tone="error"
          title="Gagal memuat daftar promosi admin."
          announce
        />
      ) : null}

      <Card tone="cream" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="admin-card-title">
              Banner Informasi Pengiriman (Owner-Approved)
            </h2>
            <p className="text-muted-foreground text-xs">
              {PROMOTION_COPY.SHIPPING_BANNER_SAFETY_NOTE}
            </p>
          </div>
          <Badge
            tone={bannerForm.status === 'published' ? 'success' : 'neutral'}
          >
            {bannerForm.status === 'published'
              ? 'Terpublikasi ke Publik'
              : 'Draf (Tersembunyi)'}
          </Badge>
        </div>

        {bannerError ? (
          <Feedback tone="error" title={bannerError} announce />
        ) : null}
        {bannerSuccess ? (
          <Feedback tone="success" title={bannerSuccess} announce />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="shipping-banner-title" label="Judul Banner Info">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={bannerForm.title}
                onChange={(e) =>
                  setBannerForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Contoh: Info Ongkos Kirim Area Surabaya"
              />
            )}
          </FormField>
          <FormField id="shipping-banner-status" label="Status Publikasi">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={bannerForm.status}
                onChange={(e) =>
                  setBannerForm((prev) => ({
                    ...prev,
                    status:
                      e.target.value === 'published' ? 'published' : 'draft',
                  }))
                }
              >
                <option value="draft">Draf (Jangan tampilkan ke publik)</option>
                <option value="published">
                  Terpublikasi (Tampilkan di Home & Checkout)
                </option>
              </Select>
            )}
          </FormField>
        </div>

        <FormField id="shipping-banner-body" label="Isi Banner (Plain Text)">
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={2}
              value={bannerForm.body}
              onChange={(e) =>
                setBannerForm((prev) => ({ ...prev, body: e.target.value }))
              }
              placeholder="Contoh: Biaya kurir diinformasikan oleh admin WhatsApp cabang sesuai alamat tujuan."
            />
          )}
        </FormField>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            {bannerForm.expectedUpdatedAt
              ? `Terakhir disimpan: ${formatJakartaDateTimeDisplay(bannerForm.expectedUpdatedAt)}`
              : 'Belum pernah disimpan ke database.'}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleSaveShippingBanner()}
            disabled={shippingBannerMutation.isPending}
          >
            {shippingBannerMutation.isPending
              ? 'Menyimpan...'
              : 'Simpan Banner Info'}
          </Button>
        </div>
      </Card>

      {formOpen ? (
        <Card tone="surface" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="admin-card-title">
                {formState.id ? 'Ubah Promosi' : 'Buat Promosi Baru'}
              </h2>
              <p className="text-muted-foreground text-xs">
                {PROMOTION_COPY.ENDS_EXCLUSIVE_NOTE}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFormOpen(false)}
            >
              Tutup Form
            </Button>
          </div>

          {formError ? (
            <Feedback tone="error" title={formError} announce />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              id="promo-title"
              label="Judul Promo"
              error={fieldErrors.title?.[0]}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  value={formState.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormState((prev) => ({
                      ...prev,
                      title,
                      slug:
                        !prev.id && !slugTouched
                          ? slugifyTitle(title)
                          : prev.slug,
                    }));
                  }}
                  placeholder="Contoh: Promo Akhir Pekan Chiffon"
                />
              )}
            </FormField>

            <FormField
              id="promo-slug"
              label="Slug Promo (Permanen)"
              error={fieldErrors.slug?.[0]}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  value={formState.slug}
                  disabled={Boolean(formState.id)}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setFormState((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  placeholder="promo-akhir-pekan"
                />
              )}
            </FormField>
          </div>

          <FormField
            id="promo-description"
            label="Deskripsi Singkat (Opsional)"
            error={fieldErrors.description?.[0]}
          >
            {(fieldProps) => (
              <Textarea
                {...fieldProps}
                rows={2}
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            )}
          </FormField>

          <div className="grid gap-4 md:grid-cols-4">
            <FormField
              id="promo-discount-type"
              label="Tipe Diskon"
              error={fieldErrors.discountType?.[0]}
            >
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={formState.discountType}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      discountType:
                        e.target.value === 'fixed' ? 'fixed' : 'percentage',
                    }))
                  }
                >
                  {PROMOTION_DISCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {PROMOTION_COPY.DISCOUNT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>

            <FormField
              id="promo-discount-value"
              label={
                formState.discountType === 'percentage'
                  ? 'Persentase (%)'
                  : 'Potongan per Unit (Rp)'
              }
              error={fieldErrors.discountValue?.[0]}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  step={formState.discountType === 'percentage' ? '0.01' : '1'}
                  min="0"
                  value={formState.discountValue}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      discountValue: e.target.value,
                    }))
                  }
                />
              )}
            </FormField>

            <FormField
              id="promo-min-spend"
              label="Min. Belanja Eligible (Rp)"
              error={fieldErrors.minSpendIdr?.[0]}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min="0"
                  step="1"
                  value={formState.minSpendIdr}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      minSpendIdr: e.target.value,
                    }))
                  }
                />
              )}
            </FormField>

            <FormField
              id="promo-max-discount"
              label="Maks. Potongan / Baris (Rp, Opsional)"
              error={fieldErrors.maxDiscountIdr?.[0]}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min="0"
                  step="1"
                  value={formState.maxDiscountIdr}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      maxDiscountIdr: e.target.value,
                    }))
                  }
                  placeholder="Tanpa batas"
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <FormField
              id="promo-starts-at"
              label="Mulai (WIB / Jakarta)"
              error={fieldErrors.startsAt?.[0]}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="datetime-local"
                  value={formState.startsAtLocal}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      startsAtLocal: e.target.value,
                    }))
                  }
                />
              )}
            </FormField>

            <FormField
              id="promo-ends-at"
              label="Berakhir Eksklusif (WIB / Jakarta)"
              error={fieldErrors.endsAt?.[0]}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="datetime-local"
                  value={formState.endsAtLocal}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      endsAtLocal: e.target.value,
                    }))
                  }
                />
              )}
            </FormField>

            <FormField
              id="promo-priority"
              label="Prioritas Seri (Angka)"
              error={fieldErrors.priority?.[0]}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  step="1"
                  value={formState.priority}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                />
              )}
            </FormField>

            <FormField
              id="promo-status"
              label="Status Publikasi"
              error={fieldErrors.status?.[0]}
            >
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={formState.status}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: e.target.value as PromotionStatus,
                    }))
                  }
                >
                  {PROMOTION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[status]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={formState.isEnabled}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      isEnabled: e.target.checked,
                    }))
                  }
                />
                Aktifkan Promo (Toggle isEnabled)
              </label>

              <label className="text-muted-foreground flex items-center gap-2 text-xs">
                <input type="checkbox" checked={false} disabled readOnly />
                Non-stackable (tetap false) —{' '}
                {PROMOTION_COPY.NON_STACKABLE_NOTE}
              </label>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="promo-banner-upload"
                className="ui-field-label block"
              >
                Banner Promosi (Opsional)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-sand)] bg-white px-3 py-1.5 text-xs font-medium">
                  <Upload size={14} aria-hidden="true" />
                  {isUploadingBanner ? 'Mengunggah...' : 'Unggah Banner'}
                  <input
                    id="promo-banner-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={isUploadingBanner}
                    onChange={(e) =>
                      void handleBannerFileChange(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
                {formState.bannerPreviewUrl || formState.bannerImagePath ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        bannerImagePath: null,
                        bannerDraftPath: null,
                        bannerPreviewUrl: null,
                      }))
                    }
                  >
                    Hapus Banner
                  </Button>
                ) : null}
              </div>
              {uploadError ? (
                <p className="text-xs text-danger">{uploadError}</p>
              ) : null}
              {formState.bannerPreviewUrl ? (
                <div className="relative h-24 w-48 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
                  <Image
                    src={formState.bannerPreviewUrl}
                    alt="Pratinjau banner promosi"
                    fill
                    sizes="192px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 border-t border-[var(--border-sand)] pt-4">
            <FormField
              id="promo-scope"
              label="Target Scope Promosi"
              error={
                fieldErrors.scope?.[0] ??
                fieldErrors.targets?.[0] ??
                fieldErrors.categoryIds?.[0] ??
                fieldErrors.productIds?.[0] ??
                fieldErrors.variantIds?.[0]
              }
            >
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={formState.scope}
                  onChange={(e) => {
                    const nextScope = e.target.value as PromotionScope;
                    setFormState((prev) => ({
                      ...prev,
                      scope: nextScope,
                      categoryIds:
                        nextScope === 'category' ? prev.categoryIds : [],
                      productIds:
                        nextScope === 'product' ? prev.productIds : [],
                      variantIds:
                        nextScope === 'variant' ? prev.variantIds : [],
                    }));
                  }}
                >
                  {PROMOTION_SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {PROMOTION_COPY.SCOPE_LABELS[scope]}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>

            {formState.scope === 'category'
              ? renderScopeTargets(
                  references.categories,
                  formState.categoryIds,
                  (id) =>
                    setFormState((prev) => ({
                      ...prev,
                      categoryIds: toggleIdInList(prev.categoryIds, id),
                    })),
                  'Belum ada kategori tersedia.',
                )
              : null}

            {formState.scope === 'product'
              ? renderScopeTargets(
                  references.products,
                  formState.productIds,
                  (id) =>
                    setFormState((prev) => ({
                      ...prev,
                      productIds: toggleIdInList(prev.productIds, id),
                    })),
                  'Belum ada produk tersedia.',
                )
              : null}

            {formState.scope === 'variant'
              ? renderScopeTargets(
                  references.variants,
                  formState.variantIds,
                  (id) =>
                    setFormState((prev) => ({
                      ...prev,
                      variantIds: toggleIdInList(prev.variantIds, id),
                    })),
                  'Belum ada varian SKU tersedia.',
                )
              : null}
          </div>

          <div className="space-y-2 border-t border-[var(--border-sand)] pt-4">
            <p className="ui-field-label">
              Target Cabang (Kosongkan untuk Semua Cabang Aktif)
            </p>
            {fieldErrors.branchIds?.[0] ? (
              <p className="text-xs text-danger">{fieldErrors.branchIds[0]}</p>
            ) : null}
            <div className="flex flex-wrap gap-4">
              {references.branches.map((branch) => (
                <label
                  key={branch.id}
                  className="flex cursor-pointer items-center gap-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={formState.branchIds.includes(branch.id)}
                    onChange={() =>
                      setFormState((prev) => ({
                        ...prev,
                        branchIds: toggleIdInList(prev.branchIds, branch.id),
                      }))
                    }
                  />
                  <span>
                    {branch.name}
                    {!branch.isActive ? ' (Nonaktif)' : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Card tone="cream" className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles
                size={16}
                className="text-burgundy"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold">
                Pratinjau Perhitungan Shared Engine
              </h3>
            </div>
            <ul className="space-y-1 text-xs">
              {previewExamples.map((scenario) => (
                <li
                  key={`${scenario.unitPriceIdr}-${scenario.quantity}`}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-sand)]/60 pb-1 last:border-b-0"
                >
                  <span>
                    {scenario.quantity} × {formatIdr(scenario.unitPriceIdr)}{' '}
                    (Bruto {formatIdr(scenario.lineGrossIdr)})
                  </span>
                  <span className="font-medium">
                    {scenario.formattedSummary}
                    {scenario.wasCapped ? ' [Batas Maks/Baris]' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleSavePromotion()}
              disabled={isSaving || isUploadingBanner}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Promosi'}
            </Button>
          </div>
        </Card>
      ) : null}

      {promotions.length === 0 ? (
        <Feedback title={ADMIN_CATALOG_COPY.PROMOTIONS.EMPTY} />
      ) : (
        <div className="space-y-4">
          {promotions.map((item) => {
            const clockState = derivePromotionClockState(
              item.startsAt,
              item.endsAt,
            );
            const targetCount =
              item.scope === 'category'
                ? item.categoryIds.length
                : item.scope === 'product'
                  ? item.productIds.length
                  : item.scope === 'variant'
                    ? item.variantIds.length
                    : 0;

            return (
              <Card key={item.id} tone="surface" className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-burgundy font-serif text-lg font-bold">
                        {item.title}
                      </h3>
                      <Badge tone={getClockBadgeTone(clockState)}>
                        {PROMOTION_COPY.CLOCK_LABELS[clockState]}
                      </Badge>
                      <Badge
                        tone={
                          item.status === 'published' ? 'success' : 'neutral'
                        }
                      >
                        {ADMIN_CATALOG_COPY.PRODUCTS.STATUS_LABELS[item.status]}
                      </Badge>
                      <Badge tone={item.isEnabled ? 'accent' : 'neutral'}>
                        {item.isEnabled ? 'Toggle Aktif' : 'Toggle Nonaktif'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Slug: <code>{item.slug}</code> · Prioritas:{' '}
                      {item.priority}
                    </p>
                  </div>

                  <div className="admin-inline-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditForm(item)}
                    >
                      Ubah
                    </Button>
                    {item.status !== 'archived' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setArchiveTarget(item)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Arsipkan
                      </Button>
                    ) : null}
                  </div>
                </div>

                {item.bannerImageUrl ? (
                  <div className="relative h-28 w-full max-w-md overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
                    <Image
                      src={item.bannerImageUrl}
                      alt={`Banner ${item.title}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 448px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : null}

                {item.description ? (
                  <p className="text-cocoa text-sm">{item.description}</p>
                ) : null}

                <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground block">
                      Nilai Diskon
                    </span>
                    <strong>
                      {item.discountType === 'percentage'
                        ? `${item.discountValue}%`
                        : `${formatIdr(item.discountValue)} / unit`}
                    </strong>
                    {item.maxDiscountIdr !== null ? (
                      <span className="text-muted-foreground block">
                        Maks. {formatIdr(item.maxDiscountIdr)} / baris
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-muted-foreground block">
                      Min. Belanja Eligible
                    </span>
                    <strong>{formatIdr(item.minSpendIdr)}</strong>
                  </div>

                  <div>
                    <span className="text-muted-foreground block">
                      Scope & Target
                    </span>
                    <strong>{PROMOTION_COPY.SCOPE_LABELS[item.scope]}</strong>
                    {item.scope !== 'all' ? (
                      <span className="text-muted-foreground block">
                        {targetCount} target dipilih
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-muted-foreground block">
                      Cabang & Jadwal WIB
                    </span>
                    <strong>
                      {item.branchIds.length === 0
                        ? PROMOTION_COPY.ALL_ACTIVE_BRANCHES_LABEL
                        : `${item.branchIds.length} cabang dipilih`}
                    </strong>
                    <span className="text-muted-foreground block">
                      {formatJakartaDateTimeDisplay(item.startsAt)} –{' '}
                      {formatJakartaDateTimeDisplay(item.endsAt)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={ADMIN_CATALOG_COPY.PROMOTIONS.ARCHIVE_CONFIRM_TITLE}
        description={ADMIN_CATALOG_COPY.PROMOTIONS.ARCHIVE_CONFIRM_DESC}
      >
        <div className="mt-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setArchiveTarget(null)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleConfirmArchive()}
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending
              ? 'Mengarsipkan...'
              : ADMIN_CATALOG_COPY.PROMOTIONS.ARCHIVE_CONFIRM_SUBMIT}
          </Button>
        </div>
      </Dialog>

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Tag size={14} aria-hidden="true" />
        {PROMOTION_COPY.NON_STACKABLE_NOTE}
      </p>
    </div>
  );
}
