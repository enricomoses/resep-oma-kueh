'use client';

import type { Dispatch, SetStateAction } from 'react';

import { StatusIndicator } from '@/components/common/status/status-indicator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PROMOTION_COPY } from '@/constants/promotion.constant';
import type { ShippingBannerFormState } from '@/types/promotion';
import { cn } from '@/utils';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';

interface AdminShippingBannerCardProps {
  form: ShippingBannerFormState;
  setForm: Dispatch<SetStateAction<ShippingBannerFormState>>;
  error: string | null;
  isSaving: boolean;
  onSave: () => void;
  className?: string;
}

export function AdminShippingBannerCard({
  form,
  setForm,
  error,
  isSaving,
  onSave,
  className,
}: AdminShippingBannerCardProps) {
  return (
    <Card tone="surface" className={cn('admin-promo-card', className)}>
      <div className="admin-promo-card-head">
        <div>
          <h2 className="admin-promo-card-title">
            Banner Informasi Pengiriman (Owner-Approved)
          </h2>
          <p className="admin-promo-card-sub">
            {PROMOTION_COPY.SHIPPING_BANNER_SAFETY_NOTE}
          </p>
        </div>
        <StatusIndicator
          tone={form.status === 'published' ? 'success' : 'neutral'}
          label={
            form.status === 'published'
              ? 'Terpublikasi ke Publik'
              : 'Draf (Tersembunyi)'
          }
        />
      </div>

      {error ? <Feedback tone="error" title={error} announce /> : null}

      <div className="admin-promo-grid-2">
        <FormField id="shipping-banner-title" label="Judul Banner Info">
          {(fieldProps) => (
            <Input
              {...fieldProps}
              sizeVariant="compact"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Contoh: Info Ongkos Kirim Area Surabaya"
            />
          )}
        </FormField>
        <FormField id="shipping-banner-status" label="Status Publikasi">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              sizeVariant="compact"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status:
                    e.target.value === 'published' ? 'published' : 'draft',
                }))
              }
            >
              <option value="draft">Draf (Jangan tampilkan ke publik)</option>
              <option value="published">
                Terpublikasi (Tampilkan di Home &amp; Checkout)
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
            value={form.body}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, body: e.target.value }))
            }
            placeholder="Contoh: Biaya kurir diinformasikan oleh admin WhatsApp cabang sesuai alamat tujuan."
          />
        )}
      </FormField>

      <div className="admin-promo-card-footer">
        <span className="admin-promo-timestamp">
          {form.expectedUpdatedAt
            ? `Terakhir disimpan: ${formatJakartaDateTimeDisplay(form.expectedUpdatedAt)}`
            : 'Belum pernah disimpan ke database.'}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={isSaving}
          loadingLabel="Menyimpan..."
          onClick={onSave}
          disabled={isSaving}
        >
          <span>Simpan Banner Info</span>
        </Button>
      </div>
    </Card>
  );
}
