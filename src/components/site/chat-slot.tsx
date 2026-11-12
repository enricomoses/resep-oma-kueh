'use client';
import { MessageCircle } from 'lucide-react';
import { SITE_COPY } from '@/constants/site.constant';
import { cn } from '@/utils';

interface ChatSlotProps {
  className?: string;
}
export function ChatSlot({ className }: ChatSlotProps) {
  return (
    <aside className={cn('chat-slot', className)} aria-label={SITE_COPY.CHAT}>
      <MessageCircle size={20} aria-hidden="true" />
      <div>
        <strong>{SITE_COPY.CHAT}</strong>
        <p>{SITE_COPY.CHAT_PENDING}</p>
      </div>
    </aside>
  );
}
