'use client';

import { ErrorState } from '@/components/common/feedback/error-state';
import { InfoCard } from '@/components/common/cards/info-card';
import { PageHeader } from '@/components/common/layout/page-header';
import { SectionHeader } from '@/components/common/layout/section-header';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CONTENT_COPY, CONTENT_DEFAULTS } from '@/constants/content.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicContent } from '@/hooks/use-content';
import type { ContentInitial, PublicContentDirectory } from '@/types/content';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

const ABOUT_KEYS = ['about.story', 'about.values'] as const;

interface AboutViewProps {
  initial: ContentInitial<PublicContentDirectory>;
  className?: string;
}

export function AboutView({ initial, className }: AboutViewProps) {
  const { selected, code } = useBranches();
  const activeCode = selected?.code ?? code;
  const { items, isError, isFetching, refetch } = usePublicContent(
    ABOUT_KEYS,
    initial,
  );

  const storyEntry = items.find((item) => item.key === 'about.story');
  const valuesEntry = items.find((item) => item.key === 'about.values');

  const storyTitle =
    storyEntry?.key === 'about.story'
      ? storyEntry.content.title
      : CONTENT_DEFAULTS.ABOUT_STORY.title;
  const storyBody =
    storyEntry?.key === 'about.story'
      ? storyEntry.content.body
      : CONTENT_DEFAULTS.ABOUT_STORY.body;
  const storySource = storyEntry?.source ?? 'template';

  const valuesList =
    valuesEntry?.key === 'about.values'
      ? valuesEntry.content.items
      : [...CONTENT_DEFAULTS.ABOUT_VALUES];
  const valuesSource = valuesEntry?.source ?? 'template';

  const hasTemplateSource =
    storySource === 'template' || valuesSource === 'template';

  return (
    <main id={SITE_COPY.MAIN_ID} className={cn('content-page-main', className)}>
      <section
        className="content-container content-section"
        aria-labelledby="about-hero-heading"
      >
        <PageHeader
          className="content-header-block"
          titleId="about-hero-heading"
          titleClassName="editorial-display"
          subtitleClassName="editorial-lead"
          badges={
            <div className="home-badge-row">
              <Badge tone="accent">{CONTENT_COPY.ABOUT_EYEBROW}</Badge>
              <Badge tone={storySource === 'published' ? 'success' : 'neutral'}>
                {storySource === 'published'
                  ? CONTENT_COPY.SOURCE_PUBLISHED_BADGE
                  : CONTENT_COPY.SOURCE_TEMPLATE_BADGE}
              </Badge>
            </div>
          }
          title={storyTitle}
          subtitle={storyBody}
        >
          {hasTemplateSource ? (
            <p className="content-source-note">
              {CONTENT_COPY.SOURCE_TEMPLATE_NOTE}
            </p>
          ) : null}
          <div className="home-hero-actions">
            <ActionLink
              href={withBranch(ROUTES.MENU, activeCode)}
              variant="primary"
              prefetch={false}
            >
              {CONTENT_COPY.ABOUT_EXPLORE_MENU_CTA}
            </ActionLink>
            <ActionLink
              href={withBranch(ROUTES.CLASSES, activeCode)}
              variant="secondary"
              prefetch={false}
            >
              {CONTENT_COPY.ABOUT_JOIN_CLASS_CTA}
            </ActionLink>
            <ActionLink
              href={withBranch(ROUTES.CONTACT, activeCode)}
              prefetch={false}
            >
              {CONTENT_COPY.ABOUT_CONTACT_CTA}
            </ActionLink>
          </div>
        </PageHeader>

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
        aria-labelledby="about-values-heading"
      >
        <SectionHeader
          titleId="about-values-heading"
          title={CONTENT_COPY.ABOUT_VALUES_TITLE}
          subtitle={CONTENT_COPY.ABOUT_VALUES_SUBTITLE}
          badges={
            <div className="home-badge-row">
              <Badge
                tone={valuesSource === 'published' ? 'success' : 'neutral'}
              >
                {valuesSource === 'published'
                  ? CONTENT_COPY.SOURCE_PUBLISHED_BADGE
                  : CONTENT_COPY.SOURCE_TEMPLATE_BADGE}
              </Badge>
            </div>
          }
        />
        <div className="content-values-grid">
          {valuesList.map((value) => {
            const description =
              CONTENT_COPY.ABOUT_VALUE_DESCRIPTIONS[
                value as keyof typeof CONTENT_COPY.ABOUT_VALUE_DESCRIPTIONS
              ] ??
              'Nilai dapur Resep Oma Kueh dalam menjaga mutu produk dan layanan.';
            return (
              <InfoCard
                key={value}
                tone="cream"
                className="content-value-card"
                title={value}
                description={description}
              />
            );
          })}
        </div>
      </section>

      <section
        className="content-container content-section"
        aria-labelledby="about-team-heading"
      >
        <Card className="content-team-card">
          <div className="home-badge-row">
            <Badge tone="accent">{CONTENT_COPY.ABOUT_TEAM_BADGE}</Badge>
          </div>
          <h2 id="about-team-heading" className="editorial-heading">
            {CONTENT_COPY.ABOUT_TEAM_TITLE}
          </h2>
          <p className="home-story-body">{CONTENT_COPY.ABOUT_TEAM_BODY}</p>
          <p className="content-disclaimer-box">
            {CONTENT_COPY.ABOUT_TEAM_DISCLAIMER}
          </p>
        </Card>
      </section>
    </main>
  );
}
