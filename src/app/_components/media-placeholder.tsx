import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { cn } from '@/utils';

interface MediaPlaceholderProps {
  className?: string;
}
export function MediaPlaceholder({ className }: MediaPlaceholderProps) {
  return (
    <figure
      className={cn('media-placeholder', className)}
      aria-label={FOUNDATION_COPY.MEDIA_CAPTION}
    >
      <span className="media-placeholder-mark" aria-hidden="true">
        {FOUNDATION_COPY.MEDIA_MARK}
      </span>
      <figcaption className="media-placeholder-caption">
        {FOUNDATION_COPY.MEDIA_CAPTION}
      </figcaption>
    </figure>
  );
}
