'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import {
  useAdminBranches,
  useReplaceAdminBranchHours,
  useUpdateAdminBranch,
} from '@/hooks/use-admin-catalog';
import { ApiClientError } from '@/lib/errors';
import type {
  AdminBranchItem,
  AdminBranchesResponse,
  ReplaceBranchHoursInput,
  UpdateAdminBranchInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import { cn } from '@/utils';
import {
  buildWhatsappTargetUrl,
  isAllowedMapsUrl,
  normalizeWhatsappDigits,
} from '@/utils/admin-branches';
import { updateAdminBranchSchema } from '@/validations/admin-catalog.schema';

import { AdminBranchHoursEditor } from './admin-branch-hours-editor';

interface AdminLocationsViewProps {
  profile: AdminSessionProfile;
  initialData: AdminBranchesResponse;
  className?: string;
}

interface BranchProfileFormProps {
  branch: AdminBranchItem;
  isPending: boolean;
  serverError: string | null;
  serverFieldErrors: Record<string, string[]>;
  onSave: (payload: UpdateAdminBranchInput) => Promise<void>;
}

function BranchProfileForm({
  branch,
  isPending,
  serverError,
  serverFieldErrors,
  onSave,
}: BranchProfileFormProps) {
  const [name, setName] = useState(branch.name);
  const [city, setCity] = useState(branch.city);
  const [address, setAddress] = useState(branch.address ?? '');
  const [mapsUrl, setMapsUrl] = useState(branch.mapsUrl ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(branch.whatsappNumber);
  const [description, setDescription] = useState(branch.description ?? '');
  const [sortOrder, setSortOrder] = useState(String(branch.sortOrder));
  const [allowPickup, setAllowPickup] = useState(branch.allowPickup);
  const [allowDelivery, setAllowDelivery] = useState(branch.allowDelivery);
  const [confirmWhatsappChange, setConfirmWhatsappChange] = useState(false);
  const [fulfillmentReviewed, setFulfillmentReviewed] = useState(
    branch.allowPickup || branch.allowDelivery,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const normalizedWa = normalizeWhatsappDigits(whatsappNumber);
  const waTargetPreview = buildWhatsappTargetUrl(whatsappNumber);
  const whatsappChanged =
    normalizedWa !== null && normalizedWa !== branch.whatsappNumber;
  const enablesFulfillment =
    (!branch.allowPickup && allowPickup) ||
    (!branch.allowDelivery && allowDelivery);

  const mergedFieldErrors = {
    ...serverFieldErrors,
    ...fieldErrors,
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (whatsappChanged && !confirmWhatsappChange) {
      const msg =
        ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.WHATSAPP_REVERIFY_REQUIRED;
      setFormError(msg);
      setFieldErrors({ confirmWhatsappChange: [msg] });
      return;
    }

    if (enablesFulfillment && !fulfillmentReviewed) {
      const msg =
        ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.FULFILLMENT_REVIEW_REQUIRED;
      setFormError(msg);
      setFieldErrors({ fulfillmentReviewedForProduction: [msg] });
      return;
    }

    const trimmedMaps = mapsUrl.trim();
    if (trimmedMaps && !isAllowedMapsUrl(trimmedMaps)) {
      const msg = ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_MAPS_URL;
      setFormError(msg);
      setFieldErrors({ mapsUrl: [msg] });
      return;
    }

    const payloadCandidate = {
      expectedUpdatedAt: branch.updatedAt,
      name: name.trim(),
      city: city.trim(),
      address: address.trim() ? address.trim() : null,
      mapsUrl: trimmedMaps ? trimmedMaps : null,
      whatsappNumber: whatsappNumber.trim(),
      description: description.trim() ? description.trim() : null,
      allowPickup,
      allowDelivery,
      sortOrder: Number(sortOrder),
      confirmWhatsappChange,
      fulfillmentReviewedForProduction: fulfillmentReviewed,
    };

    const parsed = updateAdminBranchSchema.safeParse(payloadCandidate);
    if (!parsed.success) {
      const nextErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'root');
        nextErrors[key] = [...(nextErrors[key] ?? []), issue.message];
      }
      setFieldErrors(nextErrors);
      setFormError(
        parsed.error.issues[0]?.message ?? 'Periksa kembali data cabang.',
      );
      return;
    }

    await onSave(parsed.data);
  }

  return (
    <Card tone="surface" className="admin-locations-panel">
      <div className="admin-section-header">
        <div>
          <h3 className="admin-row-title">
            <MapPin size={18} aria-hidden="true" />{' '}
            <span>Profil & Pengaturan {branch.name}</span>
          </h3>
          <p className="admin-section-subtitle">
            Kode cabang permanen: <code>{branch.code}</code>
          </p>
        </div>
        <Badge
          tone={branch.readiness.hasConfirmedAddress ? 'success' : 'accent'}
        >
          {branch.readiness.hasConfirmedAddress
            ? 'Alamat Terkonfirmasi'
            : 'Alamat Belum Ditetapkan'}
        </Badge>
      </div>

      {formError ? <Feedback tone="error" title={formError} announce /> : null}

      {serverError ? (
        <Feedback tone="error" title={serverError} announce />
      ) : null}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="admin-location-form"
      >
        <div className="admin-editor-grid">
          <FormField
            id={`branch-name-${branch.id}`}
            label="Nama Cabang"
            required
            error={mergedFieldErrors.name?.[0]}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            )}
          </FormField>

          <FormField
            id={`branch-city-${branch.id}`}
            label="Kota"
            required
            error={mergedFieldErrors.city?.[0]}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            )}
          </FormField>
        </div>

        <FormField
          id={`branch-address-${branch.id}`}
          label="Alamat Cabang"
          helper={
            branch.code === 'bintaro'
              ? 'Biarkan kosong hingga alamat Bintaro resmi dikonfirmasi Owner.'
              : 'Alamat Surabaya resmi telah dikonfirmasi.'
          }
          error={mergedFieldErrors.address?.[0]}
        >
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={2}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          )}
        </FormField>

        <div className="admin-editor-grid">
          <FormField
            id={`branch-maps-${branch.id}`}
            label="Tautan Google Maps (HTTPS)"
            helper="Hanya domain resmi Google Maps HTTPS (maps.google.com, www.google.com/maps, maps.app.goo.gl)."
            error={mergedFieldErrors.mapsUrl?.[0]}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={mapsUrl}
                onChange={(event) => setMapsUrl(event.target.value)}
              />
            )}
          </FormField>

          <FormField
            id={`branch-sort-${branch.id}`}
            label="Urutan Tampil"
            error={mergedFieldErrors.sortOrder?.[0]}
          >
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                min={0}
                max={10000}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            )}
          </FormField>
        </div>

        <FormField
          id={`branch-wa-${branch.id}`}
          label="Nomor WhatsApp Cabang"
          required
          helper="Format digit internasional tanpa tanda + (contoh 6281703384308). Awalan 08 akan dinormalisasi ke 62."
          error={mergedFieldErrors.whatsappNumber?.[0]}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              inputMode="tel"
              value={whatsappNumber}
              onChange={(event) => {
                setWhatsappNumber(event.target.value);
                setConfirmWhatsappChange(false);
              }}
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
                onChange={(event) =>
                  setConfirmWhatsappChange(event.target.checked)
                }
              />
              <span>{ADMIN_CATALOG_COPY.LOCATIONS.WA_REVERIFY_LABEL}</span>
            </label>
            {mergedFieldErrors.confirmWhatsappChange?.[0] ? (
              <p className="admin-field-error">
                {mergedFieldErrors.confirmWhatsappChange[0]}
              </p>
            ) : null}
          </div>
        ) : null}

        <FormField
          id={`branch-desc-${branch.id}`}
          label="Deskripsi Cabang"
          error={mergedFieldErrors.description?.[0]}
        >
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          )}
        </FormField>

        <div className="admin-fulfillment-box">
          <p className="admin-row-title">Pengaturan Fulfillment</p>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.LOCATIONS.FULFILLMENT_SAFETY_NOTE}
          </p>

          <div className="admin-inline-actions">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={allowPickup}
                onChange={(event) => setAllowPickup(event.target.checked)}
              />
              <span>Izinkan Pickup Cabang</span>
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={allowDelivery}
                onChange={(event) => setAllowDelivery(event.target.checked)}
              />
              <span>Izinkan Delivery Cabang</span>
            </label>
          </div>

          {allowPickup || allowDelivery ? (
            <div className="admin-confirm-box">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={fulfillmentReviewed}
                  onChange={(event) =>
                    setFulfillmentReviewed(event.target.checked)
                  }
                />
                <span>
                  {ADMIN_CATALOG_COPY.LOCATIONS.FULFILLMENT_REVIEW_LABEL}
                </span>
              </label>
              {mergedFieldErrors.fulfillmentReviewedForProduction?.[0] ? (
                <p className="admin-field-error">
                  {mergedFieldErrors.fulfillmentReviewedForProduction[0]}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="admin-inline-actions">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isPending}
            loadingLabel="Menyimpan pengaturan cabang..."
          >
            <span>Simpan Pengaturan Cabang</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AdminLocationsView({
  profile,
  initialData,
  className,
}: AdminLocationsViewProps) {
  const branchesQuery = useAdminBranches(profile, initialData);
  const updateBranchMutation = useUpdateAdminBranch();
  const replaceHoursMutation = useReplaceAdminBranchHours();

  const data = branchesQuery.data ?? initialData;
  const branches = data.branches;

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    branches[0]?.id ?? '',
  );
  const [actionBanner, setActionBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [profileServerError, setProfileServerError] = useState<string | null>(
    null,
  );
  const [profileFieldErrors, setProfileFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [hoursServerError, setHoursServerError] = useState<string | null>(null);

  const selectedBranch =
    branches.find((item) => item.id === selectedBranchId) ??
    branches[0] ??
    null;

  async function handleSaveBranch(payload: UpdateAdminBranchInput) {
    if (!selectedBranch) {
      return;
    }
    setActionBanner(null);
    setProfileServerError(null);
    setProfileFieldErrors({});

    try {
      const response = await updateBranchMutation.mutateAsync({
        branchId: selectedBranch.id,
        payload,
      });
      setActionBanner({
        tone: 'success',
        message: `Pengaturan cabang ${response.data.branch.name} berhasil disimpan.`,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setProfileServerError(error.message);
        setProfileFieldErrors(error.fieldErrors ?? {});
        if (error.status === 409) {
          void branchesQuery.refetch();
        }
      } else {
        setProfileServerError('Gagal menyimpan pengaturan cabang.');
      }
    }
  }

  async function handleSaveHours(payload: ReplaceBranchHoursInput) {
    if (!selectedBranch) {
      return;
    }
    setActionBanner(null);
    setHoursServerError(null);

    try {
      const response = await replaceHoursMutation.mutateAsync({
        branchId: selectedBranch.id,
        payload,
      });
      setActionBanner({
        tone: 'success',
        message: `Jam operasional ${response.data.branch.name} berhasil diperbarui.`,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setHoursServerError(error.message);
        if (error.status === 409) {
          void branchesQuery.refetch();
        }
      } else {
        setHoursServerError('Gagal menyimpan jam operasional cabang.');
      }
    }
  }

  return (
    <section className={cn('admin-section', className)}>
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">
            {ADMIN_CATALOG_COPY.LOCATIONS.TITLE}
          </h2>
          <p className="admin-section-subtitle">
            {ADMIN_CATALOG_COPY.LOCATIONS.SUBTITLE}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={branchesQuery.isFetching}
          loadingLabel="Memuat ulang cabang..."
          onClick={() => {
            void branchesQuery.refetch();
          }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          <span>Muat Ulang</span>
        </Button>
      </div>

      <Card tone="cream" className="admin-readiness-card">
        <h3 className="admin-row-title">
          {ADMIN_CATALOG_COPY.LOCATIONS.READINESS_TITLE}
        </h3>
        <ul className="admin-readiness-list">
          <li>
            <CheckCircle2 size={15} aria-hidden="true" />{' '}
            <span>{ADMIN_CATALOG_COPY.LOCATIONS.SURABAYA_FINAL_NOTE}</span>
          </li>
          <li>
            {data.approvedContacts.bintaroAddressResolved ? (
              <CheckCircle2 size={15} aria-hidden="true" />
            ) : (
              <AlertTriangle size={15} aria-hidden="true" />
            )}{' '}
            <span>
              {data.approvedContacts.bintaroAddressResolved
                ? 'Alamat cabang Bintaro sudah diisi oleh Owner.'
                : ADMIN_CATALOG_COPY.LOCATIONS.BINTARO_UNRESOLVED_NOTE}
            </span>
          </li>
        </ul>

        <div className="admin-readiness-badges">
          {branches.map((branch) => (
            <div key={branch.id} className="admin-readiness-branch-row">
              <strong>{branch.name}</strong>
              <Badge
                tone={
                  branch.readiness.hasConfirmedAddress ? 'success' : 'accent'
                }
              >
                {branch.readiness.hasConfirmedAddress
                  ? 'Alamat Siap'
                  : 'Alamat Unresolved'}
              </Badge>
              <Badge tone={branch.readiness.hasMapsUrl ? 'success' : 'neutral'}>
                {branch.readiness.hasMapsUrl ? 'Maps HTTPS' : 'Belum Ada Maps'}
              </Badge>
              <Badge
                tone={
                  branch.readiness.fulfillmentEnabled ? 'success' : 'neutral'
                }
              >
                {branch.readiness.fulfillmentEnabled
                  ? 'Fulfillment Aktif'
                  : 'Fulfillment Nonaktif'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {actionBanner ? (
        <Feedback
          tone={actionBanner.tone}
          title={actionBanner.message}
          announce
        />
      ) : null}

      {branchesQuery.error instanceof ApiClientError ? (
        <Feedback tone="error" title={branchesQuery.error.message} announce />
      ) : null}

      <div
        className="admin-inline-actions"
        role="tablist"
        aria-label="Pilih cabang"
      >
        {branches.map((branch) => {
          const active = selectedBranch?.id === branch.id;
          return (
            <Button
              key={branch.id}
              type="button"
              role="tab"
              aria-selected={active}
              variant={active ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setSelectedBranchId(branch.id);
                setProfileServerError(null);
                setProfileFieldErrors({});
                setHoursServerError(null);
                setActionBanner(null);
              }}
            >
              <span>
                {branch.name} ({branch.city})
              </span>
            </Button>
          );
        })}
      </div>

      {selectedBranch ? (
        <div className="admin-locations-stack">
          <BranchProfileForm
            key={`profile-${selectedBranch.id}-${selectedBranch.updatedAt}`}
            branch={selectedBranch}
            isPending={updateBranchMutation.isPending}
            serverError={profileServerError}
            serverFieldErrors={profileFieldErrors}
            onSave={handleSaveBranch}
          />
          <AdminBranchHoursEditor
            key={`hours-${selectedBranch.id}-${selectedBranch.updatedAt}`}
            branch={selectedBranch}
            isPending={replaceHoursMutation.isPending}
            serverError={hoursServerError}
            onSaveHours={handleSaveHours}
          />
        </div>
      ) : null}
    </section>
  );
}
