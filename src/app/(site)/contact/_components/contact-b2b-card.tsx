'use client';

import { MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CONTENT_COPY } from '@/constants/content.constant';
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
    <Card className={cn('content-b2b-card', className)}>
      <div className="content-b2b-intro">
        <h2 id="contact-b2b-heading" className="content-b2b-title">
          {title}
        </h2>
        <p className="content-b2b-desc">{body}</p>
        <p className="content-b2b-note">{CONTENT_COPY.CONTACT_B2B_NOTE}</p>
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

        <div className="content-b2b-actions">
          <a
            href={b2bWhatsappHref}
            className="ui-button ui-button--primary w-full justify-center sm:w-auto"
          >
            <MessageCircle size={18} aria-hidden="true" />
            {CONTENT_COPY.CONTACT_B2B_CTA_PREFIX} {selectedBranch.name}
          </a>
        </div>
      </div>
    </Card>
  );
}
