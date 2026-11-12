import { ArrowDown } from 'lucide-react';

import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { cn } from '@/utils';

import { MediaPlaceholder } from './media-placeholder';

interface FoundationViewProps {
  className?: string;
}
export function FoundationView({ className }: FoundationViewProps) {
  return (
    <main className={cn('content-container', className)}>
      <header className="foundation-header">
        <div>
          <p className="foundation-brand">{FOUNDATION_COPY.BRAND}</p>
          <span className="foundation-logo-note">
            {FOUNDATION_COPY.LOGO_NOTE}
          </span>
        </div>
        <Badge tone="accent">{FOUNDATION_COPY.STATUS}</Badge>
      </header>
      <section className="foundation-hero" aria-labelledby="foundation-title">
        <div>
          <h1 className="foundation-title" id="foundation-title" lang="en">
            {FOUNDATION_COPY.TITLE}
          </h1>
          <p className="foundation-intro">{FOUNDATION_COPY.INTRO}</p>
          <ActionLink
            href={FOUNDATION_COPY.NOTES_HREF}
            variant="primary"
            size="lg"
          >
            {FOUNDATION_COPY.ACTION}
            <ArrowDown size={18} aria-hidden="true" />
          </ActionLink>
        </div>
        <MediaPlaceholder />
      </section>
      <section
        id={FOUNDATION_COPY.NOTES_ID}
        className="foundation-notes"
        aria-labelledby="foundation-notes-title"
      >
        <h2 id="foundation-notes-title" className="editorial-heading">
          {FOUNDATION_COPY.NOTES_TITLE}
        </h2>
        <div className="foundation-note-copy">
          <p>{FOUNDATION_COPY.NOTES_BODY}</p>
          <p>{FOUNDATION_COPY.NOTES_DETAIL}</p>
        </div>
      </section>
      <p className="foundation-signoff">{FOUNDATION_COPY.SIGNOFF}</p>
    </main>
  );
}
