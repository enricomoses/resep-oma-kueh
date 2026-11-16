'use client';

import { FaqAccordion } from '@/app/(site)/faq/_components/faq-accordion';
import { ErrorState } from '@/components/common/feedback/error-state';
import { PageHeader } from '@/components/common/layout/page-header';
import { SectionHeader } from '@/components/common/layout/section-header';
import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { CONTENT_COPY } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicFaqs } from '@/hooks/queries/use-content';
import '@/styles/components/page-sections.css';
import '@/styles/features/content.css';
import type { ContentInitial, PublicFaqDirectory } from '@/types/content';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface FaqViewProps {
  initial: ContentInitial<PublicFaqDirectory>;
  className?: string;
}

export function FaqView({ initial, className }: FaqViewProps) {
  const { selected, code } = useBranches();
  const activeCode = selected?.code ?? code;
  const { items, isError, isEmpty, isFetching, refetch } =
    usePublicFaqs(initial);

  return (
    <main id={SITE_COPY.MAIN_ID} className={cn('content-page-main', className)}>
      <section
        className="content-container content-section"
        aria-labelledby="faq-hero-heading"
      >
        <PageHeader
          className="content-header-block"
          titleId="faq-hero-heading"
          titleClassName="editorial-display"
          subtitleClassName="editorial-lead"
          title={CONTENT_COPY.FAQ_HEADING}
          subtitle={CONTENT_COPY.FAQ_SUBTITLE}
        />

        {isError ? (
          <ErrorState
            className="content-error-block"
            title={CONTENT_COPY.UPSTREAM_ERROR_TITLE}
            message={CONTENT_COPY.UPSTREAM_ERROR_BODY}
            onRetry={() => void refetch()}
            retryLabel={CONTENT_COPY.RETRY_BUTTON}
            isRetrying={isFetching}
          />
        ) : null}

        {!isError && isEmpty ? (
          <Feedback title={CONTENT_COPY.FAQ_EMPTY_TITLE} announce>
            <p>{CONTENT_COPY.FAQ_EMPTY_BODY}</p>
          </Feedback>
        ) : null}

        {!isError && items.length > 0 ? <FaqAccordion items={items} /> : null}
      </section>

      <section
        className="content-container content-section"
        aria-labelledby="faq-baseline-heading"
      >
        <SectionHeader
          titleId="faq-baseline-heading"
          title={CONTENT_COPY.FAQ_BASELINE_TITLE}
          subtitle={CONTENT_COPY.FAQ_BASELINE_NOTICE}
        />

        <div className="content-privacy-grid content-privacy-grid--3">
          {CONTENT_COPY.FAQ_BASELINE_ITEMS.map((item, index) => (
            <Card key={item.id} className="content-privacy-card">
              <div className="content-privacy-card-header">
                <span className="content-privacy-card-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="content-privacy-card-title">{item.question}</h3>
              </div>
              <p className="content-privacy-card-detail">{item.answer}</p>
            </Card>
          ))}
        </div>

        <div className="content-legal-actions">
          <ActionLink
            href={withBranch(ROUTES.CONTACT, activeCode)}
            variant="primary"
            prefetch={false}
          >
            {CONTENT_COPY.ABOUT_CONTACT_CTA}
          </ActionLink>
          <ActionLink
            href={withBranch(ROUTES.ORDERING_POLICY, activeCode)}
            variant="secondary"
            prefetch={false}
          >
            Lihat Kebijakan Pemesanan
          </ActionLink>
        </div>
      </section>
    </main>
  );
}
