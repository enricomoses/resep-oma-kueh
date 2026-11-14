import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  BUNDLE_CUSTOMIZER_COPY,
  CATALOG_AVAILABILITY_LABELS,
} from '@/constants/catalog.constant';
import type { ProductDetailOptionGroup } from '@/types/catalog';
import { cn, formatIdr } from '@/utils';

interface BundleOptionGroupProps {
  group: ProductDetailOptionGroup;
  selectedChoiceIds: string[];
  isGFVariant: boolean;
  onSelectChoice: (groupId: string, choiceId: string) => void;
  className?: string;
}

export function BundleOptionGroup({
  group,
  selectedChoiceIds,
  isGFVariant,
  onSelectChoice,
  className,
}: BundleOptionGroupProps) {
  return (
    <div className={cn('space-y-2.5', className)}>
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
          const isDisabled = !choice.isActive || isSoldOut || isNotOffered;
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
}
