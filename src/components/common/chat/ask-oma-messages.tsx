'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { CHAT_COPY } from '@/constants/chat.constant';
import { ROUTES } from '@/constants/routes.constant';
import type { ChatErrorState, ChatUiMessage } from '@/hooks/use-chat';
import type { PublicBranch } from '@/types/branch';
import { cn } from '@/utils';

import { AskOmaQuickPrompts } from './ask-oma-quick-prompts';
import { AskOmaRecommendations } from './ask-oma-recommendations';

interface AskOmaMessagesProps {
  messages: readonly ChatUiMessage[];
  quickPrompts: readonly string[];
  isSending: boolean;
  branchNotice: string | null;
  errorState: ChatErrorState | null;
  branches: readonly PublicBranch[];
  onSelectQuickPrompt: (prompt: string) => void;
  onRetry: () => void;
  className?: string;
}

export function AskOmaMessages({
  messages,
  quickPrompts,
  isSending,
  branchNotice,
  errorState,
  branches,
  onSelectQuickPrompt,
  onRetry,
  className,
}: AskOmaMessagesProps) {
  const waContacts = branches
    .map((b) => ({
      id: b.id,
      label: `WhatsApp ${b.name}`,
      digits: b.whatsappNumber.replace(/\D/g, ''),
    }))
    .filter((entry) => entry.digits.length >= 8);

  return (
    <div
      className={cn('chat-messages', className)}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="chat-bubble chat-bubble--assistant">
        <p className="chat-bubble-text">{CHAT_COPY.WELCOME}</p>
        {messages.length === 0 ? (
          <AskOmaQuickPrompts
            prompts={quickPrompts}
            ariaLabel="Pertanyaan cepat"
            keyPrefix="welcome"
            disabled={isSending}
            onSelect={onSelectQuickPrompt}
          />
        ) : null}
      </div>

      {branchNotice ? (
        <p className="chat-status-banner" role="status">
          {branchNotice}
        </p>
      ) : null}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            'chat-bubble',
            msg.role === 'user'
              ? 'chat-bubble--user'
              : 'chat-bubble--assistant',
          )}
        >
          <p className="chat-bubble-text">{msg.text}</p>

          {msg.role === 'assistant' && msg.items && msg.items.length > 0 ? (
            <AskOmaRecommendations items={msg.items} />
          ) : null}

          {msg.role === 'assistant' &&
          msg.quickPrompts &&
          msg.quickPrompts.length > 0 ? (
            <AskOmaQuickPrompts
              prompts={msg.quickPrompts}
              ariaLabel="Saran lanjutan"
              keyPrefix={msg.id}
              disabled={isSending}
              onSelect={onSelectQuickPrompt}
            />
          ) : null}

          {msg.role === 'assistant' && msg.notice ? (
            <p className="chat-bubble-notice">{msg.notice}</p>
          ) : null}
        </div>
      ))}

      {isSending ? (
        <p className="chat-status-banner" role="status">
          {CHAT_COPY.SENDING_CTA}
        </p>
      ) : null}

      {errorState ? (
        <div className="chat-error-block" role="alert">
          <Feedback tone="error" title="Ask Oma tidak dapat menjawab">
            {errorState.message}
          </Feedback>
          <div className="chat-error-actions">
            <Button
              size="md"
              variant="secondary"
              disabled={isSending}
              onClick={onRetry}
            >
              {CHAT_COPY.RETRY_CTA}
            </Button>
            {waContacts.length > 0 ? (
              waContacts.map((wa) => (
                <a
                  key={wa.id}
                  href={`https://wa.me/${wa.digits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-fallback-link"
                >
                  {wa.label}
                </a>
              ))
            ) : (
              <Link href={ROUTES.CONTACT} className="chat-fallback-link">
                Hubungi Admin Cabang
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
