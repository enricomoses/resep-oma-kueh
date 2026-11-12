import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { cn } from '@/utils';

interface MediaPlaceholderProps {
  caption?: string;
  mark?: string;
  className?: string;
}
export function MediaPlaceholder({
  caption = FOUNDATION_COPY.MEDIA_CAPTION,
  mark = FOUNDATION_COPY.MEDIA_MARK,
  className,
}: MediaPlaceholderProps) {
  return (
    <figure className={cn('media-placeholder', className)} aria-label={caption}>
      <span className="media-placeholder-mark" aria-hidden="true">
        {mark}
      </span>
      <figcaption className="media-placeholder-caption">{caption}</figcaption>
    </figure>
  );
}
