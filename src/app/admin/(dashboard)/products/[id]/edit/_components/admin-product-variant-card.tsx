'use client';

import { Archive, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type {
  AdminConfigVariant,
  AdminVariantStatus,
} from '@/types/admin-catalog';

interface AdminProductVariantCardProps {
  index: number;
  variant: AdminConfigVariant;
  isPersisted: boolean;
  offerCount: number;
  fieldErrors: Record<string, string[]>;
  onPatch: (patch: Partial<AdminConfigVariant>) => void;
  onSoftArchive: () => void;
  onRemoveUnsaved: () => void;
}

function getStatusTone(status: AdminVariantStatus) {
  if (status === 'active') return 'success';
  if (status === 'archived') return 'neutral';
  return 'accent';
}

/** Single SKU variant configuration card with immutable persisted-SKU guard and pricing inputs. */
export function AdminProductVariantCard({
  index,
  variant,
  isPersisted,
  offerCount,
  fieldErrors,
  onPatch,
  onSoftArchive,
  onRemoveUnsaved,
}: AdminProductVariantCardProps) {
  const prefix = `variants.${index}`;

  return (
    <Card className="admin-editor-item-card">
      <div className="admin-editor-item-header">
        <div className="admin-inline-actions">
          <strong>
            Varian #{index + 1}: {variant.name || variant.sku}
          </strong>
          <Badge tone={getStatusTone(variant.status)}>{variant.status}</Badge>
          {variant.isDefault ? <Badge tone="accent">Default</Badge> : null}
          {isPersisted ? (
            <span className="admin-row-meta">
              Tawaran cabang aktif: {offerCount}
            </span>
          ) : (
            <Badge tone="neutral">Baru (belum disimpan)</Badge>
          )}
        </div>

        <div className="admin-inline-actions">
          {variant.status !== 'archived' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSoftArchive}
            >
              <Archive size={14} aria-hidden="true" />
              <span>Arsipkan Varian</span>
            </Button>
          ) : null}
          {!isPersisted ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveUnsaved}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Hapus Baris Baru</span>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="admin-form-row-2">
        <FormField
          label="Kode SKU"
          required
          helper={
            isPersisted
              ? 'SKU permanen setelah disimpan.'
              : 'Huruf kapital, angka, strip (-), atau garis bawah (_).'
          }
          error={fieldErrors[`${prefix}.sku`]?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={variant.sku}
              readOnly={isPersisted}
              disabled={isPersisted}
              onChange={(e) => onPatch({ sku: e.target.value.toUpperCase() })}
            />
          )}
        </FormField>

        <FormField
          label="Nama Varian"
          required
          error={fieldErrors[`${prefix}.name`]?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={variant.name}
              onChange={(e) => onPatch({ name: e.target.value })}
            />
          )}
        </FormField>
      </div>

      <div className="admin-form-row-3">
        <FormField
          label="Label Ukuran / Kemasan (DB)"
          error={fieldErrors[`${prefix}.sizeLabel`]?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              placeholder="Mis. 20 cm / Box 12 slices"
              value={variant.sizeLabel ?? ''}
              onChange={(e) =>
                onPatch({
                  sizeLabel: e.target.value.length > 0 ? e.target.value : null,
                })
              }
            />
          )}
        </FormField>

        <FormField
          label="Harga Dasar (IDR)"
          required
          error={fieldErrors[`${prefix}.basePriceIdr`]?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              min={1}
              step={1}
              value={String(variant.basePriceIdr)}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                onPatch({
                  basePriceIdr: Number.isFinite(parsed) ? parsed : 0,
                });
              }}
            />
          )}
        </FormField>

        <FormField
          label="Status Varian"
          required
          error={fieldErrors[`${prefix}.status`]?.[0]}
        >
          {(props) => (
            <Select
              {...props}
              value={variant.status}
              onChange={(e) =>
                onPatch({ status: e.target.value as AdminVariantStatus })
              }
            >
              <option value="draft">Draf</option>
              <option value="active">Aktif</option>
              <option value="archived">Diarsipkan</option>
            </Select>
          )}
        </FormField>
      </div>

      <div className="admin-form-row-3">
        <FormField
          label="Maks Qty per Pesanan"
          required
          error={fieldErrors[`${prefix}.maxQuantityPerOrder`]?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              min={1}
              max={99}
              value={String(variant.maxQuantityPerOrder)}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                onPatch({
                  maxQuantityPerOrder: Number.isFinite(parsed) ? parsed : 1,
                });
              }}
            />
          )}
        </FormField>

        <FormField
          label="Urutan Tampil"
          required
          error={fieldErrors[`${prefix}.sortOrder`]?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              min={0}
              max={9999}
              value={String(variant.sortOrder)}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                onPatch({ sortOrder: Number.isFinite(parsed) ? parsed : 0 });
              }}
            />
          )}
        </FormField>

        <div className="admin-checkbox-align">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={variant.isDefault}
              disabled={variant.status === 'archived'}
              onChange={(e) => onPatch({ isDefault: e.target.checked })}
            />
            <span>Jadikan Varian Default</span>
          </label>
          {fieldErrors[`${prefix}.isDefault`]?.[0] ? (
            <p className="field-error" role="alert">
              {fieldErrors[`${prefix}.isDefault`][0]}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
