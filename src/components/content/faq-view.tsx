'use client';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { CONTENT_COPY } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicFaqs } from '@/hooks/use-content';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';
import type { ContentInitial, PublicFaqDirectory } from '@/types/content';

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
        <div className="content-header-block">
          <div className="home-badge-row">
            <Badge tone="accent">{CONTENT_COPY.FAQ_EYEBROW}</Badge>
          </div>
          <h1 id="faq-hero-heading" className="editorial-display">
            {CONTENT_COPY.FAQ_HEADING}
          </h1>
          <p className="editorial-lead">{CONTENT_COPY.FAQ_SUBTITLE}</p>
        </div>

        {isError ? (
          <div className="content-error-block">
            <Feedback
              tone="error"
              title={CONTENT_COPY.UPSTREAM_ERROR_TITLE}
              announce
            >
              <p>{CONTENT_COPY.UPSTREAM_ERROR_BODY}</p>
            </Feedback>
            <Button
              variant="secondary"
              loading={isFetching}
              onClick={() => void refetch()}
            >
              {CONTENT_COPY.RETRY_BUTTON}
            </Button>
          </div>
        ) : null}
      </section>

      <section
        className="content-container content-section"
        aria-labelledby="faq-published-heading"
      >
        <div className="home-section-header">
          <div>
            <h2 id="faq-published-heading" className="editorial-heading">
              {CONTENT_COPY.FAQ_DB_SECTION_TITLE}
            </h2>
          </div>
        </div>

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
                    <Card key={faq.id} className="content-faq-card">
                      <h3>{faq.question}</h3>
                      <p>{faq.answer}</p>
                    </Card>
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
        <div className="home-section-header">
          <div>
            <div className="home-badge-row">
              <Badge tone="accent">{CONTENT_COPY.FAQ_BASELINE_BADGE}</Badge>
            </div>
            <h2 id="faq-baseline-heading" className="editorial-heading">
              {CONTENT_COPY.FAQ_BASELINE_TITLE}
            </h2>
            <p className="home-section-subtitle">
              {CONTENT_COPY.FAQ_BASELINE_NOTICE}
            </p>
          </div>
        </div>

        <div className="content-faq-list">
          {CONTENT_COPY.FAQ_BASELINE_ITEMS.map((item) => (
            <Card key={item.id} tone="cream" className="content-faq-card">
              <div className="home-badge-row">
                <Badge tone="neutral">{item.category}</Badge>
              </div>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </Card>
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
