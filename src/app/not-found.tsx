import { ActionLink } from '@/components/ui/action-link';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes.constant';
import { BOUNDARY_COPY } from '@/constants/seo.constant';

export default function NotFound() {
  return (
    <main id="main-content" className="site-section py-20">
      <div className="content-container max-w-xl">
        <Card className="space-y-5 text-center" tone="surface">
          <p className="text-burgundy/80 font-mono text-xs tracking-[0.2em] uppercase">
            404
          </p>
          <h1 className="text-burgundy font-serif text-3xl">
            {BOUNDARY_COPY.NOT_FOUND_TITLE}
          </h1>
          <p className="text-sm text-ink/80">{BOUNDARY_COPY.NOT_FOUND_BODY}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <ActionLink href={ROUTES.HOME}>
              {BOUNDARY_COPY.NOT_FOUND_HOME_CTA}
            </ActionLink>
            <ActionLink href={ROUTES.MENU} variant="secondary">
              {BOUNDARY_COPY.NOT_FOUND_MENU_CTA}
            </ActionLink>
          </div>
        </Card>
      </div>
    </main>
  );
}
