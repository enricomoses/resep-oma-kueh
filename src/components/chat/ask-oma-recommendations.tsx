'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ChatItemLink } from '@/types/chat';
import { cn } from '@/utils';
import { isSafeChatHref } from '@/utils/chat';

interface AskOmaRecommendationsProps {
  items: readonly ChatItemLink[];
  className?: string;
}

export function AskOmaRecommendations({
  items,
  className,
}: AskOmaRecommendationsProps) {
  const safeItems = items.filter((item) => isSafeChatHref(item.href));
  if (safeItems.length === 0) {
    return null;
  }

  return (
    <ul className={cn('chat-reco-list', className)}>
      {safeItems.map((item, idx) => {
        const key = `${item.type}-${item.slug ?? item.href}-${idx}`;
        const body = (
          <>
            <span className="chat-reco-head">
              <strong className="chat-reco-title">{item.label}</strong>
              {item.priceLabel ? (
                <span className="chat-reco-price">{item.priceLabel}</span>
              ) : null}
            </span>
            {item.subtitle ? (
              <span className="chat-reco-subtitle">{item.subtitle}</span>
            ) : null}
            {item.badge ? (
              <span className="chat-reco-meta">
                <Badge tone="success">{item.badge}</Badge>
              </span>
            ) : null}
          </>
        );

        return (
          <li key={key} className="chat-reco-item">
            {item.type === 'whatsapp' ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-reco-link"
              >
                <span className="chat-reco-link-content">{body}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            ) : (
              <Link href={item.href} className="chat-reco-link">
                <span className="chat-reco-link-content">{body}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
