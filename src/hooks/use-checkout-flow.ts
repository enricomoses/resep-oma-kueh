'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { CHECKOUT_COPY, CHECKOUT_LIMITS } from '@/constants/checkout.constant';
import { ApiClientError } from '@/lib/errors';
import type {
  CheckoutFormValues,
  CheckoutPrepareResponse,
} from '@/types/checkout';
import { formatJakartaDateIso, formatWhatsappDigits } from '@/utils/checkout';
import { checkoutFormSchema } from '@/validations/checkout.schema';

import { useBranches } from './use-branches';
import { useCart } from './use-cart';
import { useCheckoutPrepare } from './use-checkout';
import { usePublicPromotions } from './use-promotions';

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
    handoffState,
    copyStatus,
    serverError,
    clientErrorMessages,
    isBusy,
    previewTextareaRef,
    consultationWhatsappHref,
    onSubmitForm: (event: FormEvent<HTMLFormElement>) => {
      void handleSubmit(onPrepareQuote)(event);
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
