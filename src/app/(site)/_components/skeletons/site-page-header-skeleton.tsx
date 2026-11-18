import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/page-sections.css';
import { cn } from '@/utils';

interface SitePageHeaderSkeletonProps {
  subtitleLines?: 0 | 1 | 2 | 3;
  actionCount?: 0 | 1 | 2;
  hasAside?: boolean;
  hasBadge?: boolean;
  compactTitle?: boolean;
  className?: string;
}

/** Mirrors PageHeader across public routes (display/heading title, lead lines, optional aside pill & CTAs). */
export function SitePageHeaderSkeleton({
  subtitleLines = 2,
  actionCount = 0,
  hasAside = false,
  hasBadge = false,
  compactTitle = false,
  className,
}: SitePageHeaderSkeletonProps) {
  const subtitleWidths = [
    'min(36rem, 96%)',
    'min(31rem, 84%)',
    'min(24rem, 68%)',
  ];
  const actionWidths = ['13.5rem', '11.5rem'];

  return (
    <div
      className={cn(
        'content-header-block',
        hasAside && 'content-header-block--split',
        className,
      )}
    >
      <div
        className={cn(
          'w-full min-w-0',
          hasAside && 'content-header-row--split',
        )}
      >
        <div className="site-skel-page-header-copy">
          <Skeleton
            width={compactTitle ? 'min(18rem, 72%)' : 'min(26rem, 86%)'}
            height={
              compactTitle
                ? 'clamp(1.75rem, 2.8vw, 2.5rem)'
                : 'clamp(2rem, 3.8vw, 3.25rem)'
            }
          />
          {subtitleLines > 0 ? (
            <div className="site-skel-stack-sm">
              {Array.from({ length: subtitleLines }, (_, idx) => (
                <Skeleton
                  key={idx}
                  width={subtitleWidths[idx] ?? 'min(28rem, 80%)'}
                  height="1rem"
                />
              ))}
            </div>
          ) : null}
        </div>

        {hasAside ? (
          <Skeleton width="11.5rem" height="2.25rem" radius="pill" />
        ) : null}
      </div>

      {hasBadge ? (
        <Skeleton width="15rem" height="1.875rem" radius="pill" />
      ) : null}

      {actionCount > 0 ? (
        <div className="home-hero-actions">
          {Array.from({ length: actionCount }, (_, idx) => (
            <Skeleton
              key={idx}
              width={actionWidths[idx] ?? '11.5rem'}
              height="2.75rem"
              radius="pill"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
