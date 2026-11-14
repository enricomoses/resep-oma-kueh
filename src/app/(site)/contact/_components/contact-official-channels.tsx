import { Globe, Mail } from 'lucide-react';
import { SectionHeader } from '@/components/common/layout/section-header';
import { Card } from '@/components/ui/card';
import { CONTENT_COPY } from '@/constants/content.constant';
import { cn } from '@/utils';

interface ContactOfficialChannelsProps {
  email: string;
  instagramUrl: string;
  className?: string;
}

export function ContactOfficialChannels({
  email,
  instagramUrl,
  className,
}: ContactOfficialChannelsProps) {
  return (
    <section
      className={cn('content-container content-section', className)}
      aria-labelledby="contact-channels-heading"
    >
      <SectionHeader
        titleId="contact-channels-heading"
        title={CONTENT_COPY.CONTACT_OFFICIAL_CHANNELS_TITLE}
      />
      <div className="content-channels-grid">
        <Card className="content-channel-card">
          <h3>
            <Mail size={18} aria-hidden="true" />
            <span>{CONTENT_COPY.CONTACT_EMAIL_LABEL}</span>
          </h3>
          <p>
            <a href={`mailto:${email}`} className="ui-link">
              {email}
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
              href={instagramUrl}
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
  );
}
