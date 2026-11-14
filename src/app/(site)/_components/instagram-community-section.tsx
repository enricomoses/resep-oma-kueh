import { ExternalLink, Globe } from 'lucide-react';
import Image from 'next/image';

import { MediaPlaceholder } from '@/components/common/media-placeholder';
import { SectionHeader } from '@/components/common/layout/section-header';
import { buttonStyles } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import { cn } from '@/utils';

interface CuratedInstagramItem {
  imageUrl: string | null;
  alt: string;
  href: string;
}

interface InstagramCommunitySectionProps {
  instagramUrl: string;
  items?: readonly CuratedInstagramItem[];
  className?: string;
}

export function InstagramCommunitySection({
  instagramUrl,
  items,
  className,
}: InstagramCommunitySectionProps) {
  const curated = items && items.length > 0 ? items : null;

  return (
    <section
      id={HOME_SECTION_IDS.COMMUNITY}
      className={cn('home-section', className)}
      aria-labelledby="home-community-title"
    >
      <SectionHeader
        titleId="home-community-title"
        title={HOME_COPY.COMMUNITY_TITLE}
        subtitle={HOME_COPY.COMMUNITY_SUBTITLE}
        actions={
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles('secondary', 'md')}
          >
            <Globe size={18} aria-hidden="true" />
            {HOME_COPY.COMMUNITY_CTA}
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        }
      />
      <div className="home-community-grid">
        {curated
          ? curated.map((item, idx) => (
              <Card key={`${item.href}-${idx}`} className="home-community-card">
                {item.imageUrl ? (
                  <div className="relative h-48 w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
                    <Image
                      src={item.imageUrl}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <MediaPlaceholder
                    caption={item.alt}
                    className="home-card-media"
                  />
                )}
                <h3>{item.alt}</h3>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-link text-xs"
                >
                  Lihat di Instagram
                </a>
              </Card>
            ))
          : HOME_COPY.COMMUNITY_CARDS.map((card) => (
              <Card key={card.id} className="home-community-card">
                <div className="relative h-48 w-full overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-sand)]">
                  <Image
                    src={card.imageUrl}
                    alt={card.label}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
                <h3>{card.label}</h3>
                <p>{card.caption}</p>
              </Card>
            ))}
      </div>
    </section>
  );
}
