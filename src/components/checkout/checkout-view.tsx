'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  ShoppingBag,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CART_COPY } from '@/constants/cart.constant';
import {
  CHECKOUT_COPY,
  CHECKOUT_LIMITS,
  CHECKOUT_WARNING_CODES,
} from '@/constants/checkout.constant';
import { ROUTES } from '@/constants/routes.constant';
import { useBranches } from '@/hooks/use-branches';
import { useCart } from '@/hooks/use-cart';
import { useCheckoutPrepare } from '@/hooks/use-checkout';
import { ApiClientError } from '@/lib/errors';
import type {
  CheckoutFormValues,
  CheckoutPrepareResponse,
} from '@/types/checkout';
import { cn, formatIdr } from '@/utils';
import { withBranch } from '@/utils/branch-url';
import {
  formatJakartaDateIso,
  formatJakartaDateLong,
  formatWhatsappDigits,
} from '@/utils/checkout';
import { checkoutFormSchema } from '@/validations/checkout.schema';

interface CheckoutViewProps {
  className?: string;
}

export function CheckoutView({ className }: CheckoutViewProps) {
  const {
    hasHydrated,
    lines,
    totalQuantity,
    isValidating,
    isValidationError,
    validatedLines,
    estimatedSubtotalIdr,
    totalDiscountIdr,
    estimatedTotalIdr,
    hasBlockingConflicts,
    refetchValidation,
  } = useCart();

  const { selected: selectedBranch, code: branchCode } = useBranches();
  const prepareMutation = useCheckoutPrepare();

  const allowPickup = selectedBranch?.allowPickup !== false;
  const allowDelivery = selectedBranch?.allowDelivery !== false;
  const isFulfillmentDisabled =
    Boolean(selectedBranch) && !allowPickup && !allowDelivery;

  const [{ todayIso, maxDateIso }] = useState(() => {
    const now = new Date();
    const maxDate = new Date(
      now.getTime() + CHECKOUT_LIMITS.MAX_DAYS_IN_ADVANCE * 24 * 60 * 60 * 1000,
    );
    return {
      todayIso: formatJakartaDateIso(now),
      maxDateIso: formatJakartaDateIso(maxDate),
    };
  });

  const defaultMethod = allowDelivery ? 'delivery' : 'pickup';

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: '',
      method: defaultMethod,
      requestedDate: todayIso,
      requestedTimeWindow: '',
      address: '',
      note: '',
      acknowledgedManualConfirmation: false,
    },
    mode: 'onSubmit',
  });

  const watchedValues = useWatch({ control });
  const selectedMethod = watchedValues.method ?? defaultMethod;

  // Keep method aligned if branch restricts one of the methods
  useEffect(() => {
    if (!allowDelivery && allowPickup && selectedMethod === 'delivery') {
      setValue('method', 'pickup');
    } else if (!allowPickup && allowDelivery && selectedMethod === 'pickup') {
      setValue('method', 'delivery');
    }
  }, [allowDelivery, allowPickup, selectedMethod, setValue]);

  const [reviewedQuote, setReviewedQuote] =
    useState<CheckoutPrepareResponse | null>(null);
  const [handoffState, setHandoffState] = useState<
    'idle' | 'ready' | 'popup_blocked' | 'requires_copy'
  >('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'fallback'>(
    'idle',
  );
  const [serverError, setServerError] = useState<{
    title: string;
    message: string;
    fieldList: string[];
  } | null>(null);

  const inFlightRef = useRef(false);
  const previewTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Build stable signature of cart + branch + form inputs so any edit resets quote acceptance
  const cartSignature = useMemo(
    () =>
      lines
        .map(
          (l) =>
            `${l.variantId}:${l.quantity}:${l.choiceIds.slice().sort().join(',')}`,
        )
        .sort()
        .join('|'),
    [lines],
  );

  const inputSignature = useMemo(
    () =>
      JSON.stringify({
        branchId: selectedBranch?.id ?? null,
        cartSignature,
        customerName: watchedValues.customerName ?? '',
        method: watchedValues.method ?? '',
        requestedDate: watchedValues.requestedDate ?? '',
        requestedTimeWindow: watchedValues.requestedTimeWindow ?? '',
        address: watchedValues.address ?? '',
        note: watchedValues.note ?? '',
        acknowledgedManualConfirmation: Boolean(
          watchedValues.acknowledgedManualConfirmation,
        ),
      }),
    [
      selectedBranch?.id,
      cartSignature,
      watchedValues.customerName,
      watchedValues.method,
      watchedValues.requestedDate,
      watchedValues.requestedTimeWindow,
      watchedValues.address,
      watchedValues.note,
      watchedValues.acknowledgedManualConfirmation,
    ],
  );

  const acceptedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      acceptedSignatureRef.current !== null &&
      acceptedSignatureRef.current !== inputSignature
    ) {
      setReviewedQuote(null);
      setHandoffState('idle');
      setCopyStatus('idle');
      acceptedSignatureRef.current = null;
    }
  }, [inputSignature]);

  const applyApiError = (error: unknown) => {
    if (error instanceof ApiClientError) {
      const fieldList: string[] = [];
      if (error.fieldErrors) {
        for (const [pathKey, messages] of Object.entries(error.fieldErrors)) {
          const firstMsg = messages[0];
          if (firstMsg) {
            fieldList.push(firstMsg);
          }
          if (pathKey === 'customerName') {
            setError('customerName', { type: 'server', message: firstMsg });
          } else if (pathKey === 'fulfillment.address') {
            setError('address', { type: 'server', message: firstMsg });
          } else if (pathKey === 'fulfillment.requestedDate') {
            setError('requestedDate', { type: 'server', message: firstMsg });
          } else if (pathKey === 'fulfillment.method') {
            setError('method', { type: 'server', message: firstMsg });
          } else if (pathKey === 'acknowledgedManualConfirmation') {
            setError('acknowledgedManualConfirmation', {
              type: 'server',
              message: firstMsg,
            });
          }
        }
      }

      if (
        error.code === 'STOCK_CHANGED' ||
        error.code === 'ITEM_UNAVAILABLE' ||
        error.status === 409
      ) {
        void refetchValidation();
      }

      setServerError({
        title:
          error.status === 409
            ? 'Stok atau Ketersediaan Produk Berubah'
            : error.status === 422
              ? CHECKOUT_COPY.ERROR_FORM_SUMMARY_TITLE
              : 'Gagal Memproses Checkout',
        message: error.message,
        fieldList,
      });
      return;
    }

    setServerError({
      title: 'Gagal Memproses Checkout',
      message: CHECKOUT_COPY.ERROR_UPSTREAM,
      fieldList: [],
    });
  };

  // Step 1: Prepare initial server quote (expectedQuoteFingerprint: null)
  const onPrepareQuote = async (values: CheckoutFormValues) => {
    if (!selectedBranch || lines.length === 0 || inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setServerError(null);
    setCopyStatus('idle');

    try {
      const response = await prepareMutation.mutateAsync({
        branchId: selectedBranch.id,
        items: lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
          choiceIds: line.choiceIds,
        })),
        fulfillment: {
          method: values.method,
          requestedDate: values.requestedDate,
          requestedTimeWindow: values.requestedTimeWindow?.trim() || null,
          address:
            values.method === 'delivery'
              ? values.address?.trim() || null
              : null,
          note: values.note?.trim() || null,
        },
        customerName: values.customerName.trim(),
        acknowledgedManualConfirmation: true,
        expectedQuoteFingerprint: null,
      });

      acceptedSignatureRef.current = inputSignature;
      setReviewedQuote(response.data);
      setHandoffState('idle');
    } catch (error: unknown) {
      applyApiError(error);
    } finally {
      inFlightRef.current = false;
    }
  };

  // Step 2: Re-verify fingerprint and open WhatsApp only if requiresReview === false
  const handleProceedToWhatsApp = async () => {
    if (
      !selectedBranch ||
      !reviewedQuote ||
      lines.length === 0 ||
      inFlightRef.current
    ) {
      return;
    }

    const valid = checkoutFormSchema.safeParse({
      customerName: watchedValues.customerName ?? '',
      method: watchedValues.method ?? defaultMethod,
      requestedDate: watchedValues.requestedDate ?? todayIso,
      requestedTimeWindow: watchedValues.requestedTimeWindow ?? '',
      address: watchedValues.address ?? '',
      note: watchedValues.note ?? '',
      acknowledgedManualConfirmation: Boolean(
        watchedValues.acknowledgedManualConfirmation,
      ),
    });

    if (!valid.success) {
      setReviewedQuote(null);
      return;
    }

    inFlightRef.current = true;
    setServerError(null);
    setCopyStatus('idle');

    try {
      const response = await prepareMutation.mutateAsync({
        branchId: selectedBranch.id,
        items: lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
          choiceIds: line.choiceIds,
        })),
        fulfillment: {
          method: valid.data.method,
          requestedDate: valid.data.requestedDate,
          requestedTimeWindow: valid.data.requestedTimeWindow?.trim() || null,
          address:
            valid.data.method === 'delivery'
              ? valid.data.address?.trim() || null
              : null,
          note: valid.data.note?.trim() || null,
        },
        customerName: valid.data.customerName.trim(),
        acknowledgedManualConfirmation: true,
        expectedQuoteFingerprint: reviewedQuote.quoteFingerprint,
      });

      const latestQuote = response.data;
      acceptedSignatureRef.current = inputSignature;
      setReviewedQuote(latestQuote);

      // Only requiresReview === false opens the trusted server WhatsApp URL
      if (latestQuote.requiresReview) {
        setHandoffState('idle');
        return;
      }

      if (latestQuote.requiresCopy) {
        setHandoffState('requires_copy');
        return;
      }

      const openedWindow =
        typeof window !== 'undefined'
          ? window.open(
              latestQuote.whatsappUrl,
              '_blank',
              'noopener,noreferrer',
            )
          : null;

      if (!openedWindow) {
        setHandoffState('popup_blocked');
      } else {
        setHandoffState('ready');
      }
    } catch (error: unknown) {
      applyApiError(error);
    } finally {
      inFlightRef.current = false;
    }
  };

  const handleCopyMessage = async () => {
    if (!reviewedQuote) return;
    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== 'function'
      ) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(reviewedQuote.messagePreview);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('fallback');
      if (previewTextareaRef.current) {
        previewTextareaRef.current.focus();
        previewTextareaRef.current.select();
      }
    }
  };

  const handleReopenWhatsApp = () => {
    if (!reviewedQuote) return;
    if (typeof window !== 'undefined') {
      window.open(reviewedQuote.whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const clientErrorMessages = Object.values(errors)
    .map((err) => err?.message)
    .filter((msg): msg is string => Boolean(msg));

  const isBusy = prepareMutation.isPending || isSubmitting;

  // 1. Loading / Hydration State
  if (
    !hasHydrated ||
    (isValidating && lines.length > 0 && validatedLines.length === 0)
  ) {
    return (
      <main id="konten" className={cn('checkout-page', className)}>
        <div className="checkout-container">
          <div className="cart-loading-state" role="status" aria-live="polite">
            <div className="cart-spinner" aria-hidden="true" />
            <p className="cart-loading-text">{CART_COPY.LOADING_RESTORE}</p>
          </div>
        </div>
      </main>
    );
  }

  // 2. Empty Cart State
  if (lines.length === 0) {
    return (
      <main id="konten" className={cn('checkout-page', className)}>
        <div className="checkout-container">
          <Card className="cart-empty-state">
            <div className="cart-empty-icon-wrap" aria-hidden="true">
              <ShoppingBag size={48} className="text-burgundy/60" />
            </div>
            <h1 className="cart-empty-title">{CART_COPY.EMPTY_TITLE}</h1>
            <p className="cart-empty-body">{CART_COPY.EMPTY_BODY}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ActionLink
                href={withBranch(ROUTES.MENU, branchCode)}
                variant="primary"
                prefetch={false}
              >
                {CART_COPY.CTA_BROWSE_MENU}
                <ArrowRight size={18} aria-hidden="true" />
              </ActionLink>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  // 3. Initial Validation Error State (Offline or Upstream Outage, cart preserved)
  if (isValidationError && validatedLines.length === 0) {
    return (
      <main id="konten" className={cn('checkout-page', className)}>
        <div className="checkout-container">
          <Feedback
            tone="error"
            title="Gagal Memuat Ringkasan Keranjang"
            announce
            className="my-8"
          >
            <p className="mb-4 text-sm">{CART_COPY.ERROR_REVALIDATE}</p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => void refetchValidation()}
              >
                <RotateCcw size={16} aria-hidden="true" />
                {CART_COPY.RETRY}
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
          </Feedback>
        </div>
      </main>
    );
  }

  const consultationWhatsappHref = selectedBranch
    ? `https://wa.me/${formatWhatsappDigits(selectedBranch.whatsappNumber)}?text=${encodeURIComponent(
        `Halo Admin Resep Oma Kueh ${selectedBranch.name}, saya ingin berkonsultasi mengenai pemesanan produk Resep Oma.`,
      )}`
    : null;

  const hasPriceChangedWarning = Boolean(
    reviewedQuote?.warnings.some(
      (w) => w.code === CHECKOUT_WARNING_CODES.PRICE_CHANGED,
    ),
  );

  return (
    <main id="konten" className={cn('checkout-page', className)}>
      <div className="checkout-container">
        {/* Page Header */}
        <div className="checkout-header">
          <div className="mb-3">
            <ActionLink
              href={withBranch(ROUTES.CART, branchCode)}
              variant="ghost"
              size="sm"
              prefetch={false}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {CHECKOUT_COPY.CTA_BACK_TO_CART}
            </ActionLink>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h1 className="cart-title">{CHECKOUT_COPY.PAGE_TITLE}</h1>
              <p className="cart-subtitle">{CHECKOUT_COPY.PAGE_DESCRIPTION}</p>
            </div>
            {selectedBranch ? (
              <div className="cart-branch-pill">
                <Store size={16} aria-hidden="true" />
                <span>
                  {CART_COPY.BRANCH_LABEL}:{' '}
                  <strong>{selectedBranch.name}</strong>
                </span>
              </div>
            ) : null}
          </div>

          {!selectedBranch ? (
            <div className="cart-alert-no-branch mt-4" role="alert">
              <AlertTriangle
                size={18}
                className="shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <p className="text-xs font-medium text-amber-900">
                {CART_COPY.NO_BRANCH_WARNING}
              </p>
            </div>
          ) : null}
        </div>

        {/* Fulfillment Disabled Consultation View (No disguised order) */}
        {isFulfillmentDisabled && selectedBranch ? (
          <Card tone="cream" className="checkout-consultation-card">
            <Badge tone="accent">Konsultasi Cabang</Badge>
            <h2 className="checkout-section-title">
              {CHECKOUT_COPY.FULFILLMENT_DISABLED_TITLE}
            </h2>
            <p className="checkout-section-desc">
              {CHECKOUT_COPY.FULFILLMENT_DISABLED_BODY}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {consultationWhatsappHref ? (
                <a
                  href={consultationWhatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-button ui-button--primary ui-button--md"
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  {CHECKOUT_COPY.CTA_CONSULT_WHATSAPP} ({selectedBranch.name})
                </a>
              ) : null}
              <ActionLink
                href={withBranch(ROUTES.CART, branchCode)}
                variant="secondary"
                prefetch={false}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                {CHECKOUT_COPY.CTA_BACK_TO_CART}
              </ActionLink>
            </div>
          </Card>
        ) : (
          <div className="checkout-main-grid">
            {/* Left Column: Customer Form & Authoritative Quote Review */}
            <div className="checkout-primary-col">
              {/* Top-Level Error Summary */}
              {clientErrorMessages.length > 0 || serverError ? (
                <Feedback
                  tone="error"
                  title={
                    serverError?.title ?? CHECKOUT_COPY.ERROR_FORM_SUMMARY_TITLE
                  }
                  announce
                  className="mb-6"
                >
                  {serverError ? (
                    <p className="mt-1 text-sm">{serverError.message}</p>
                  ) : null}
                  {clientErrorMessages.length > 0 ||
                  (serverError && serverError.fieldList.length > 0) ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                      {clientErrorMessages.map((msg, idx) => (
                        <li key={`client-err-${idx}`}>{msg}</li>
                      ))}
                      {serverError?.fieldList.map((msg, idx) => (
                        <li key={`server-err-${idx}`}>{msg}</li>
                      ))}
                    </ul>
                  ) : null}
                </Feedback>
              ) : null}

              {/* Blocking Cart Conflicts Notice */}
              {hasBlockingConflicts ? (
                <Feedback
                  tone="error"
                  title={CART_COPY.CTA_CHECKOUT_DISABLED_CONFLICTS}
                  announce
                  className="mb-6"
                >
                  <p className="mt-1 text-sm">
                    Terdapat produk di keranjang yang sedang habis atau tidak
                    tersedia di cabang terpilih. Silakan kembali ke keranjang
                    untuk menyesuaikan item pesanan Anda.
                  </p>
                  <div className="mt-3">
                    <ActionLink
                      href={withBranch(ROUTES.CART, branchCode)}
                      variant="secondary"
                      size="sm"
                      prefetch={false}
                    >
                      <ArrowLeft size={16} aria-hidden="true" />
                      {CHECKOUT_COPY.CTA_BACK_TO_CART}
                    </ActionLink>
                  </div>
                </Feedback>
              ) : null}

              {/* Form Card */}
              <Card className="checkout-form-card">
                <div className="checkout-card-header">
                  <h2 className="checkout-section-title">
                    {CHECKOUT_COPY.FORM_SECTION_TITLE}
                  </h2>
                  <p className="checkout-section-desc">
                    {CHECKOUT_COPY.FORM_SECTION_DESC}
                  </p>
                </div>

                <form
                  onSubmit={(event) => {
                    void handleSubmit(onPrepareQuote)(event);
                  }}
                  noValidate
                  className="checkout-form"
                >
                  <FormField
                    id="checkout-customer-name"
                    label={CHECKOUT_COPY.FIELD_CUSTOMER_NAME_LABEL}
                    helper={CHECKOUT_COPY.FIELD_CUSTOMER_NAME_HELPER}
                    error={errors.customerName?.message}
                    required
                  >
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        {...register('customerName')}
                        type="text"
                        autoComplete="off"
                        maxLength={CHECKOUT_LIMITS.MAX_CUSTOMER_NAME_LENGTH}
                        placeholder={
                          CHECKOUT_COPY.FIELD_CUSTOMER_NAME_PLACEHOLDER
                        }
                      />
                    )}
                  </FormField>

                  <div className="checkout-form-row-2">
                    <FormField
                      id="checkout-method"
                      label={CHECKOUT_COPY.FIELD_METHOD_LABEL}
                      error={errors.method?.message}
                      required
                    >
                      {(fieldProps) => (
                        <Select {...fieldProps} {...register('method')}>
                          {allowDelivery ? (
                            <option value="delivery">
                              {CHECKOUT_COPY.METHOD_DELIVERY_LABEL}
                            </option>
                          ) : null}
                          {allowPickup ? (
                            <option value="pickup">
                              {CHECKOUT_COPY.METHOD_PICKUP_LABEL}
                            </option>
                          ) : null}
                        </Select>
                      )}
                    </FormField>

                    <FormField
                      id="checkout-requested-date"
                      label={CHECKOUT_COPY.FIELD_DATE_LABEL}
                      helper={CHECKOUT_COPY.FIELD_DATE_HELPER}
                      error={errors.requestedDate?.message}
                      required
                    >
                      {(fieldProps) => (
                        <Input
                          {...fieldProps}
                          {...register('requestedDate')}
                          type="date"
                          min={todayIso}
                          max={maxDateIso}
                        />
                      )}
                    </FormField>
                  </div>

                  <FormField
                    id="checkout-time-window"
                    label={CHECKOUT_COPY.FIELD_TIME_WINDOW_LABEL}
                    error={errors.requestedTimeWindow?.message}
                  >
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        {...register('requestedTimeWindow')}
                        type="text"
                        autoComplete="off"
                        maxLength={CHECKOUT_LIMITS.MAX_TIME_WINDOW_LENGTH}
                        placeholder={
                          CHECKOUT_COPY.FIELD_TIME_WINDOW_PLACEHOLDER
                        }
                      />
                    )}
                  </FormField>

                  {selectedMethod === 'delivery' ? (
                    <FormField
                      id="checkout-address"
                      label={CHECKOUT_COPY.FIELD_ADDRESS_LABEL}
                      helper={CHECKOUT_COPY.FIELD_ADDRESS_HELPER}
                      error={errors.address?.message}
                      required
                    >
                      {(fieldProps) => (
                        <Textarea
                          {...fieldProps}
                          {...register('address')}
                          rows={3}
                          maxLength={CHECKOUT_LIMITS.MAX_ADDRESS_LENGTH}
                          placeholder={CHECKOUT_COPY.FIELD_ADDRESS_PLACEHOLDER}
                        />
                      )}
                    </FormField>
                  ) : null}

                  <FormField
                    id="checkout-note"
                    label={CHECKOUT_COPY.FIELD_NOTE_LABEL}
                    error={errors.note?.message}
                  >
                    {(fieldProps) => (
                      <Textarea
                        {...fieldProps}
                        {...register('note')}
                        rows={2}
                        maxLength={CHECKOUT_LIMITS.MAX_NOTE_LENGTH}
                        placeholder={CHECKOUT_COPY.FIELD_NOTE_PLACEHOLDER}
                      />
                    )}
                  </FormField>

                  {/* Manual Confirmation Consent Checkbox */}
                  <div className="checkout-consent-box">
                    <label
                      htmlFor="checkout-consent"
                      className="checkout-consent-label"
                    >
                      <input
                        id="checkout-consent"
                        type="checkbox"
                        className="checkout-consent-checkbox"
                        aria-invalid={
                          errors.acknowledgedManualConfirmation
                            ? true
                            : undefined
                        }
                        aria-describedby={
                          errors.acknowledgedManualConfirmation
                            ? 'checkout-consent-error'
                            : 'checkout-consent-policy'
                        }
                        {...register('acknowledgedManualConfirmation')}
                      />
                      <span>{CHECKOUT_COPY.CONSENT_LABEL}</span>
                    </label>
                    <p
                      id="checkout-consent-policy"
                      className="checkout-consent-policy"
                    >
                      {CHECKOUT_COPY.CONSENT_POLICY_NOTE_PREFIX}
                      <Link
                        href={withBranch(ROUTES.PRIVACY, branchCode)}
                        className="ui-link"
                      >
                        {CHECKOUT_COPY.CONSENT_PRIVACY_LINK}
                      </Link>{' '}
                      dan{' '}
                      <Link
                        href={withBranch(ROUTES.ORDERING_POLICY, branchCode)}
                        className="ui-link"
                      >
                        {CHECKOUT_COPY.CONSENT_ORDERING_LINK}
                      </Link>
                      .
                    </p>
                    {errors.acknowledgedManualConfirmation ? (
                      <p
                        id="checkout-consent-error"
                        className="ui-field-error mt-1"
                        role="alert"
                      >
                        {errors.acknowledgedManualConfirmation.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="checkout-form-actions">
                    <Button
                      type="submit"
                      variant={reviewedQuote ? 'secondary' : 'primary'}
                      loading={isBusy && !reviewedQuote}
                      loadingLabel={CHECKOUT_COPY.CTA_PREPARING_QUOTE}
                      disabled={
                        isBusy || !selectedBranch || hasBlockingConflicts
                      }
                      className="w-full justify-center sm:w-auto"
                    >
                      {CHECKOUT_COPY.CTA_PREPARE_QUOTE}
                      <ArrowRight size={18} aria-hidden="true" />
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Step 2: Authoritative Server Quote Review & WhatsApp Handoff */}
              {reviewedQuote ? (
                <Card
                  tone="cream"
                  className="checkout-review-card mt-6"
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
                        Cabang: <strong>{reviewedQuote.branch.name}</strong> (+
                        {reviewedQuote.branch.whatsappNumber})
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

                  {/* Warnings from Server Quote */}
                  <div className="space-y-3">
                    {reviewedQuote.warnings.map((warning) => (
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
                        announce={
                          warning.code === CHECKOUT_WARNING_CODES.PRICE_CHANGED
                        }
                      >
                        <p className="text-xs">{warning.message}</p>
                      </Feedback>
                    ))}
                  </div>

                  {/* Authoritative Quoted Lines */}
                  <div className="checkout-quote-lines">
                    {reviewedQuote.lines.map((line) => (
                      <div
                        key={`${line.variantId}-${line.options.map((o) => o.choiceId).join(',')}`}
                        className="checkout-quote-line"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-burgundy font-serif font-bold">
                              {line.productName} —{' '}
                              {line.sizeLabel ?? line.variantName}
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

                        {line.bundleBreakdown &&
                        line.bundleBreakdown.length > 0 ? (
                          <ul className="text-cocoa mt-2 list-inside list-disc space-y-0.5 text-xs">
                            {line.bundleBreakdown.map((comp, idx) => (
                              <li key={idx}>
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
                    ))}
                  </div>

                  {/* Authoritative Totals */}
                  <dl className="cart-summary-rows border-t border-[var(--border-sand)] pt-4">
                    <div className="cart-summary-row">
                      <dt>{CART_COPY.SUBTOTAL}</dt>
                      <dd className="font-medium">
                        {formatIdr(reviewedQuote.subtotalIdr)}
                      </dd>
                    </div>
                    <div className="cart-summary-row">
                      <dt>{CART_COPY.DISCOUNT}</dt>
                      <dd className="font-medium">
                        {reviewedQuote.discountIdr > 0
                          ? `-${formatIdr(reviewedQuote.discountIdr)}`
                          : formatIdr(0)}
                      </dd>
                    </div>
                    <div className="cart-summary-row">
                      <dt>Ongkos Kirim</dt>
                      <dd className="text-xs italic">
                        {CHECKOUT_COPY.SHIPPING_PENDING_LABEL}
                      </dd>
                    </div>
                    <div className="cart-summary-row cart-summary-total">
                      <dt>{CART_COPY.TOTAL_ESTIMATE}</dt>
                      <dd>{formatIdr(reviewedQuote.estimatedTotalIdr)}</dd>
                    </div>
                  </dl>

                  {/* Fulfillment Summary */}
                  <div className="checkout-fulfillment-preview">
                    <p className="text-xs">
                      <strong>Pemesan:</strong> {watchedValues.customerName} ·{' '}
                      <strong>Metode:</strong>{' '}
                      {watchedValues.method === 'delivery'
                        ? CHECKOUT_COPY.METHOD_DELIVERY_LABEL
                        : CHECKOUT_COPY.METHOD_PICKUP_LABEL}{' '}
                      · <strong>Tanggal:</strong>{' '}
                      {formatJakartaDateLong(
                        watchedValues.requestedDate ?? todayIso,
                      )}
                    </p>
                  </div>

                  {/* Read-only Message Preview Textarea */}
                  <div className="checkout-message-preview-block">
                    <label
                      htmlFor="checkout-whatsapp-preview"
                      className="ui-field-label"
                    >
                      {CHECKOUT_COPY.QUOTE_PREVIEW_MESSAGE_LABEL}
                    </label>
                    <Textarea
                      id="checkout-whatsapp-preview"
                      ref={previewTextareaRef}
                      readOnly
                      rows={8}
                      value={reviewedQuote.messagePreview}
                      onClick={(e) => e.currentTarget.select()}
                      className="checkout-preview-textarea"
                    />
                  </div>

                  {/* Copy Feedback */}
                  {copyStatus === 'copied' ? (
                    <Feedback
                      tone="info"
                      title={CHECKOUT_COPY.CTA_COPIED_MESSAGE}
                      announce
                    >
                      <p className="text-xs">
                        {CHECKOUT_COPY.COPY_SUCCESS_NOTE}
                      </p>
                    </Feedback>
                  ) : copyStatus === 'fallback' ? (
                    <Feedback
                      tone="info"
                      title="Salin Teks Secara Manual"
                      announce
                    >
                      <p className="text-xs">
                        {CHECKOUT_COPY.COPY_FALLBACK_NOTE}
                      </p>
                    </Feedback>
                  ) : null}

                  {/* Long URL Instructions or Handoff Ready Fallback */}
                  {reviewedQuote.requiresCopy ||
                  handoffState === 'requires_copy' ? (
                    <Feedback
                      tone="info"
                      title={CHECKOUT_COPY.HANDOFF_LONG_URL_TITLE}
                      announce
                    >
                      <p className="text-xs">
                        {CHECKOUT_COPY.HANDOFF_LONG_URL_DESC}
                      </p>
                    </Feedback>
                  ) : handoffState === 'popup_blocked' ||
                    handoffState === 'ready' ? (
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

                  {/* Action Buttons */}
                  <div className="checkout-review-actions">
                    <Button
                      type="button"
                      variant="primary"
                      loading={isBusy}
                      loadingLabel={CHECKOUT_COPY.CTA_PROCEEDING_WHATSAPP}
                      disabled={isBusy || hasBlockingConflicts}
                      onClick={() => void handleProceedToWhatsApp()}
                    >
                      <MessageCircle size={18} aria-hidden="true" />
                      {CHECKOUT_COPY.CTA_PROCEED_WHATSAPP}
                      <ExternalLink size={16} aria-hidden="true" />
                    </Button>

                    {handoffState !== 'idle' || reviewedQuote.requiresCopy ? (
                      <a
                        href={reviewedQuote.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleReopenWhatsApp}
                        className="ui-button ui-button--secondary ui-button--md"
                      >
                        <ExternalLink size={16} aria-hidden="true" />
                        {CHECKOUT_COPY.CTA_REOPEN_WHATSAPP}
                      </a>
                    ) : null}

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void handleCopyMessage()}
                    >
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
              ) : null}
            </div>

            {/* Right Column: Live Cart Summary Sidebar */}
            <aside
              className="cart-summary-section"
              aria-label="Ringkasan Keranjang"
            >
              <Card className="cart-summary-card">
                <h2 className="cart-summary-title">
                  {CART_COPY.SUMMARY_TITLE} ({totalQuantity} item)
                </h2>

                <div className="checkout-sidebar-items">
                  {validatedLines.map((line) => (
                    <div key={line.lineId} className="checkout-sidebar-item">
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-burgundy font-medium">
                          {line.productName} (
                          {line.sizeLabel || line.variantName})
                        </span>
                        <span className="font-semibold">
                          {formatIdr(line.subtotalIdr)}
                        </span>
                      </div>
                      <p className="text-cocoa text-xs">
                        {line.quantity} ×{' '}
                        {formatIdr(line.effectiveUnitPriceIdr)}
                      </p>
                    </div>
                  ))}
                </div>

                <dl className="cart-summary-rows mt-4 border-t border-[var(--border-sand)] pt-4">
                  <div className="cart-summary-row">
                    <dt>{CART_COPY.SUBTOTAL}</dt>
                    <dd className="text-cocoa font-medium">
                      {formatIdr(estimatedSubtotalIdr)}
                    </dd>
                  </div>

                  {totalDiscountIdr > 0 ? (
                    <div className="cart-summary-row text-burgundy">
                      <dt>{CART_COPY.DISCOUNT}</dt>
                      <dd className="font-semibold">
                        -{formatIdr(totalDiscountIdr)}
                      </dd>
                    </div>
                  ) : null}

                  <div className="cart-summary-row">
                    <dt>Ongkos Kirim</dt>
                    <dd className="text-xs italic">
                      {CHECKOUT_COPY.SHIPPING_PENDING_LABEL}
                    </dd>
                  </div>

                  <div className="cart-summary-row cart-summary-total">
                    <dt>{CART_COPY.TOTAL_ESTIMATE}</dt>
                    <dd>{formatIdr(estimatedTotalIdr)}</dd>
                  </div>
                </dl>

                <p className="cart-price-caveat">
                  {CART_COPY.PRICE_CAVEAT_NOTE}
                </p>

                <div className="mt-4">
                  <ActionLink
                    href={withBranch(ROUTES.CART, branchCode)}
                    variant="secondary"
                    size="sm"
                    prefetch={false}
                    className="w-full justify-center"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    {CHECKOUT_COPY.CTA_BACK_TO_CART}
                  </ActionLink>
                </div>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
