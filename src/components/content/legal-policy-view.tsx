'use client';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { CONTENT_COPY, CONTENT_DEFAULTS } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicContent } from '@/hooks/use-content';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';
import type { ContentInitial, PublicContentDirectory } from '@/types/content';

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
        <div className="content-header-block">
          <div className="home-badge-row">
            <Badge tone="accent">{eyebrow}</Badge>
            <Badge tone={source === 'published' ? 'success' : 'neutral'}>
              {source === 'published'
                ? CONTENT_COPY.SOURCE_PUBLISHED_BADGE
                : CONTENT_COPY.SOURCE_TEMPLATE_BADGE}
            </Badge>
          </div>
          <h1 id="legal-hero-heading" className="editorial-display">
            {title}
          </h1>
          {source === 'template' ? (
            <Feedback title={CONTENT_COPY.SOURCE_TEMPLATE_BADGE}>
              <p>{CONTENT_COPY.SOURCE_TEMPLATE_NOTE}</p>
            </Feedback>
          ) : null}
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
        <div className="home-section-header">
          <div>
            <h2 id="legal-facts-heading" className="editorial-heading">
              {factsHeading}
            </h2>
          </div>
        </div>
        <div className="content-values-grid">
          {facts.map((fact) => (
            <Card key={fact.id} tone="cream" className="content-value-card">
              <h3>{fact.title}</h3>
              <p>{fact.detail}</p>
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
