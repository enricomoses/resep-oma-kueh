'use client';

import { ErrorState } from '@/components/common/feedback/error-state';
import { PageHeader } from '@/components/common/layout/page-header';
import { SectionHeader } from '@/components/common/layout/section-header';
import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { CONTENT_COPY, CONTENT_DEFAULTS } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicContent } from '@/hooks/queries/use-content';
import '@/styles/components/page-sections.css';
import '@/styles/features/content.css';
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
  const subtitle = isPrivacy
    ? CONTENT_COPY.PRIVACY_SUBTITLE
    : CONTENT_COPY.POLICY_SUBTITLE;

  return (
    <main id={SITE_COPY.MAIN_ID} className={cn('content-page-main', className)}>
      <section
        className="content-container content-section"
        aria-labelledby="legal-hero-heading"
      >
        <PageHeader
          titleId="legal-hero-heading"
          title={title}
          subtitle={subtitle}
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
          <div className="content-legal-body content-legal-body--full">
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
        <div
          className={cn(
            'content-privacy-grid',
            facts.length === 3 && 'content-privacy-grid--3',
          )}
        >
          {facts.map((fact, index) => (
            <Card key={fact.id} className="content-privacy-card">
              <div className="content-privacy-card-header">
                <span className="content-privacy-card-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="content-privacy-card-title">{fact.title}</h3>
              </div>
              <p className="content-privacy-card-detail">{fact.detail}</p>
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
