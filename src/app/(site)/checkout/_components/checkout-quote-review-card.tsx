'use client';

import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Info,
  MessageCircle,
} from 'lucide-react';
import type { RefObject } from 'react';

import { OrderTotalsSummary } from '@/components/common/commerce/order-totals-summary';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Feedback } from '@/components/ui/feedback';
import { Textarea } from '@/components/ui/textarea';
import {
  CHECKOUT_COPY,
  CHECKOUT_WARNING_CODES,
} from '@/constants/checkout.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { CheckoutPrepareResponse } from '@/types/checkout';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';
import { formatJakartaDateLong } from '@/utils/checkout';

import { CheckoutQuoteLineRow } from './checkout-quote-line-row';

interface CheckoutQuoteReviewCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: CheckoutPrepareResponse;
  hasPriceChangedWarning: boolean;
  handoffState: 'idle' | 'ready' | 'popup_blocked' | 'requires_copy';
  copyStatus: 'idle' | 'copied' | 'fallback';
  shippingBanner: { title: string; body: string } | null;
  customerName: string;
  method: 'delivery' | 'pickup';
  requestedDate: string;
  branchCode: string | null | undefined;
  isBusy: boolean;
  hasBlockingConflicts: boolean;
  previewTextareaRef: RefObject<HTMLTextAreaElement | null>;
  onProceedToWhatsApp: () => void;
  onReopenWhatsApp: () => void;
  onCopyMessage: () => void;
  className?: string;
}

