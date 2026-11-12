import { ExternalLink, Globe } from 'lucide-react';
import { MediaPlaceholder } from '@/app/_components';
import { Card } from '@/components/ui/card';
import { buttonStyles } from '@/components/ui/button.styles';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import { cn } from '@/utils';

interface InstagramCommunitySectionProps {
  instagramUrl: string;
  className?: string;
}
export function InstagramCommunitySection({
  instagramUrl,
  className,
}: InstagramCommunitySectionProps) {
  return (
    <section
      id={HOME_SECTION_IDS.COMMUNITY}
      className={cn('home-section', className)}
      aria-labelledby="home-community-title"
    >
      <div className="home-section-header">
        <div>
          <h2 id="home-community-title" className="editorial-heading">
            {HOME_COPY.COMMUNITY_TITLE}
          </h2>
          <p className="home-section-subtitle">
            {HOME_COPY.COMMUNITY_SUBTITLE}
          </p>
        </div>
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
      </div>
      <div className="home-community-grid">
        {HOME_COPY.COMMUNITY_CARDS.map((card) => (
          <Card key={card.id} className="home-community-card">
            <MediaPlaceholder
              caption={card.caption}
              className="home-card-media"
            />
            <h3>{card.label}</h3>
            <p>{card.caption}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
