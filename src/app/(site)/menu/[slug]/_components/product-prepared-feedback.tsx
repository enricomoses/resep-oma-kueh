import { ActionLink } from '@/components/ui/action-link';
import { Feedback } from '@/components/ui/feedback';
import { CART_COPY } from '@/constants/cart.constant';
import { PRODUCT_DETAIL_COPY } from '@/constants/catalog.constant';
import { ROUTES } from '@/constants/routes.constant';
import { formatIdr } from '@/features/catalog/pricing';
import type { PreparedCartLinePayload } from '@/types/catalog';
import { withBranch } from '@/utils/branch-url';

interface ProductPreparedFeedbackProps {
  payload: PreparedCartLinePayload;
}

export function ProductPreparedFeedback({
  payload,
}: ProductPreparedFeedbackProps) {
  return (
    <Feedback
      tone="success"
      title={PRODUCT_DETAIL_COPY.CTA_PREPARED_TITLE}
      className="mt-3"
    >
      <div className="space-y-1 text-xs">
        <p>{PRODUCT_DETAIL_COPY.CTA_PREPARED_BODY}</p>
        <div className="border-burgundy/10 text-burgundy/90 mt-2 border-t pt-2 font-mono text-[11px]">
          <div>
            <strong>SKU:</strong> {payload.sku}
          </div>
          <div>
            <strong>Ukuran:</strong> {payload.sizeLabel || payload.variantName}
          </div>
          <div>
            <strong>Jumlah:</strong> {payload.quantity} unit
          </div>
          {payload.bundleSignature ? (
            <div>
              <strong>Signature:</strong> {payload.bundleSignature}
            </div>
          ) : null}
          <div>
            <strong>Subtotal:</strong> {formatIdr(payload.estimatedSubtotalIdr)}
          </div>
          {payload.bundleBreakdown && payload.bundleBreakdown.length > 0 ? (
            <div className="mt-2 space-y-1 font-sans">
              <strong className="text-burgundy block font-semibold">
                Komposisi 12 Potong:
              </strong>
              <ul className="text-burgundy/90 list-inside list-disc space-y-0.5 text-[11px]">
                {payload.bundleBreakdown.map((item, idx) => (
                  <li key={idx}>
                    {item.slotOrGroup}: {item.label} ({item.quantity} potong)
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-3">
            <ActionLink
              href={withBranch(ROUTES.CART, payload.branchCode)}
              variant="secondary"
              prefetch={false}
              className="w-full text-center text-xs"
            >
              {CART_COPY.VIEW_CART}
            </ActionLink>
          </div>
        </div>
      </div>
    </Feedback>
  );
}
