'use client';

import { WhatTheySaySection } from '@/components/common/content/what-they-say-section';
import { HOME_CMS_DEFAULTS } from '@/constants/home.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import type { ApprovedContacts } from '@/types/branch';
import type { HomePageData } from '@/types/home';
import { cn } from '@/utils';

import { BakeWithOmaSection } from './bake-with-oma-section';
import { CurrentTreatsSection } from './current-treats-section';
import { FeaturedBakesSection } from './featured-bakes-section';
import { FindUsSection } from './find-us-section';
import { HomeHero } from './home-hero';
import { InstagramCommunitySection } from './instagram-community-section';
import { OurStorySection } from './our-story-section';
import { ShopBySeriesSection } from './shop-by-series-section';

interface HomeViewProps {
  data: HomePageData;
  contacts: ApprovedContacts;
  className?: string;
}

export function HomeView({ data, contacts, className }: HomeViewProps) {
  const { selected, code, items, isError, switchBranch } = useBranches();
  const branchCode = selected?.code ?? code;

  const content =
    data.content.status === 'success'
      ? data.content.data
      : {
          hero: HOME_CMS_DEFAULTS.HERO,
          story: HOME_CMS_DEFAULTS.STORY,
          customBusiness: HOME_CMS_DEFAULTS.CUSTOM_BUSINESS,
          classPromo: HOME_CMS_DEFAULTS.CLASS_PROMO,
          instagram: { url: contacts.instagramUrl },
        };

  return (
    <main
      id={SITE_COPY.MAIN_ID}
      tabIndex={-1}
      className={cn('content-container home-main', className)}
    >
      <HomeHero
        headline={content.hero.headline}
        subcopy={content.hero.subcopy}
        imageAlt={content.hero.imageAlt}
        imageUrl={
          'imageUrl' in content.hero ? (content.hero.imageUrl ?? null) : null
        }
        branchCode={branchCode}
      />
      <ShopBySeriesSection
        categories={data.categories}
        branchCode={branchCode}
      />
      <FeaturedBakesSection
        featuredProducts={data.featuredProducts}
        selectedBranchId={selected?.id ?? null}
        branchCode={branchCode}
      />
      <OurStorySection
        title={content.story.title}
        body={content.story.body}
        imageAlt={content.story.imageAlt}
        imageUrl={
          'imageUrl' in content.story ? (content.story.imageUrl ?? null) : null
        }
        customBusinessTitle={content.customBusiness.title}
        customBusinessBody={content.customBusiness.body}
        branchCode={branchCode}
      />
      <CurrentTreatsSection
        promotions={data.promotions}
        selectedBranchId={selected?.id ?? null}
        selectedBranchName={selected?.name ?? null}
        shippingBanner={data.shippingBanner ?? null}
      />
      <BakeWithOmaSection
        title={content.classPromo.title}
        body={content.classPromo.body}
        upcomingClasses={data.upcomingClasses}
        selectedBranchId={selected?.id ?? null}
        branchCode={branchCode}
      />
      <WhatTheySaySection testimonials={data.testimonials} />
      <FindUsSection
        approvedBranches={contacts.branches}
        activeBranches={items}
        selectedBranchId={selected?.id ?? null}
        isBranchesError={isError}
        onSelectBranch={(branch) => {
          void switchBranch(branch);
        }}
      />
      <InstagramCommunitySection
        instagramUrl={content.instagram.url}
        items={
          'items' in content.instagram ? content.instagram.items : undefined
        }
      />
    </main>
  );
}
