import type { CheckoutPrepareResponse } from '@/types/checkout';
import { cn, formatIdr } from '@/utils';

type QuotedLine = CheckoutPrepareResponse['lines'][number];

interface CheckoutQuoteLineRowProps {
  line: QuotedLine;
  className?: string;
}

export function CheckoutQuoteLineRow({
  line,
  className,
}: CheckoutQuoteLineRowProps) {
  return (
    <div className={cn('checkout-quote-line', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-burgundy font-serif font-bold">
            {line.productName} — {line.sizeLabel ?? line.variantName}
          </p>
          <p className="text-cocoa text-xs">
            {line.quantity} × {formatIdr(line.unitPriceIdr)}
            {line.unitGrossIdr > line.unitPriceIdr
              ? ` (Harga normal ${formatIdr(line.unitGrossIdr)})`
              : ''}
          </p>
        </div>
        <p className="text-burgundy font-serif font-bold">
          {formatIdr(line.lineTotalIdr)}
        </p>
      </div>

      {line.bundleBreakdown && line.bundleBreakdown.length > 0 ? (
        <ul className="text-cocoa mt-2 list-inside list-disc space-y-0.5 text-xs">
          {line.bundleBreakdown.map((comp, idx) => (
            <li key={`${comp.label}-${idx}`}>
              {comp.label} ({comp.quantity} potong)
              {comp.priceDeltaIdr > 0
                ? ` (+${formatIdr(comp.priceDeltaIdr)})`
                : comp.isFixed
                  ? ' [Termasuk]'
                  : ''}
            </li>
          ))}
        </ul>
      ) : line.options.length > 0 ? (
        <ul className="text-cocoa mt-2 list-inside list-disc space-y-0.5 text-xs">
          {line.options.map((opt) => (
            <li key={opt.choiceId}>
              {opt.label}
              {opt.priceDeltaIdr > 0
                ? ` (+${formatIdr(opt.priceDeltaIdr)})`
                : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
