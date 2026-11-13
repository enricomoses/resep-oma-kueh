import 'server-only';
import { createHash } from 'node:crypto';
import { formatWhatsappDigits } from '@/utils/checkout';

export interface FingerprintLineInput {
  variantId: string;
  sku: string;
  quantity: number;
  unitGrossIdr: number;
  unitPriceIdr: number;
  discountIdr: number;
  lineTotalIdr: number;
  options: Array<{
    choiceId: string;
    priceDeltaIdr: number;
  }>;
  appliedPromotionId?: string | null;
}

export interface GenerateQuoteFingerprintParams {
  branchId: string;
  whatsappNumber: string;
  lines: FingerprintLineInput[];
  subtotalIdr: number;
  discountIdr: number;
  estimatedTotalIdr: number;
}

/**
 * Computes a deterministic canonical SHA-256 fingerprint for a business quote (PRD §27.3).
 *
 * Rules:
 * - Includes: branch ID, sanitized trusted WA number, stably sorted lines,
 *   quantities, unit prices, discounts, line totals, sorted options, promo ID,
 *   subtotal, total discount, and estimated total.
 * - Excludes: quotedAt, expiresAt, requestId, query ordering instability,
 *   and user PII (customerName, address, note, fulfillment details).
 */
export function generateQuoteFingerprint(
  params: GenerateQuoteFingerprintParams,
): string {
  const sortedLines = [...params.lines].sort((a, b) => {
    const vCmp = a.variantId.localeCompare(b.variantId);
    if (vCmp !== 0) return vCmp;
    const aOpts = a.options
      .map((o) => o.choiceId)
      .sort()
      .join(',');
    const bOpts = b.options
      .map((o) => o.choiceId)
      .sort()
      .join(',');
    return aOpts.localeCompare(bOpts);
  });

  const canonicalPayload = {
    branchId: params.branchId,
    whatsappNumber: formatWhatsappDigits(params.whatsappNumber),
    lines: sortedLines.map((line) => {
      const sortedOptions = [...line.options].sort((a, b) =>
        a.choiceId.localeCompare(b.choiceId),
      );
      return {
        variantId: line.variantId,
        sku: line.sku,
        quantity: line.quantity,
        unitGrossIdr: line.unitGrossIdr,
        unitPriceIdr: line.unitPriceIdr,
        discountIdr: line.discountIdr,
        lineTotalIdr: line.lineTotalIdr,
        options: sortedOptions.map((opt) => ({
          choiceId: opt.choiceId,
          priceDeltaIdr: opt.priceDeltaIdr,
        })),
        appliedPromotionId: line.appliedPromotionId ?? null,
      };
    }),
    subtotalIdr: params.subtotalIdr,
    discountIdr: params.discountIdr,
    estimatedTotalIdr: params.estimatedTotalIdr,
  };

  return createHash('sha256')
    .update(JSON.stringify(canonicalPayload))
    .digest('hex');
}
