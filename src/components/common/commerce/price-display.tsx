import { cn, formatIdr } from '@/utils';

interface PriceDisplayProps {
  effectivePriceIdr: number;
  grossPriceIdr?: number | null;
  unitLabel?: string;
  priceClassName?: string;
  grossClassName?: string;
  className?: string;
}

export function PriceDisplay({
  effectivePriceIdr,
  grossPriceIdr,
  unitLabel,
  priceClassName,
  grossClassName,
  className,
}: PriceDisplayProps) {
  const hasDiscount =
    grossPriceIdr !== undefined &&
    grossPriceIdr !== null &&
    grossPriceIdr > effectivePriceIdr;

  return (
    <div className={cn(className)}>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'text-burgundy font-serif text-lg font-bold',
            priceClassName,
          )}
        >
          {formatIdr(effectivePriceIdr)}
        </span>
        {hasDiscount ? (
          <span
            className={cn('text-cocoa/60 text-xs line-through', grossClassName)}
          >
            {formatIdr(grossPriceIdr)}
          </span>
        ) : null}
      </div>
      {unitLabel ? (
        <span className="text-cocoa/70 text-[11px]">{unitLabel}</span>
      ) : null}
    </div>
  );
}
