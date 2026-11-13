import { BOUNDARY_COPY } from '@/constants/seo.constant';

export default function AdminLoading() {
  return (
    <section
      className="admin-auth-page py-16"
      role="status"
      aria-live="polite"
      aria-label={BOUNDARY_COPY.ADMIN_LOADING_LABEL}
    >
      <div className="content-container space-y-4">
        <div className="bg-burgundy/10 h-7 w-48 animate-pulse rounded-md" />
        <div className="bg-burgundy/5 h-64 w-full animate-pulse rounded-xl" />
        <span className="sr-only">{BOUNDARY_COPY.ADMIN_LOADING_LABEL}</span>
      </div>
    </section>
  );
}
