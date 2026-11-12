import { AlertCircle, Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  BUNDLE_CUSTOMIZER_COPY,
  CATALOG_AVAILABILITY_LABELS,
} from '@/constants/catalog.constant';
import { formatIdr } from '@/features/catalog/pricing';
import { cn } from '@/utils';
import type {
  BundleValidationResult,
  FixedComponentDetail,
  ProductDetailVariant,
  SelectedChoiceDetail,
} from '@/types/catalog';

export interface BundleCustomizerProps {
  variant: ProductDetailVariant;
  selectedChoiceIds: string[];
  onSelectChoice: (groupId: string, choiceId: string) => void;
  validationResult: BundleValidationResult | null;
  className?: string;
}

export function BundleCustomizer({
  variant,
  selectedChoiceIds,
  onSelectChoice,
  validationResult,
  className,
}: BundleCustomizerProps) {
  const selectedCount = validationResult?.selectedChoices.length ?? 0;
  const targetUnitsTotal = variant.bundleUnitsTotal ?? 12;
  const currentUnitsTotal =
    (validationResult?.fixedComponents.reduce(
      (acc: number, fc: FixedComponentDetail) => acc + fc.quantity,
      0,
    ) ?? 6) +
    (validationResult?.selectedChoices.reduce(
      (acc: number, sc: SelectedChoiceDetail) => acc + sc.quantity,
      0,
    ) ?? 0);

  const errors = validationResult?.errors ?? [];
  const isGFVariant =
    variant.verifiedDietaryTags.some((t) => t.slug === 'gluten-free') ||
    variant.sku.includes('GF');

  return (
    <div className={cn('space-y-6', className)} data-testid="bundle-customizer">
      {/* Header & Slices Counter */}
      <div className="border-burgundy/10 rounded-lg border bg-cream/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-burgundy font-serif text-base font-bold">
              {BUNDLE_CUSTOMIZER_COPY.TITLE}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              {BUNDLE_CUSTOMIZER_COPY.SUBTITLE}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {BUNDLE_CUSTOMIZER_COPY.TOTAL_UNITS_LABEL}
            </span>
            <Badge
              tone={
                currentUnitsTotal === targetUnitsTotal ? 'success' : 'accent'
              }
              className="font-mono text-xs font-semibold"
            >
              {BUNDLE_CUSTOMIZER_COPY.TOTAL_UNITS_VALUE(
                currentUnitsTotal,
                targetUnitsTotal,
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* 1. Fixed Components (Cheese 3 + Choco 3 = 6 slices) */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
            {BUNDLE_CUSTOMIZER_COPY.FIXED_SECTION_TITLE}
          </h4>
          <span className="text-muted-foreground text-[11px]">
            {BUNDLE_CUSTOMIZER_COPY.FIXED_SECTION_NOTE}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {variant.fixedComponents.map((fixed) => {
            const displayName =
              fixed.componentVariant?.name ||
              (fixed.componentSlot.toLowerCase() === 'cheese'
                ? 'Cheese Chiffon'
                : 'Choco Chiffon');

            return (
              <Card
                key={fixed.id}
                className="border-burgundy/15 bg-warm-cream/40 flex items-center justify-between p-3.5"
              >
                <div className="space-y-0.5">
                  <span className="text-burgundy text-xs font-semibold">
                    {displayName}
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    {fixed.quantity} {BUNDLE_CUSTOMIZER_COPY.SLICES_SUFFIX}{' '}
                    tetap
                  </p>
                </div>
                <Badge tone="neutral" className="text-[10px]">
                  Termasuk
                </Badge>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 2. Selectable Option Groups (Group C & Group D) */}
      <div className="space-y-5">
        <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
          {BUNDLE_CUSTOMIZER_COPY.SELECTION_SECTION_TITLE}
        </h4>

        {variant.optionGroups.map((group) => {
          return (
            <div key={group.id} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-burgundy text-xs font-semibold">
                  {group.name}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  Pilih {group.minSelect} rasa (×{group.quantityPerSelection}{' '}
                  {BUNDLE_CUSTOMIZER_COPY.SLICES_SUFFIX})
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label={group.name}
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
              >
                {group.choices.map((choice) => {
                  const isSelected = selectedChoiceIds.includes(choice.id);
                  const isSoldOut =
                    choice.componentVariant?.availabilityStatus === 'sold_out';
                  const isNotOffered =
                    choice.componentVariant?.isOfferedInBranch === false;
                  const isDisabled =
                    !choice.isActive || isSoldOut || isNotOffered;

                  const hasPriceDelta = choice.priceDeltaIdr > 0;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isDisabled}
                      onClick={() => onSelectChoice(group.id, choice.id)}
                      className={cn(
                        'relative flex flex-col items-start justify-between rounded-lg border p-3 text-left transition-all',
                        isSelected
                          ? 'border-burgundy bg-burgundy/5 ring-burgundy shadow-sm ring-1'
                          : 'border-burgundy/15 hover:border-burgundy/40 bg-white hover:bg-cream/30',
                        isDisabled &&
                          'hover:border-burgundy/15 cursor-not-allowed bg-stone-100 opacity-50',
                      )}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <span className="text-foreground text-xs font-medium">
                          {choice.label}
                        </span>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {isSelected ? (
                            <span className="bg-burgundy flex h-4 w-4 items-center justify-center rounded-full text-cream">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2 flex w-full flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="text-muted-foreground">
                          {group.quantityPerSelection}{' '}
                          {BUNDLE_CUSTOMIZER_COPY.SLICES_SUFFIX}
                        </span>

                        <div className="flex items-center gap-1">
                          {isSoldOut ? (
                            <Badge tone="danger" className="text-[10px]">
                              {CATALOG_AVAILABILITY_LABELS.sold_out}
                            </Badge>
                          ) : hasPriceDelta ? (
                            <Badge tone="accent" className="text-[10px]">
                              +{formatIdr(choice.priceDeltaIdr)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">
                              Tanpa biaya tambahan
                            </span>
                          )}

                          {isGFVariant &&
                          choice.componentVariant?.verifiedDietaryTags?.some(
                            (t) => t.slug === 'gluten-free',
                          ) ? (
                            <Badge tone="success" className="text-[10px]">
                              GF
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Validation Errors / Guidance Notice */}
      {selectedCount < 2 ? (
        <div className="border-burgundy/15 rounded-lg border bg-cream/40 p-3">
          <div className="flex items-center gap-2">
            <Info
              size={16}
              className="text-burgundy shrink-0"
              aria-hidden="true"
            />
            <p className="text-foreground/80 text-xs">
              {BUNDLE_CUSTOMIZER_COPY.MISSING_SELECTIONS_WARNING(
                2 - selectedCount,
              )}
            </p>
          </div>
        </div>
      ) : null}

      {(selectedCount >= 2
        ? errors
        : errors.filter(
            (e) =>
              e.code !== 'GROUP_SELECTION_COUNT_MISMATCH' &&
              e.code !== 'INVALID_TOTAL_UNITS',
          )
      ).length > 0 ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-danger/20 bg-danger/5 p-3.5"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-danger"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <strong className="block text-xs font-semibold text-danger">
                Perhatian Konfigurasi Paket:
              </strong>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-danger/90">
                {(selectedCount >= 2
                  ? errors
                  : errors.filter(
                      (e) =>
                        e.code !== 'GROUP_SELECTION_COUNT_MISMATCH' &&
                        e.code !== 'INVALID_TOTAL_UNITS',
                    )
                ).map((err, idx) => (
                  <li key={idx}>{err.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. Price & Slices Breakdown Summary */}
      {validationResult ? (
        <div className="border-burgundy/10 bg-warm-cream/30 space-y-2 rounded-lg border p-3.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {BUNDLE_CUSTOMIZER_COPY.BASE_PRICE_LABEL}
            </span>
            <span className="text-foreground font-medium">
              {formatIdr(validationResult.baseOrOverrideIdr)}
            </span>
          </div>

          {validationResult.choiceDeltasTotalIdr > 0 ? (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {BUNDLE_CUSTOMIZER_COPY.OPTION_DELTA_LABEL}
              </span>
              <span className="text-burgundy font-medium">
                +{formatIdr(validationResult.choiceDeltasTotalIdr)}
              </span>
            </div>
          ) : null}

          <div className="border-burgundy/10 flex justify-between border-t pt-2 text-xs font-semibold">
            <span className="text-burgundy">
              {BUNDLE_CUSTOMIZER_COPY.TOTAL_UNIT_GROSS_LABEL}
            </span>
            <span className="text-burgundy font-serif text-sm font-bold">
              {formatIdr(validationResult.effectivePriceIdr)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
