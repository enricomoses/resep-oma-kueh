import { SITE_COPY } from '@/constants/site.constant';
import { cn } from '@/utils';

interface PreparingViewProps {
  title: string;
  className?: string;
}
export function PreparingView({ title, className }: PreparingViewProps) {
  return (
    <main
      id={SITE_COPY.MAIN_ID}
      tabIndex={-1}
      className={cn('content-container preparing-view', className)}
    >
      <h1 className="editorial-heading">{title}</h1>
      <p>{SITE_COPY.PREPARING}</p>
      <p>{SITE_COPY.PREPARING_BODY}</p>
    </main>
  );
}
