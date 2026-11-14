'use client';

import { ArrowLeft, MessageCircle } from 'lucide-react';

import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CHECKOUT_COPY } from '@/constants/checkout.constant';
import { ROUTES } from '@/constants/routes.constant';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface CheckoutConsultationCardProps {
  branchName: string;
  branchCode: string | null | undefined;
  whatsappHref: string | null;
  className?: string;
}

export function CheckoutConsultationCard({
  branchName,
  branchCode,
  whatsappHref,
  className,
}: CheckoutConsultationCardProps) {
  return (
    <Card tone="cream" className={cn('checkout-consultation-card', className)}>
      <Badge tone="accent">Konsultasi Cabang</Badge>
      <h2 className="checkout-section-title">
        {CHECKOUT_COPY.FULFILLMENT_DISABLED_TITLE}
      </h2>
      <p className="checkout-section-desc">
        {CHECKOUT_COPY.FULFILLMENT_DISABLED_BODY}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-button ui-button--primary ui-button--md"
          >
            <MessageCircle size={18} aria-hidden="true" />
            {CHECKOUT_COPY.CTA_CONSULT_WHATSAPP} ({branchName})
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
  );
}
