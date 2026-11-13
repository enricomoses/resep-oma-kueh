'use client';

import dynamic from 'next/dynamic';

const LazyAskOmaWidget = dynamic(
  () =>
    import('@/components/chat/ask-oma-widget').then(
      (module) => module.AskOmaWidget,
    ),
  { ssr: false },
);

interface ChatSlotProps {
  className?: string;
}

export function ChatSlot({ className }: ChatSlotProps) {
  return <LazyAskOmaWidget className={className} />;
}
