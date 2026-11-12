import { DEMO_COPY } from '@/constants/copy.constant';
import { cn } from '@/utils';

interface DemoBannerProps {
  className?: string;
}

export function DemoBanner({ className }: DemoBannerProps) {
  return (
    <aside
      aria-label={DEMO_COPY.LABEL}
      className={cn('demo-banner', className)}
    >
      {DEMO_COPY.MESSAGE}
    </aside>
  );
}
