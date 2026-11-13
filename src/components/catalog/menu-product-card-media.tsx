'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MediaPlaceholder } from '@/app/_components';
import { cn } from '@/utils';

interface MenuProductCardMediaProps {
  previewImageUrl?: string | null;
  imageAlt: string;
  placeholderCaption: string;
  className?: string;
}

export function MenuProductCardMedia({
  previewImageUrl = null,
  imageAlt,
  placeholderCaption,
  className,
}: MenuProductCardMediaProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const showImage =
    Boolean(previewImageUrl) && failedImageUrl !== previewImageUrl;

  if (showImage && previewImageUrl) {
    return (
      <div className={cn('home-card-media-box', className)}>
        <Image
          src={previewImageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="home-card-media-img"
          unoptimized
          onError={() => setFailedImageUrl(previewImageUrl)}
        />
      </div>
    );
  }

  return (
    <MediaPlaceholder
      caption={placeholderCaption}
      className={cn('home-card-media', className)}
    />
  );
}
