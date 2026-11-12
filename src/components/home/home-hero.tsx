import { ArrowRight, Sparkles } from 'lucide-react';
import { MediaPlaceholder } from '@/app/_components';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { withBranch } from '@/utils/branch-url';
import { cn } from '@/utils';

interface HomeHeroProps {
  headline: string;
  subcopy: string;
  imageAlt: string;
  branchCode: string | null;
  className?: string;
}
export function HomeHero({
  headline,
  subcopy,
  imageAlt,
  branchCode,
  className,
}: HomeHeroProps) {
  return (
    <section
      id={HOME_SECTION_IDS.HERO}
      className={cn('foundation-hero home-hero', className)}
      aria-labelledby="home-hero-title"
    >
      <div>
        <Badge tone="accent">
          <Sparkles size={14} aria-hidden="true" />
          {FOUNDATION_COPY.SIGNOFF}
        </Badge>
        <h1 className="foundation-title" id="home-hero-title" lang="en">
          {headline}
        </h1>
        <p className="foundation-intro">{subcopy}</p>
        <div className="home-hero-actions">
          <ActionLink
            href={withBranch(ROUTES.MENU, branchCode)}
            variant="primary"
            size="lg"
            prefetch={false}
          >
            {HOME_COPY.HERO_EXPLORE_CTA}
            <ArrowRight size={18} aria-hidden="true" />
          </ActionLink>
          <ActionLink
            href={withBranch(ROUTES.CLASSES, branchCode)}
            variant="secondary"
            size="lg"
            prefetch={false}
          >
            {HOME_COPY.HERO_CLASS_CTA}
          </ActionLink>
        </div>
      </div>
      <MediaPlaceholder caption={imageAlt} />
    </section>
  );
}
