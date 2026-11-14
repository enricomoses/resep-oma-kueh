'use client';

import type { Dispatch, SetStateAction } from 'react';

import { Badge } from '@/components/ui/badge';
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
  success: string | null;
  isSaving: boolean;
  onSave: () => void;
  className?: string;
}

export function AdminShippingBannerCard({
  form,
  setForm,
  error,
  success,
  isSaving,
  onSave,
  className,
}: AdminShippingBannerCardProps) {
  return (
    <Card tone="cream" className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="admin-card-title">
            Banner Informasi Pengiriman (Owner-Approved)
          </h2>
          <p className="text-muted-foreground text-xs">
            {PROMOTION_COPY.SHIPPING_BANNER_SAFETY_NOTE}
          </p>
        </div>
        <Badge tone={form.status === 'published' ? 'success' : 'neutral'}>
          {form.status === 'published'
            ? 'Terpublikasi ke Publik'
            : 'Draf (Tersembunyi)'}
        </Badge>
      </div>

      {error ? <Feedback tone="error" title={error} announce /> : null}
      {success ? <Feedback tone="success" title={success} announce /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="shipping-banner-title" label="Judul Banner Info">
          {(fieldProps) => (
            <Input
              {...fieldProps}
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
            value={form.body}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, body: e.target.value }))
            }
            placeholder="Contoh: Biaya kurir diinformasikan oleh admin WhatsApp cabang sesuai alamat tujuan."
          />
        )}
      </FormField>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs">
          {form.expectedUpdatedAt
            ? `Terakhir disimpan: ${formatJakartaDateTimeDisplay(form.expectedUpdatedAt)}`
            : 'Belum pernah disimpan ke database.'}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Banner Info'}
        </Button>
      </div>
    </Card>
  );
}
