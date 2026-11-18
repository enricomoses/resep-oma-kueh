import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/components/page-sections.css';
import { cn } from '@/utils';

interface SiteSectionHeaderSkeletonProps {
  subtitleLines?: 0 | 1 | 2;
  hasAction?: boolean;
  actionWidth?: string;
  className?: string;
}

/** Mirrors SectionHeader with heading, optional subtitle lines, and optional action pill. */
export function SiteSectionHeaderSkeleton({
  subtitleLines = 1,
  hasAction = false,
  actionWidth = '11.5rem',
  className,
}: SiteSectionHeaderSkeletonProps) {
  const subtitleWidths = ['min(34rem, 94%)', 'min(24rem, 72%)'];

  return (
    <div className={cn('home-section-header', className)}>
      <div className="site-skel-section-header-copy">
        <Skeleton
          width="min(18rem, 74%)"
          height="clamp(1.75rem, 2.8vw, 2.5rem)"
        />
        {subtitleLines > 0 ? (
          <div className="site-skel-stack-xs">
            {Array.from({ length: subtitleLines }, (_, idx) => (
              <Skeleton
                key={idx}
                width={subtitleWidths[idx] ?? 'min(26rem, 78%)'}
                height="0.9375rem"
              />
            ))}
          </div>
        ) : null}
      </div>

      {hasAction ? (
        <Skeleton width={actionWidth} height="2.75rem" radius="pill" />
      ) : null}
    </div>
  );
}
