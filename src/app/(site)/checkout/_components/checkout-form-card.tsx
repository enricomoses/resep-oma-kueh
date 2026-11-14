'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CHECKOUT_COPY, CHECKOUT_LIMITS } from '@/constants/checkout.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { CheckoutFormValues } from '@/types/checkout';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface CheckoutFormCardProps {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  selectedMethod: 'delivery' | 'pickup';
  allowDelivery: boolean;
  allowPickup: boolean;
  todayIso: string;
  maxDateIso: string;
  branchCode: string | null | undefined;
  hasReviewedQuote: boolean;
  isBusy: boolean;
  disabled: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  className?: string;
}

export function CheckoutFormCard({
  register,
  errors,
  selectedMethod,
  allowDelivery,
  allowPickup,
  todayIso,
  maxDateIso,
  branchCode,
  hasReviewedQuote,
  isBusy,
  disabled,
  onSubmit,
  className,
}: CheckoutFormCardProps) {
  return (
    <Card className={cn('checkout-form-card', className)}>
      <div className="checkout-card-header">
        <h2 className="checkout-section-title">
          {CHECKOUT_COPY.FORM_SECTION_TITLE}
        </h2>
        <p className="checkout-section-desc">
          {CHECKOUT_COPY.FORM_SECTION_DESC}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="checkout-form">
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
              placeholder={CHECKOUT_COPY.FIELD_CUSTOMER_NAME_PLACEHOLDER}
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
              placeholder={CHECKOUT_COPY.FIELD_TIME_WINDOW_PLACEHOLDER}
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

        <div className="checkout-consent-box">
          <label htmlFor="checkout-consent" className="checkout-consent-label">
            <input
              id="checkout-consent"
              type="checkbox"
              className="checkout-consent-checkbox"
              aria-invalid={
                errors.acknowledgedManualConfirmation ? true : undefined
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
          <p id="checkout-consent-policy" className="checkout-consent-policy">
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
            variant={hasReviewedQuote ? 'secondary' : 'primary'}
            loading={isBusy && !hasReviewedQuote}
            loadingLabel={CHECKOUT_COPY.CTA_PREPARING_QUOTE}
            disabled={disabled}
            className="w-full justify-center sm:w-auto"
          >
            {CHECKOUT_COPY.CTA_PREPARE_QUOTE}
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