export function CheckoutQuoteReviewCard({
  open,
  onOpenChange,
  quote,
  hasPriceChangedWarning,
  handoffState,
  copyStatus,
  shippingBanner,
  customerName,
  method,
  requestedDate,
  branchCode,
  isBusy,
  hasBlockingConflicts,
  previewTextareaRef,
  onProceedToWhatsApp,
  onReopenWhatsApp,
  onCopyMessage,
  className,
}: CheckoutQuoteReviewCardProps) {
  const priceWarnings = quote.warnings.filter(
    (w) => w.code === CHECKOUT_WARNING_CODES.PRICE_CHANGED,
  );
  const infoWarnings = quote.warnings.filter(
    (w) => w.code !== CHECKOUT_WARNING_CODES.PRICE_CHANGED,
  );

  const footerContent = (
    <div className="checkout-review-footer">
      <p className="checkout-review-cta-hint">
        {CHECKOUT_COPY.QUOTE_WHATSAPP_HINT}
      </p>

      <Button
        type="button"
        variant="primary"
        size="lg"
        loading={isBusy}
        loadingLabel={CHECKOUT_COPY.CTA_PROCEEDING_WHATSAPP}
        disabled={isBusy || hasBlockingConflicts}
        onClick={onProceedToWhatsApp}
        className="checkout-whatsapp-cta"
      >
        <MessageCircle size={20} aria-hidden="true" />
        <span>{CHECKOUT_COPY.CTA_PROCEED_WHATSAPP}</span>
        <ExternalLink size={16} aria-hidden="true" />
      </Button>

      <div className="checkout-review-secondary-actions">
        <div className="checkout-review-utility-group">
          {handoffState !== 'idle' || quote.requiresCopy ? (
            <a
              href={quote.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onReopenWhatsApp}
              className="ui-button ui-button--secondary ui-button--sm"
            >
              <ExternalLink size={15} aria-hidden="true" />
              {CHECKOUT_COPY.CTA_REOPEN_WHATSAPP}
            </a>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCopyMessage}
          >
            {copyStatus === 'copied' ? (
              <>
                <Check size={15} aria-hidden="true" />
                {CHECKOUT_COPY.CTA_COPIED_MESSAGE}
              </>
            ) : (
              <>
                <Copy size={15} aria-hidden="true" />
                {CHECKOUT_COPY.CTA_COPY_MESSAGE}
              </>
            )}
          </Button>
        </div>

        <ActionLink
          href={withBranch(ROUTES.CART, branchCode)}
          variant="ghost"
          size="sm"
          prefetch={false}
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {CHECKOUT_COPY.CTA_BACK_TO_CART}
        </ActionLink>
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={CHECKOUT_COPY.QUOTE_REVIEW_TITLE}
      description={CHECKOUT_COPY.QUOTE_REVIEW_SUBTITLE}
      footer={footerContent}
      className={cn('checkout-review-dialog', className)}
    >
      <div className="checkout-review-modal-body">
        <div className="checkout-review-meta-row">
          {hasPriceChangedWarning || handoffState !== 'idle' ? (
            <Badge tone={hasPriceChangedWarning ? 'danger' : 'success'}>
              {hasPriceChangedWarning
                ? 'Harga Diperbarui Server'
                : 'Siap Lanjut ke WhatsApp'}
            </Badge>
          ) : null}
          <span className="text-cocoa text-xs">
            Cabang: <strong>{quote.branch.name}</strong>
          </span>
        </div>

        {priceWarnings.length > 0 ? (
          <div className="space-y-3">
            {priceWarnings.map((warning) => (
              <Feedback
                key={warning.code}
                tone="error"
                title="Perubahan Harga Terdeteksi"
                announce
              >
                <p className="text-xs">{warning.message}</p>
              </Feedback>
            ))}
          </div>
        ) : null}

        <dl className="checkout-fulfillment-summary">
          <div className="checkout-fulfillment-item">
            <dt>Pemesan</dt>
            <dd>{customerName}</dd>
          </div>
          <div className="checkout-fulfillment-item">
            <dt>Metode</dt>
            <dd>
              {method === 'delivery'
                ? CHECKOUT_COPY.METHOD_DELIVERY_LABEL
                : CHECKOUT_COPY.METHOD_PICKUP_LABEL}
            </dd>
          </div>
          <div className="checkout-fulfillment-item">
            <dt>Tanggal</dt>
            <dd>{formatJakartaDateLong(requestedDate)}</dd>
          </div>
        </dl>

        <div className="checkout-quote-lines">
          {quote.lines.map((line) => (
            <CheckoutQuoteLineRow
              key={`${line.variantId}-${line.options.map((o) => o.choiceId).join(',')}`}
              line={line}
            />
          ))}
        </div>

        <OrderTotalsSummary
          subtotalIdr={quote.subtotalIdr}
          discountIdr={quote.discountIdr}
          estimatedTotalIdr={quote.estimatedTotalIdr}
          showZeroDiscount
          showShippingPending
          className="border-t border-[var(--border-sand)] pt-4"
        />

        {infoWarnings.length > 0 || shippingBanner ? (
          <div className="checkout-review-notes">
            {infoWarnings.map((warning) => (
              <div key={warning.code} className="checkout-review-note">
                <Info
                  size={15}
                  aria-hidden="true"
                  className="checkout-review-note-icon"
                />
                <p>{warning.message}</p>
              </div>
            ))}
            {shippingBanner ? (
              <div className="checkout-review-note">
                <Info
                  size={15}
                  aria-hidden="true"
                  className="checkout-review-note-icon"
                />
                <p>
                  <strong>{shippingBanner.title}:</strong> {shippingBanner.body}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="checkout-message-preview-block">
          <label htmlFor="checkout-whatsapp-preview" className="ui-field-label">
            {CHECKOUT_COPY.QUOTE_PREVIEW_MESSAGE_LABEL}
          </label>
          <Textarea
            id="checkout-whatsapp-preview"
            ref={previewTextareaRef}
            readOnly
            rows={5}
            value={quote.messagePreview}
            onClick={(e) => e.currentTarget.select()}
            className="checkout-preview-textarea"
          />
        </div>

        {copyStatus === 'fallback' ? (
          <Feedback tone="info" title="Salin Teks Secara Manual" announce>
            <p className="text-xs">{CHECKOUT_COPY.COPY_FALLBACK_NOTE}</p>
          </Feedback>
        ) : null}

        {quote.requiresCopy || handoffState === 'requires_copy' ? (
          <Feedback
            tone="info"
            title={CHECKOUT_COPY.HANDOFF_LONG_URL_TITLE}
            announce
          >
            <p className="text-xs">{CHECKOUT_COPY.HANDOFF_LONG_URL_DESC}</p>
          </Feedback>
        ) : handoffState === 'popup_blocked' ? (
          <Feedback
            tone="info"
            title={CHECKOUT_COPY.HANDOFF_READY_TITLE}
            announce
          >
            <p className="text-xs">
              {CHECKOUT_COPY.HANDOFF_READY_DESC}{' '}
              {CHECKOUT_COPY.HANDOFF_POPUP_BLOCKED_NOTE}
            </p>
          </Feedback>
        ) : null}
      </div>
    </Dialog>
  );
}
