'use client';

import { useEffect } from 'react';
import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { APPROVED_CONTACTS } from '@/constants/contacts.constant';
import { ROUTES } from '@/constants/routes.constant';
import { BOUNDARY_COPY } from '@/constants/seo.constant';
import { formatWhatsappDigits } from '@/utils/checkout';
import { cn } from '@/utils';

interface ErrorFallbackPanelProps {
  error: Error & { digest?: string };
  reset: () => void;
  className?: string;
}

export function ErrorFallbackPanel({
  error,
  reset,
  className,
}: ErrorFallbackPanelProps) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <section className={cn('site-section py-16', className)}>
      <div className="content-container max-w-2xl">
        <Card className="space-y-6" tone="surface">
          <Feedback tone="error" title={BOUNDARY_COPY.ERROR_TITLE} announce>
            <p>{BOUNDARY_COPY.ERROR_BODY}</p>
          </Feedback>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={reset}>
              {BOUNDARY_COPY.ERROR_RETRY_CTA}
            </Button>
            <ActionLink href={ROUTES.HOME} variant="secondary">
              {BOUNDARY_COPY.ERROR_HOME_CTA}
            </ActionLink>
          </div>

          <div className="border-t border-black/10 pt-4 text-sm">
            <p className="text-burgundy mb-2 font-semibold">
              {BOUNDARY_COPY.ERROR_CONTACTS_HEADING}
            </p>
            <ul className="space-y-2 text-ink/85">
              {APPROVED_CONTACTS.branches.map((branch) => (
                <li key={branch.code}>
                  <strong>{branch.name}:</strong>{' '}
                  <a
                    href={`https://wa.me/${formatWhatsappDigits(branch.whatsappNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-burgundy underline"
                  >
                    WhatsApp +{branch.whatsappNumber}
                  </a>
                  {branch.address ? ` · ${branch.address}` : ''}
                </li>
              ))}
              <li>
                <strong>Email:</strong>{' '}
                <a
                  href={`mailto:${APPROVED_CONTACTS.email}`}
                  className="hover:text-burgundy underline"
                >
                  {APPROVED_CONTACTS.email}
                </a>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </section>
  );
}
