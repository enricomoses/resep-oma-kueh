'use client';

import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import type { RefObject } from 'react';

import { OrderTotalsSummary } from '@/components/common/commerce/order-totals-summary';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  return (
    <Card
      tone="cream"
      className={cn('checkout-review-card mt-6', className)}
      aria-labelledby="checkout-quote-review-heading"
    >
      <div className="checkout-card-header">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge
            tone={
              hasPriceChangedWarning
                ? 'danger'
                : handoffState !== 'idle'
                  ? 'success'
                  : 'accent'
            }
          >
            {hasPriceChangedWarning
              ? 'Harga Diperbarui Server'
              : handoffState !== 'idle'
                ? 'Siap Lanjut ke WhatsApp'
                : 'Estimasi Resmi Server'}
          </Badge>
          <span className="text-cocoa text-xs">
            Cabang: <strong>{quote.branch.name}</strong> (+
            {quote.branch.whatsappNumber})
          </span>
        </div>
        <h2
          id="checkout-quote-review-heading"
          className="checkout-section-title mt-2"
        >
          {CHECKOUT_COPY.QUOTE_REVIEW_TITLE}
        </h2>
        <p className="checkout-section-desc">
          {CHECKOUT_COPY.QUOTE_REVIEW_SUBTITLE}
        </p>
      </div>

      <div className="space-y-3">
        {quote.warnings.map((warning) => (
          <Feedback
            key={warning.code}
            tone={
              warning.code === CHECKOUT_WARNING_CODES.PRICE_CHANGED
                ? 'error'
                : 'info'
            }
            title={
              warning.code === CHECKOUT_WARNING_CODES.PRICE_CHANGED
                ? 'Perubahan Harga Terdeteksi'
                : 'Informasi Konfirmasi Pesanan'
            }
            announce={warning.code === CHECKOUT_WARNING_CODES.PRICE_CHANGED}
          >
            <p className="text-xs">{warning.message}</p>
          </Feedback>
        ))}
      </div>

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

      {shippingBanner ? (
        <Feedback tone="info" title={shippingBanner.title} className="mt-3">
          <p className="text-xs">{shippingBanner.body}</p>
        </Feedback>
      ) : null}

      <div className="checkout-fulfillment-preview">
        <p className="text-xs">
          <strong>Pemesan:</strong> {customerName} · <strong>Metode:</strong>{' '}
          {method === 'delivery'
            ? CHECKOUT_COPY.METHOD_DELIVERY_LABEL
            : CHECKOUT_COPY.METHOD_PICKUP_LABEL}{' '}
          · <strong>Tanggal:</strong> {formatJakartaDateLong(requestedDate)}
        </p>
      </div>

      <div className="checkout-message-preview-block">
        <label htmlFor="checkout-whatsapp-preview" className="ui-field-label">
          {CHECKOUT_COPY.QUOTE_PREVIEW_MESSAGE_LABEL}
        </label>
        <Textarea
          id="checkout-whatsapp-preview"
          ref={previewTextareaRef}
          readOnly
          rows={8}
          value={quote.messagePreview}
          onClick={(e) => e.currentTarget.select()}
          className="checkout-preview-textarea"
        />
      </div>

      {copyStatus === 'copied' ? (
        <Feedback tone="info" title={CHECKOUT_COPY.CTA_COPIED_MESSAGE} announce>
          <p className="text-xs">{CHECKOUT_COPY.COPY_SUCCESS_NOTE}</p>
        </Feedback>
      ) : copyStatus === 'fallback' ? (
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
      ) : handoffState === 'popup_blocked' || handoffState === 'ready' ? (
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

      <div className="checkout-review-actions">
        <Button
          type="button"
          variant="primary"
          loading={isBusy}
          loadingLabel={CHECKOUT_COPY.CTA_PROCEEDING_WHATSAPP}
          disabled={isBusy || hasBlockingConflicts}
          onClick={onProceedToWhatsApp}
        >
          <MessageCircle size={18} aria-hidden="true" />
          {CHECKOUT_COPY.CTA_PROCEED_WHATSAPP}
          <ExternalLink size={16} aria-hidden="true" />
        </Button>

        {handoffState !== 'idle' || quote.requiresCopy ? (
          <a
            href={quote.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onReopenWhatsApp}
            className="ui-button ui-button--secondary ui-button--md"
          >
            <ExternalLink size={16} aria-hidden="true" />
            {CHECKOUT_COPY.CTA_REOPEN_WHATSAPP}
          </a>
        ) : null}

        <Button type="button" variant="secondary" onClick={onCopyMessage}>
          {copyStatus === 'copied' ? (
            <>
              <Check size={16} aria-hidden="true" />
              {CHECKOUT_COPY.CTA_COPIED_MESSAGE}
            </>
          ) : (
            <>
              <Copy size={16} aria-hidden="true" />
              {CHECKOUT_COPY.CTA_COPY_MESSAGE}
            </>
          )}
        </Button>

        <ActionLink
          href={withBranch(ROUTES.CART, branchCode)}
          variant="ghost"
          prefetch={false}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {CHECKOUT_COPY.CTA_BACK_TO_CART}
        </ActionLink>
      </div>
    </Card>
  );
}
