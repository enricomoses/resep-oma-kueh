'use client';

import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CONTENT_COPY } from '@/constants/content.constant';
import type { ContactPageData } from '@/types/content';
import { cn } from '@/utils';
import type { ResolvedContactBranch } from './contact-branch-card';

function buildB2bWhatsappUrl(
  whatsappNumber: string,
  branchName: string,
  topic: string,
) {
  const cleanedTopic = topic.trim().slice(0, 240);
  const message = cleanedTopic
    ? `Halo Admin Resep Oma Kueh ${branchName}, saya ingin berdiskusi mengenai kebutuhan B2B / Custom Product (${cleanedTopic}). Mohon informasi ketersediaan dan alur konsultasinya.`
    : `Halo Admin Resep Oma Kueh ${branchName}, saya ingin berdiskusi mengenai kebutuhan B2B / Custom Product (Made for Your Business). Mohon informasi ketersediaan dan alur konsultasinya.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

interface ContactB2bCardProps {
  title: string;
  body: string;
  source: ContactPageData['customBusiness']['source'];
  activeBranchCode: 'surabaya' | 'bintaro';
  branches: ResolvedContactBranch[];
  selectedBranch: ResolvedContactBranch;
  topic: string;
  onBranchChange: (code: 'surabaya' | 'bintaro') => void;
  onTopicChange: (topic: string) => void;
  className?: string;
}

export function ContactB2bCard({
  title,
  body,
  source,
  activeBranchCode,
  branches,
  selectedBranch,
  topic,
  onBranchChange,
  onTopicChange,
  className,
}: ContactB2bCardProps) {
  const b2bWhatsappHref = buildB2bWhatsappUrl(
    selectedBranch.whatsappNumber,
    selectedBranch.name,
    topic,
  );

  return (
    <Card tone="cream" className={cn('content-b2b-card', className)}>
      <div className="content-b2b-header">
        <div className="home-badge-row">
          <Badge tone="accent">{CONTENT_COPY.CONTACT_B2B_BADGE}</Badge>
          <Badge tone={source === 'published' ? 'success' : 'neutral'}>
            {source === 'published'
              ? CONTENT_COPY.SOURCE_PUBLISHED_BADGE
              : CONTENT_COPY.SOURCE_TEMPLATE_BADGE}
          </Badge>
        </div>
        <h2 id="contact-b2b-heading" className="editorial-heading">
          {title}
        </h2>
        <p className="home-story-body">{body}</p>
      </div>

      <div className="content-b2b-controls">
        <FormField
          id="contact-b2b-branch"
          label={CONTENT_COPY.CONTACT_B2B_BRANCH_LABEL}
        >
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={activeBranchCode}
              onChange={(event) => {
                const nextCode =
                  event.target.value === 'bintaro' ? 'bintaro' : 'surabaya';
                onBranchChange(nextCode);
              }}
            >
              {branches.map((branch) => (
                <option key={branch.code} value={branch.code}>
                  {branch.name} (+{branch.whatsappNumber})
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField
          id="contact-b2b-topic"
          label={CONTENT_COPY.CONTACT_B2B_TOPIC_LABEL}
          helper={CONTENT_COPY.CONTACT_B2B_NOTE}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="text"
              maxLength={240}
              placeholder={CONTENT_COPY.CONTACT_B2B_TOPIC_PLACEHOLDER}
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
            />
          )}
        </FormField>

        <div className="home-inline-actions">
          <a href={b2bWhatsappHref} className="ui-button ui-button--primary">
            <MessageCircle size={18} aria-hidden="true" />
            {CONTENT_COPY.CONTACT_B2B_CTA_PREFIX} {selectedBranch.name}
          </a>
        </div>
      </div>
    </Card>
  );
}
