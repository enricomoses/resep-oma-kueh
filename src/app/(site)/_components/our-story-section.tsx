import { ArrowRight, Building2 } from 'lucide-react';
import Image from 'next/image';

import { MediaPlaceholder } from '@/components/common/media-placeholder';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants';
import { HOME_CMS_DEFAULTS, HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface OurStorySectionProps {
  title: string;
  body: string;
  imageAlt: string;
  imageUrl?: string | null;
  customBusinessTitle: string;
  customBusinessBody: string;
  branchCode: string | null;
  className?: string;
}

export function OurStorySection({
  title,
  body,
  imageAlt,
  imageUrl,
  customBusinessTitle,
  customBusinessBody,
  branchCode,
  className,
}: OurStorySectionProps) {
  const resolvedImageUrl = imageUrl ?? HOME_CMS_DEFAULTS.STORY.imageUrl;

  return (
    <section
      id={HOME_SECTION_IDS.STORY}
      className={cn('home-section home-story-section', className)}
      aria-labelledby="home-story-title"
    >
      <div className="home-story-grid">
        <div className="home-story-content">
          <h2 id="home-story-title" className="editorial-heading">
            {title}
          </h2>
          <p className="home-story-body">{body}</p>
          <div
            className="home-values-group"
            aria-label={HOME_COPY.STORY_VALUES_LABEL}
          >
            <p className="home-card-eyebrow">{HOME_COPY.STORY_VALUES_LABEL}</p>
            <div className="home-badge-row">
              {HOME_COPY.STORY_VALUES.map((value) => (
                <Badge key={value} tone="accent" lang="en">
                  {value}
                </Badge>
              ))}
            </div>
          </div>
          <ActionLink
            href={withBranch(ROUTES.ABOUT, branchCode)}
            variant="secondary"
            prefetch={false}
          >
            {HOME_COPY.STORY_CTA}
            <ArrowRight size={16} aria-hidden="true" />
          </ActionLink>
        </div>
        {resolvedImageUrl ? (
          <figure className="media-placeholder overflow-hidden p-0">
            <div className="relative h-full min-h-60 w-full">
              <Image
                src={resolvedImageUrl}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                unoptimized
                className="object-cover"
              />
            </div>
          </figure>
        ) : (
          <MediaPlaceholder caption={imageAlt} />
        )}
      </div>
      <Card tone="surface" className="home-custom-business-card">
        <div className="home-custom-business-copy">
          <Badge tone="neutral">
            <Building2 size={14} aria-hidden="true" />
            {HOME_COPY.CUSTOM_BUSINESS_BADGE}
          </Badge>
          <h3>{customBusinessTitle}</h3>
          <p>{customBusinessBody}</p>
        </div>
        <ActionLink
          href={`${withBranch(ROUTES.CONTACT, branchCode)}#custom-business`}
          variant="primary"
          prefetch={false}
        >
          {HOME_COPY.CUSTOM_BUSINESS_CTA}
          <ArrowRight size={16} aria-hidden="true" />
        </ActionLink>
      </Card>
    </section>
  );
}
