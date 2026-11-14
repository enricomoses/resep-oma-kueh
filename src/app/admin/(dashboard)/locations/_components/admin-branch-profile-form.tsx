'use client';

import { MapPin } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { AdminSectionHeader } from '@/app/admin/(dashboard)/_components/admin-section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import type {
  AdminBranchItem,
  UpdateAdminBranchInput,
} from '@/types/admin-catalog';
import { cn } from '@/utils';
import {
  buildWhatsappTargetUrl,
  isAllowedMapsUrl,
  normalizeWhatsappDigits,
} from '@/utils/admin-branches';
import { updateAdminBranchSchema } from '@/validations/admin-catalog.schema';

import { AdminBranchFulfillmentBox } from './admin-branch-fulfillment-box';
import { AdminBranchWhatsappField } from './admin-branch-whatsapp-field';

interface AdminBranchProfileFormProps {
  branch: AdminBranchItem;
  isPending: boolean;
  serverError: string | null;
  serverFieldErrors: Record<string, string[]>;
  onSave: (payload: UpdateAdminBranchInput) => Promise<void>;
  className?: string;
}

/** Form card for editing branch profile, address, WhatsApp routing, and fulfillment settings. */
export function AdminBranchProfileForm({
  branch,
  isPending,
  serverError,
  serverFieldErrors,
  onSave,
  className,
}: AdminBranchProfileFormProps) {
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

    const parsed = updateAdminBranchSchema.safeParse({
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
    });
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
    <Card tone="surface" className={cn('admin-locations-panel', className)}>
      <AdminSectionHeader
        headingAs="h3"
        titleClassName="admin-row-title"
        title={
          <>
            <MapPin size={18} aria-hidden="true" />{' '}
            <span>Profil & Pengaturan {branch.name}</span>
          </>
        }
        description={
          <>
            Kode cabang permanen: <code>{branch.code}</code>
          </>
        }
        actions={
          <Badge
            tone={branch.readiness.hasConfirmedAddress ? 'success' : 'accent'}
          >
            {branch.readiness.hasConfirmedAddress
              ? 'Alamat Terkonfirmasi'
              : 'Alamat Belum Ditetapkan'}
          </Badge>
        }
      />

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

        <AdminBranchWhatsappField
          branchId={branch.id}
          whatsappNumber={whatsappNumber}
          waTargetPreview={waTargetPreview}
          whatsappChanged={whatsappChanged}
          confirmWhatsappChange={confirmWhatsappChange}
          whatsappError={mergedFieldErrors.whatsappNumber?.[0]}
          confirmError={mergedFieldErrors.confirmWhatsappChange?.[0]}
          onWhatsappChange={(value) => {
            setWhatsappNumber(value);
            setConfirmWhatsappChange(false);
          }}
          onConfirmChange={setConfirmWhatsappChange}
        />

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

        <AdminBranchFulfillmentBox
          allowPickup={allowPickup}
          allowDelivery={allowDelivery}
          fulfillmentReviewed={fulfillmentReviewed}
          reviewError={mergedFieldErrors.fulfillmentReviewedForProduction?.[0]}
          onAllowPickupChange={setAllowPickup}
          onAllowDeliveryChange={setAllowDelivery}
          onFulfillmentReviewedChange={setFulfillmentReviewed}
        />

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
