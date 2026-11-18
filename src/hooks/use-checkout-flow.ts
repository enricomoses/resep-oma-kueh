'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { type FieldErrors, useForm, useWatch } from 'react-hook-form';

import { CHECKOUT_COPY, CHECKOUT_LIMITS } from '@/constants/checkout.constant';
import { ApiClientError } from '@/lib/errors';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
  notifyWarning,
} from '@/lib/toast';
import type {
  CheckoutFormValues,
  CheckoutPrepareResponse,
} from '@/types/checkout';
import { formatJakartaDateIso, formatWhatsappDigits } from '@/utils/checkout';
import { checkoutFormSchema } from '@/validations/checkout.schema';

import { useCheckoutPrepare } from '@/hooks/queries/use-checkout';
import { usePublicPromotions } from '@/hooks/queries/use-promotions';
import { useBranches } from '@/hooks/use-branches';
import { useCart } from '@/hooks/use-cart';

/**
 * Coordinates checkout form validation, server quote verification, and WhatsApp handoff state.
 */
export function useCheckoutFlow() {
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
  const { data: promoData } = usePublicPromotions(
    branchCode,
    Boolean(branchCode),
  );
  const shippingBanner = promoData?.shippingBanner ?? null;
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

  useEffect(() => {
    if (!allowDelivery && allowPickup && selectedMethod === 'delivery') {
      setValue('method', 'pickup');
    } else if (!allowPickup && allowDelivery && selectedMethod === 'pickup') {
      setValue('method', 'delivery');
    }
  }, [allowDelivery, allowPickup, selectedMethod, setValue]);

  const [reviewedQuote, setReviewedQuote] =
    useState<CheckoutPrepareResponse | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
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
      setIsReviewModalOpen(false);
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

      const errorMessage = error.message;
      if (error.status !== 422) {
        setServerError({
          title:
            error.status === 409
              ? 'Stok atau Ketersediaan Produk Berubah'
              : 'Gagal Memproses Checkout',
          message: errorMessage,
          fieldList,
        });
      }
      notifyError(errorMessage, { toastId: 'checkout-error' });
      return;
    }

    setServerError({
      title: 'Gagal Memproses Checkout',
      message: CHECKOUT_COPY.ERROR_UPSTREAM,
      fieldList: [],
    });
    notifyError(CHECKOUT_COPY.ERROR_UPSTREAM, { toastId: 'checkout-error' });
  };

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
      setIsReviewModalOpen(true);
      setHandoffState('idle');
      notifySuccess('Ringkasan pesanan siap diperiksa sebelum dikirim.', {
        toastId: 'checkout-quote-ready',
      });
    } catch (error: unknown) {
      applyApiError(error);
    } finally {
      inFlightRef.current = false;
    }
  };

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
      setIsReviewModalOpen(false);
      notifyError(CHECKOUT_COPY.ERROR_FORM_SUMMARY_TITLE, {
        toastId: 'checkout-validation-error',
      });
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

      if (latestQuote.requiresReview) {
        setHandoffState('idle');
        notifyWarning(
          'Harga atau promo berubah. Periksa kembali ringkasan pesanan.',
          { toastId: 'checkout-quote-review' },
        );
        return;
      }

      if (latestQuote.requiresCopy) {
        setHandoffState('requires_copy');
        notifyInfo(CHECKOUT_COPY.HANDOFF_LONG_URL_TITLE, {
          toastId: 'checkout-handoff',
        });
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
        notifyInfo(CHECKOUT_COPY.HANDOFF_READY_TITLE, {
          toastId: 'checkout-handoff',
        });
      } else {
        setHandoffState('ready');
        notifySuccess(CHECKOUT_COPY.HANDOFF_READY_TITLE, {
          toastId: 'checkout-handoff',
        });
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
      notifySuccess(CHECKOUT_COPY.CTA_COPIED_MESSAGE, {
        toastId: 'checkout-copy-wa',
      });
    } catch {
      setCopyStatus('fallback');
      notifyInfo(CHECKOUT_COPY.COPY_FALLBACK_NOTE, {
        toastId: 'checkout-copy-wa',
      });
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

  const onInvalidForm = (fieldErrors: FieldErrors<CheckoutFormValues>) => {
    const messages = Object.values(fieldErrors)
      .map((err) => err?.message)
      .filter((msg): msg is string => Boolean(msg));
    const firstMessage = messages[0];
    const toastMessage =
      messages.length === 1 && firstMessage
        ? firstMessage
        : messages.length > 1
          ? `${CHECKOUT_COPY.ERROR_FORM_SUMMARY_TITLE} (${messages.length} isian perlu diperbaiki)`
          : CHECKOUT_COPY.ERROR_FORM_SUMMARY_TITLE;
    notifyError(toastMessage, { toastId: 'checkout-validation-error' });
  };

  const isBusy = prepareMutation.isPending || isSubmitting;
  const isInitialLoading =
    !hasHydrated ||
    (isValidating && lines.length > 0 && validatedLines.length === 0);
  const isEmptyCart = lines.length === 0;
  const isCartValidationError =
    isValidationError && validatedLines.length === 0;

  const consultationWhatsappHref = selectedBranch
    ? `https://wa.me/${formatWhatsappDigits(selectedBranch.whatsappNumber)}?text=${encodeURIComponent(
        `Halo Admin Resep Oma Kueh ${selectedBranch.name}, saya ingin berkonsultasi mengenai pemesanan produk Resep Oma.`,
      )}`
    : null;

  return {
    isInitialLoading,
    isEmptyCart,
    isCartValidationError,
    isFulfillmentDisabled,
    selectedBranch,
    branchCode,
    shippingBanner,
    totalQuantity,
    validatedLines,
    estimatedSubtotalIdr,
    totalDiscountIdr,
    estimatedTotalIdr,
    hasBlockingConflicts,
    refetchValidation,
    register,
    errors,
    selectedMethod,
    allowDelivery,
    allowPickup,
    todayIso,
    maxDateIso,
    watchedValues,
    reviewedQuote,
    isReviewModalOpen,
    setIsReviewModalOpen,
    handoffState,
    copyStatus,
    serverError,
    isBusy,
    previewTextareaRef,
    consultationWhatsappHref,
    onSubmitForm: (event: FormEvent<HTMLFormElement>) => {
      void handleSubmit(onPrepareQuote, onInvalidForm)(event);
    },
    handleProceedToWhatsApp: () => {
      void handleProceedToWhatsApp();
    },
    handleCopyMessage: () => {
      void handleCopyMessage();
    },
    handleReopenWhatsApp,
  };
}
