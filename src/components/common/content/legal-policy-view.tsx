'use client';

import { ErrorState } from '@/components/common/feedback/error-state';
import { InfoCard } from '@/components/common/cards/info-card';
import { PageHeader } from '@/components/common/layout/page-header';
import { SectionHeader } from '@/components/common/layout/section-header';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { CONTENT_COPY, CONTENT_DEFAULTS } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicContent } from '@/hooks/use-content';
import type { ContentInitial, PublicContentDirectory } from '@/types/content';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface LegalPolicyViewProps {
  policyKey: 'legal.privacy' | 'legal.ordering_policy';
  initial: ContentInitial<PublicContentDirectory>;
  className?: string;
}

export function LegalPolicyView({
  policyKey,
  initial,
  className,
}: LegalPolicyViewProps) {
  const { selected, code } = useBranches();
  const activeCode = selected?.code ?? code;
  const { items, isError, isFetching, refetch } = usePublicContent(
    [policyKey],
    initial,
  );

  const entry = items.find((item) => item.key === policyKey);
  const isPrivacy = policyKey === 'legal.privacy';
  const fallback = isPrivacy
    ? CONTENT_DEFAULTS.LEGAL_PRIVACY
    : CONTENT_DEFAULTS.LEGAL_ORDERING_POLICY;

  const title =
    entry &&
    (entry.key === 'legal.privacy' || entry.key === 'legal.ordering_policy')
      ? entry.content.title
      : fallback.title;
  const body =
    entry &&
    (entry.key === 'legal.privacy' || entry.key === 'legal.ordering_policy')
      ? entry.content.body
      : fallback.body;
  const source = entry?.source ?? 'template';

  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const facts = isPrivacy
    ? CONTENT_COPY.PRIVACY_FACTS
    : CONTENT_COPY.POLICY_FACTS;
  const factsHeading = isPrivacy
    ? CONTENT_COPY.PRIVACY_FACTS_TITLE
    : CONTENT_COPY.POLICY_FACTS_TITLE;
  const eyebrow = isPrivacy
    ? CONTENT_COPY.PRIVACY_EYEBROW
    : CONTENT_COPY.POLICY_EYEBROW;

  return (
    <main id={SITE_COPY.MAIN_ID} className={cn('content-page-main', className)}>
      <section
        className="content-container content-section"
        aria-labelledby="legal-hero-heading"
      >
        <PageHeader
          titleId="legal-hero-heading"
          title={title}
          badges={
            <>
              <Badge tone="accent">{eyebrow}</Badge>
              <Badge tone={source === 'published' ? 'success' : 'neutral'}>
                {source === 'published'
                  ? CONTENT_COPY.SOURCE_PUBLISHED_BADGE
                  : CONTENT_COPY.SOURCE_TEMPLATE_BADGE}
              </Badge>
            </>
          }
          alert={
            source === 'template' ? (
              <Feedback title={CONTENT_COPY.SOURCE_TEMPLATE_BADGE}>
                <p>{CONTENT_COPY.SOURCE_TEMPLATE_NOTE}</p>
              </Feedback>
            ) : null
          }
        />

        {isError ? (
          <ErrorState
            title={CONTENT_COPY.UPSTREAM_ERROR_TITLE}
            message={CONTENT_COPY.UPSTREAM_ERROR_BODY}
            onRetry={() => void refetch()}
            retryLabel={CONTENT_COPY.RETRY_BUTTON}
            isRetrying={isFetching}
          />
        ) : null}

        <Card className="content-legal-card">
          <div className="content-legal-body">
            {paragraphs.map((paragraph, index) => (
              <p key={`${policyKey}-p-${index}`}>{paragraph}</p>
            ))}
          </div>
        </Card>
      </section>

      <section
        className="content-container content-section"
        aria-labelledby="legal-facts-heading"
      >
        <SectionHeader titleId="legal-facts-heading" title={factsHeading} />
        <div className="content-values-grid">
          {facts.map((fact) => (
            <InfoCard
              key={fact.id}
              tone="cream"
              className="content-value-card"
              title={fact.title}
              description={fact.detail}
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
            href={withBranch(
              isPrivacy ? ROUTES.ORDERING_POLICY : ROUTES.PRIVACY,
              activeCode,
            )}
            variant="secondary"
            prefetch={false}
          >
            {isPrivacy
              ? 'Lihat Kebijakan Pemesanan'
              : 'Lihat Kebijakan Privasi'}
          </ActionLink>
          <ActionLink
            href={withBranch(ROUTES.FAQ, activeCode)}
            prefetch={false}
          >
            Buka Halaman FAQ
          </ActionLink>
        </div>
      </section>
    </main>
  );
}
