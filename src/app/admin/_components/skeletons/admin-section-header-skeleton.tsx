import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils';

interface AdminSectionHeaderSkeletonProps {
  buttonCount?: 0 | 1 | 2 | 3;
  hasBackLink?: boolean;
  className?: string;
}

/** Mirrors AdminSectionHeader with title, subtitle, optional back link, and action buttons. */
export function AdminSectionHeaderSkeleton({
  buttonCount = 1,
  hasBackLink = false,
  className,
}: AdminSectionHeaderSkeletonProps) {
  const buttonWidths = ['7.5rem', '10.5rem', '9.5rem'];

  return (
    <div className={cn('admin-section-header', className)}>
      <div className="admin-skel-header-copy">
        {hasBackLink ? (
          <Skeleton width="10.5rem" height="1.75rem" radius="pill" />
        ) : null}
        <Skeleton width="min(18rem, 70%)" height="1.875rem" radius="sm" />
        <Skeleton width="min(34rem, 95%)" height="1rem" radius="sm" />
      </div>

      {buttonCount > 0 ? (
        <div className="admin-inline-actions">
          {Array.from({ length: buttonCount }, (_, idx) => (
            <Skeleton
              key={idx}
              width={buttonWidths[idx] ?? '8.5rem'}
              height="2.375rem"
              radius="pill"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
