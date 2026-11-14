import { CART_COPY } from '@/constants/cart.constant';
import { CHECKOUT_COPY } from '@/constants/checkout.constant';
import { cn, formatIdr } from '@/utils';

interface OrderTotalsSummaryProps {
  subtotalIdr: number;
  discountIdr: number;
  estimatedTotalIdr: number;
  showZeroDiscount?: boolean;
  showShippingPending?: boolean;
  className?: string;
}

export function OrderTotalsSummary({
  subtotalIdr,
  discountIdr,
  estimatedTotalIdr,
  showZeroDiscount = false,
  showShippingPending = false,
  className,
}: OrderTotalsSummaryProps) {
  return (
    <dl className={cn('cart-summary-rows', className)}>
      <div className="cart-summary-row">
        <dt>{CART_COPY.SUBTOTAL}</dt>
        <dd className="text-cocoa font-medium">{formatIdr(subtotalIdr)}</dd>
      </div>

      {discountIdr > 0 || showZeroDiscount ? (
        <div
          className={cn(
            'cart-summary-row',
            !showZeroDiscount && 'text-burgundy',
          )}
        >
          <dt>{CART_COPY.DISCOUNT}</dt>
          <dd className={showZeroDiscount ? 'font-medium' : 'font-semibold'}>
            {discountIdr > 0 ? `-${formatIdr(discountIdr)}` : formatIdr(0)}
          </dd>
        </div>
      ) : null}

      {showShippingPending ? (
        <div className="cart-summary-row">
          <dt>Ongkos Kirim</dt>
          <dd className="text-xs italic">
            {CHECKOUT_COPY.SHIPPING_PENDING_LABEL}
          </dd>
        </div>
      ) : null}

      <div className="cart-summary-row cart-summary-total">
        <dt>{CART_COPY.TOTAL_ESTIMATE}</dt>
        <dd>{formatIdr(estimatedTotalIdr)}</dd>
      </div>
    </dl>
  );
}
