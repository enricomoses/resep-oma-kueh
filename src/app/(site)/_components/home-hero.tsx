import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

import { MediaPlaceholder } from '@/components/common/media-placeholder';
import { ActionLink } from '@/components/ui/action-link';
import { ROUTES } from '@/constants';
import {
  HOME_CMS_DEFAULTS,
  HOME_COPY,
  HOME_SECTION_IDS,
} from '@/constants/home.constant';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface HeroSticker {
  src: string;
  width: number;
  height: number;
  className: string;
}

const HERO_MEDIA_STICKERS: readonly HeroSticker[] = [
  {
    src: '/images/hero-3.png',
    width: 417,
    height: 257,
    className: 'home-hero-sticker home-hero-sticker--top-left',
  },
  {
    src: '/images/hero-1.png',
    width: 528,
    height: 440,
    className: 'home-hero-sticker home-hero-sticker--top-right',
  },
  {
    src: '/images/oma.png',
    width: 500,
    height: 500,
    className: 'home-hero-sticker home-hero-sticker--bottom-left',
  },
  {
    src: '/images/hero-2.png',
    width: 738,
    height: 595,
    className: 'home-hero-sticker home-hero-sticker--bottom-right',
  },
];

interface HomeHeroProps {
  headline: string;
  subcopy: string;
  imageAlt: string;
  imageUrl?: string | null;
  branchCode: string | null;
  className?: string;
}

export function HomeHero({
  headline,
  subcopy,
  imageAlt,
  imageUrl,
  branchCode,
  className,
}: HomeHeroProps) {
  const resolvedImageUrl = imageUrl ?? HOME_CMS_DEFAULTS.HERO.imageUrl;

  return (
    <section
      id={HOME_SECTION_IDS.HERO}
      className={cn('foundation-hero home-hero', className)}
      aria-labelledby="home-hero-title"
    >
      <div className="home-hero-corner-layer" aria-hidden="true">
        <Image
          src="/images/hero-4.png"
          alt=""
          width={610}
          height={568}
          unoptimized
          className="home-hero-corner-cake"
        />
      </div>
      <div className="home-hero-copy">
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
      <div className="home-hero-media-stage">
        {resolvedImageUrl ? (
          <figure className="media-placeholder overflow-hidden p-0">
            <div className="relative h-full w-full flex-1">
              <Image
                src={resolvedImageUrl}
                alt={imageAlt}
                fill
                preload={true}
                sizes="(max-width: 768px) 100vw, 520px"
                unoptimized
                className="object-cover"
              />
            </div>
          </figure>
        ) : (
          <MediaPlaceholder caption={imageAlt} />
        )}
        {HERO_MEDIA_STICKERS.map((sticker) => (
          <Image
            key={sticker.src}
            src={sticker.src}
            alt=""
            width={sticker.width}
            height={sticker.height}
            aria-hidden="true"
            unoptimized
            className={sticker.className}
          />
        ))}
      </div>
    </section>
  );
}
