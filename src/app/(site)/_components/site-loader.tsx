import { cn } from '@/utils';
import { OmaSilhouette } from '@/app/(site)/_components/oma-silhouette';
import '@/styles/layouts/site-loader.css';

interface SiteLoaderProps {
  label: string;
  className?: string;
}

/** Full-screen first-visit loader: Oma's silhouette drawn in a CSS loop. */
export function SiteLoader({ label, className }: SiteLoaderProps) {
  return (
    <div
      className={cn('site-loader', className)}
      role="status"
      aria-live="polite"
    >
      <OmaSilhouette className="site-loader__art" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
