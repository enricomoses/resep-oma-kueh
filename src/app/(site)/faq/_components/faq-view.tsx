'use client';

import { ErrorState } from '@/components/common/feedback/error-state';
import { InfoCard } from '@/components/common/cards/info-card';
import { PageHeader } from '@/components/common/layout/page-header';
import { SectionHeader } from '@/components/common/layout/section-header';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Feedback } from '@/components/ui/feedback';
import { CONTENT_COPY } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicFaqs } from '@/hooks/use-content';
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

  const groupedByCategory = items.reduce<Record<string, typeof items>>(
    (accumulator, item) => {
      const bucket = accumulator[item.category] ?? [];
      bucket.push(item);
      accumulator[item.category] = bucket;
      return accumulator;
    },
    {},
  );
  const categories = Object.keys(groupedByCategory);

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
          badges={
            <div className="home-badge-row">
              <Badge tone="accent">{CONTENT_COPY.FAQ_EYEBROW}</Badge>
            </div>
          }
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
      </section>

      <section
        className="content-container content-section"
        aria-labelledby="faq-published-heading"
      >
        <SectionHeader
          titleId="faq-published-heading"
          title={CONTENT_COPY.FAQ_DB_SECTION_TITLE}
        />

        {!isError && isEmpty ? (
          <Feedback title={CONTENT_COPY.FAQ_EMPTY_TITLE} announce>
            <p>{CONTENT_COPY.FAQ_EMPTY_BODY}</p>
          </Feedback>
        ) : null}

        {!isError && categories.length > 0 ? (
          <div className="content-faq-groups">
            {categories.map((category) => (
              <div key={category} className="content-faq-category-group">
                <div className="home-badge-row">
                  <Badge tone="neutral">{category}</Badge>
                </div>
                <div className="content-faq-list">
                  {groupedByCategory[category]?.map((faq) => (
                    <InfoCard
                      key={faq.id}
                      className="content-faq-card"
                      title={faq.question}
                      description={faq.answer}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section
        className="content-container content-section"
        aria-labelledby="faq-baseline-heading"
      >
        <SectionHeader
          titleId="faq-baseline-heading"
          title={CONTENT_COPY.FAQ_BASELINE_TITLE}
          subtitle={CONTENT_COPY.FAQ_BASELINE_NOTICE}
          badges={
            <div className="home-badge-row">
              <Badge tone="accent">{CONTENT_COPY.FAQ_BASELINE_BADGE}</Badge>
            </div>
          }
        />

        <div className="content-faq-list">
          {CONTENT_COPY.FAQ_BASELINE_ITEMS.map((item) => (
            <InfoCard
              key={item.id}
              tone="cream"
              className="content-faq-card"
              badges={
                <div className="home-badge-row">
                  <Badge tone="neutral">{item.category}</Badge>
                </div>
              }
              title={item.question}
              description={item.answer}
            />
          ))}
        </div>

        <div className="home-inline-actions">
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
