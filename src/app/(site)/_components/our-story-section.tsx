import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

import { MediaPlaceholder } from '@/components/common/media-placeholder';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants';
import {
  HOME_CMS_DEFAULTS,
  HOME_COPY,
  HOME_SECTION_IDS,
} from '@/constants/home.constant';
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
          <div className="home-values-group">
            <p className="home-card-eyebrow">{HOME_COPY.STORY_VALUES_LABEL}</p>
            <ul
              className="home-story-values-list"
              aria-label={HOME_COPY.STORY_VALUES_LABEL}
            >
              {HOME_COPY.STORY_VALUES.map((value) => (
                <li key={value} lang="en">
                  <Badge tone="neutral" className="home-story-value-badge">
                    {value}
                  </Badge>
                </li>
              ))}
            </ul>
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
          <figure className="home-story-media">
            <Image
              src={resolvedImageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              unoptimized
              className="object-cover"
            />
          </figure>
        ) : (
          <MediaPlaceholder
            caption={imageAlt}
            className="home-story-media-placeholder"
          />
        )}
      </div>
      <Card tone="surface" className="home-custom-business-card">
        <div className="home-custom-business-copy">
          <h3>{customBusinessTitle}</h3>
          <p>{customBusinessBody}</p>
        </div>
        <ActionLink
          href={`${withBranch(ROUTES.CONTACT, branchCode)}#custom-business`}
          variant="primary"
          prefetch={false}
          className="w-full justify-center sm:w-auto"
        >
          {HOME_COPY.CUSTOM_BUSINESS_CTA}
          <ArrowRight size={16} aria-hidden="true" />
        </ActionLink>
      </Card>
    </section>
  );
}
