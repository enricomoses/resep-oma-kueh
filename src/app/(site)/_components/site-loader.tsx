import { cn } from '@/utils';
import { OmaSilhouette } from '@/app/(site)/_components/oma-silhouette';
import '@/styles/layouts/site-loader.css';

interface SiteLoaderProps {
  label: string;
  leaving?: boolean;
  className?: string;
}

/** Full-screen first-visit loader: Oma's silhouette drawn in a CSS loop. */
export function SiteLoader({
  label,
  leaving = false,
  className,
}: SiteLoaderProps) {
  return (
    <div
      className={cn(
        'site-loader',
        leaving && 'site-loader--leaving',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <OmaSilhouette className="site-loader__art" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
