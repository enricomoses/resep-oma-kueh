import { BOUNDARY_COPY } from '@/constants/seo.constant';

export default function SiteLoading() {
  return (
    <section
      className="site-section py-16"
      role="status"
      aria-live="polite"
      aria-label={BOUNDARY_COPY.LOADING_LABEL}
    >
      <div className="content-container space-y-6">
        <div className="bg-burgundy/10 h-8 w-56 animate-pulse rounded-md" />
        <div className="bg-burgundy/10 h-4 w-full max-w-xl animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-burgundy/5 h-48 animate-pulse rounded-xl" />
          <div className="bg-burgundy/5 h-48 animate-pulse rounded-xl" />
          <div className="bg-burgundy/5 h-48 animate-pulse rounded-xl" />
        </div>
        <span className="sr-only">{BOUNDARY_COPY.LOADING_LABEL}</span>
      </div>
    </section>
  );
}
