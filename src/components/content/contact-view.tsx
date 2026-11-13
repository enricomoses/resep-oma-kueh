'use client';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CONTENT_COPY } from '@/constants/content.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { cn } from '@/utils';
import type { ContactPageData, PublicBranchHour } from '@/types/content';

const DAY_LABELS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

function formatBranchHour(hour: PublicBranchHour) {
  const day = DAY_LABELS[hour.dayOfWeek] ?? `Hari ${hour.dayOfWeek}`;
  if (hour.isClosed) {
    return `${day}: Tutup${hour.note ? ` (${hour.note})` : ''}`;
  }
  const timeRange =
    hour.opensAt && hour.closesAt
      ? `${hour.opensAt}–${hour.closesAt}`
      : 'Sesuai konfirmasi';
  return `${day}: ${timeRange}${hour.note ? ` (${hour.note})` : ''}`;
}

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

interface ContactViewProps {
  data: ContactPageData;
  className?: string;
}

export function ContactView({ data, className }: ContactViewProps) {
  const {
    items: activeBranches,
    selected,
    code,
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

  const resolvedBranches = data.branches.map((branch) => {
    const live = !isBranchesError
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
  });

  const selectedB2bBranch =
    resolvedBranches.find((item) => item.code === activeBranchCode) ??
    resolvedBranches[0];

  const b2bWhatsappHref = buildB2bWhatsappUrl(
    selectedB2bBranch.whatsappNumber,
    selectedB2bBranch.name,
    b2bTopic,
  );

  return (
    <main id={SITE_COPY.MAIN_ID} className={cn('content-page-main', className)}>
      <section
        className="content-container content-section"
        aria-labelledby="contact-hero-heading"
      >
        <div className="content-header-block">
          <div className="home-badge-row">
            <Badge tone="accent">{CONTENT_COPY.CONTACT_EYEBROW}</Badge>
          </div>
          <h1 id="contact-hero-heading" className="editorial-display">
            {CONTENT_COPY.CONTACT_HEADING}
          </h1>
          <p className="editorial-lead">{CONTENT_COPY.CONTACT_SUBTITLE}</p>
        </div>

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
        <div className="home-section-header">
          <div>
            <h2 id="contact-branches-heading" className="editorial-heading">
              {CONTENT_COPY.CONTACT_BRANCHES_TITLE}
            </h2>
          </div>
        </div>
        <div className="home-find-us-grid">
          {resolvedBranches.map((branch) => {
            const isSelected = Boolean(
              branch.liveBranch && branch.liveBranch.id === selected?.id,
            );
            const branchDescription =
              branch.code === 'surabaya'
                ? CONTENT_COPY.CONTACT_SURABAYA_DESC
                : CONTENT_COPY.CONTACT_BINTARO_DESC;

            return (
              <Card key={branch.code} className="content-branch-card">
                <div className="home-branch-card-header">
                  <h3>Cabang {branch.name}</h3>
                  {isSelected ? (
                    <Badge tone="success">
                      <CheckCircle2 size={14} aria-hidden="true" />
                      Cabang Aktif
                    </Badge>
                  ) : null}
                </div>
                <p className="content-card-desc">{branchDescription}</p>

                <dl className="content-detail-list">
                  <div className="content-detail-item">
                    <dt>
                      <Phone size={16} aria-hidden="true" />
                      <span>WhatsApp Resmi</span>
                    </dt>
                    <dd>
                      <a
                        href={`https://wa.me/${branch.whatsappNumber}`}
                        className="ui-link"
                      >
                        {CONTENT_COPY.CONTACT_WA_CTA_PREFIX} {branch.name} (+
                        {branch.whatsappNumber})
                      </a>
                    </dd>
                  </div>

                  <div className="content-detail-item">
                    <dt>
                      <MapPin size={16} aria-hidden="true" />
                      <span>{CONTENT_COPY.CONTACT_ADDRESS_LABEL}</span>
                    </dt>
                    <dd>
                      {branch.address ?? CONTENT_COPY.CONTACT_ADDRESS_PENDING}
                    </dd>
                  </div>

                  <div className="content-detail-item">
                    <dt>
                      <ExternalLink size={16} aria-hidden="true" />
                      <span>{CONTENT_COPY.CONTACT_MAPS_LABEL}</span>
                    </dt>
                    <dd>
                      {branch.mapsUrl ? (
                        <a
                          href={branch.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ui-link"
                        >
                          {CONTENT_COPY.CONTACT_MAPS_CTA} {branch.name}
                        </a>
                      ) : (
                        <span>{CONTENT_COPY.CONTACT_MAPS_PENDING}</span>
                      )}
                    </dd>
                  </div>

                  <div className="content-detail-item">
                    <dt>
                      <Clock size={16} aria-hidden="true" />
                      <span>{CONTENT_COPY.CONTACT_HOURS_LABEL}</span>
                    </dt>
                    <dd>
                      {branch.hours.length > 0 ? (
                        <ul className="content-hours-list">
                          {branch.hours.map((hour) => (
                            <li key={hour.id}>{formatBranchHour(hour)}</li>
                          ))}
                        </ul>
                      ) : (
                        <span>{CONTENT_COPY.CONTACT_HOURS_PENDING}</span>
                      )}
                    </dd>
                  </div>
                </dl>

                {branch.liveBranch ? (
                  <div className="home-branch-actions">
                    <Button
                      variant={isSelected ? 'secondary' : 'primary'}
                      disabled={isSelected}
                      onClick={() => {
                        if (branch.liveBranch) {
                          void switchBranch(branch.liveBranch);
                        }
                      }}
                    >
                      {isSelected
                        ? `Cabang ${branch.name} Terpilih`
                        : `Pilih Cabang ${branch.name}`}
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>

      <section
        id="custom-business"
        className="content-container content-section"
        aria-labelledby="contact-b2b-heading"
      >
        <Card tone="cream" className="content-b2b-card">
          <div className="content-b2b-header">
            <div className="home-badge-row">
              <Badge tone="accent">{CONTENT_COPY.CONTACT_B2B_BADGE}</Badge>
              <Badge
                tone={
                  data.customBusiness.source === 'published'
                    ? 'success'
                    : 'neutral'
                }
              >
                {data.customBusiness.source === 'published'
                  ? CONTENT_COPY.SOURCE_PUBLISHED_BADGE
                  : CONTENT_COPY.SOURCE_TEMPLATE_BADGE}
              </Badge>
            </div>
            <h2 id="contact-b2b-heading" className="editorial-heading">
              {data.customBusiness.title}
            </h2>
            <p className="home-story-body">{data.customBusiness.body}</p>
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
                    setB2bBranchOverride(nextCode);
                    const targetLive = activeBranches.find(
                      (item) => item.code === nextCode,
                    );
                    if (targetLive) {
                      void switchBranch(targetLive);
                    }
                  }}
                >
                  {resolvedBranches.map((branch) => (
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
                  value={b2bTopic}
                  onChange={(event) => setB2bTopic(event.target.value)}
                />
              )}
            </FormField>

            <div className="home-inline-actions">
              <a
                href={b2bWhatsappHref}
                className="ui-button ui-button--primary"
              >
                <MessageCircle size={18} aria-hidden="true" />
                {CONTENT_COPY.CONTACT_B2B_CTA_PREFIX} {selectedB2bBranch.name}
              </a>
            </div>
          </div>
        </Card>
      </section>

      <section
        className="content-container content-section"
        aria-labelledby="contact-channels-heading"
      >
        <div className="home-section-header">
          <div>
            <h2 id="contact-channels-heading" className="editorial-heading">
              {CONTENT_COPY.CONTACT_OFFICIAL_CHANNELS_TITLE}
            </h2>
          </div>
        </div>
        <div className="content-channels-grid">
          <Card className="content-channel-card">
            <h3>
              <Mail size={18} aria-hidden="true" />
              <span>{CONTENT_COPY.CONTACT_EMAIL_LABEL}</span>
            </h3>
            <p>
              <a href={`mailto:${data.email}`} className="ui-link">
                {data.email}
              </a>
            </p>
          </Card>

          <Card className="content-channel-card">
            <h3>
              <Globe size={18} aria-hidden="true" />
              <span>{CONTENT_COPY.CONTACT_INSTAGRAM_LABEL}</span>
            </h3>
            <p>
              <a
                href={data.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-link"
              >
                @resepoma.kueh di Instagram
              </a>
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
