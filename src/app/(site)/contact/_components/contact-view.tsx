'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/layout/page-header';
import { SectionHeader } from '@/components/common/layout/section-header';
import { Badge } from '@/components/ui/badge';
import { Feedback } from '@/components/ui/feedback';
import { CONTENT_COPY } from '@/constants/content.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import type { ContactPageData } from '@/types/content';
import { cn } from '@/utils';
import { ContactB2bCard } from './contact-b2b-card';
import {
  ContactBranchCard,
  type ResolvedContactBranch,
} from './contact-branch-card';
import { ContactOfficialChannels } from './contact-official-channels';

interface ContactViewProps {
  data: ContactPageData;
  className?: string;
}

export function ContactView({ data, className }: ContactViewProps) {
  const {
    items: activeBranches,
    selected,
    code,
    hydrated,
    isError: isBranchesError,
    switchBranch,
  } = useBranches();

  const [b2bBranchOverride, setB2bBranchOverride] = useState<
    'surabaya' | 'bintaro' | null
  >(null);
  const [b2bTopic, setB2bTopic] = useState('');

  const activeBranchCode: 'surabaya' | 'bintaro' =
    b2bBranchOverride ??
    (selected?.code === 'bintaro' || code === 'bintaro'
      ? 'bintaro'
      : 'surabaya');

  const resolvedBranches: ResolvedContactBranch[] = data.branches.map(
    (branch) => {
      const canReadClientBranches = branch.id !== null || hydrated;
      const live =
        canReadClientBranches && !isBranchesError
          ? activeBranches.find((item) => item.code === branch.code)
          : undefined;
      return {
        ...branch,
        liveBranch: live ?? null,
        name: live?.name ?? branch.name,
        whatsappNumber: live?.whatsappNumber ?? branch.whatsappNumber,
        address: live ? live.address : branch.address,
        mapsUrl: live ? live.mapsUrl : branch.mapsUrl,
      };
    },
  );

  const selectedB2bBranch =
    resolvedBranches.find((item) => item.code === activeBranchCode) ??
    resolvedBranches[0];

  return (
    <main id={SITE_COPY.MAIN_ID} className={cn('content-page-main', className)}>
      <section
        className="content-container content-section"
        aria-labelledby="contact-hero-heading"
      >
        <PageHeader
          className="content-header-block"
          titleId="contact-hero-heading"
          titleClassName="editorial-display"
          subtitleClassName="editorial-lead"
          badges={
            <div className="home-badge-row">
              <Badge tone="accent">{CONTENT_COPY.CONTACT_EYEBROW}</Badge>
            </div>
          }
          title={CONTENT_COPY.CONTACT_HEADING}
          subtitle={CONTENT_COPY.CONTACT_SUBTITLE}
        />

        {data.status === 'fallback' || isBranchesError ? (
          <Feedback
            tone="info"
            title={SITE_COPY.CONTACT_FALLBACK}
            announce
            className="content-feedback-banner"
          />
        ) : null}
      </section>

      <section
        className="content-container content-section"
        aria-labelledby="contact-branches-heading"
      >
        <SectionHeader
          titleId="contact-branches-heading"
          title={CONTENT_COPY.CONTACT_BRANCHES_TITLE}
        />
        <div className="home-find-us-grid">
          {resolvedBranches.map((branch) => {
            const isSelected = Boolean(
              branch.liveBranch && branch.liveBranch.id === selected?.id,
            );
            return (
              <ContactBranchCard
                key={branch.code}
                branch={branch}
                isSelected={isSelected}
                onSelect={(liveBranch) => void switchBranch(liveBranch)}
              />
            );
          })}
        </div>
      </section>

      <section
        id="custom-business"
        className="content-container content-section"
        aria-labelledby="contact-b2b-heading"
      >
        <ContactB2bCard
          title={data.customBusiness.title}
          body={data.customBusiness.body}
          source={data.customBusiness.source}
          activeBranchCode={activeBranchCode}
          branches={resolvedBranches}
          selectedBranch={selectedB2bBranch}
          topic={b2bTopic}
          onBranchChange={(nextCode) => {
            setB2bBranchOverride(nextCode);
            const targetLive = activeBranches.find(
              (item) => item.code === nextCode,
            );
            if (targetLive) {
              void switchBranch(targetLive);
            }
          }}
          onTopicChange={setB2bTopic}
        />
      </section>

      <ContactOfficialChannels
        email={data.email}
        instagramUrl={data.instagramUrl}
      />
    </main>
  );
}
