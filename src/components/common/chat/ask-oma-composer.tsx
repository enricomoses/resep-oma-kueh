'use client';

import { RotateCcw, Send, Square } from 'lucide-react';
import type { KeyboardEvent, RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { CHAT_COPY, CHAT_LIMITS } from '@/constants/chat.constant';
import { cn } from '@/utils';

interface AskOmaComposerProps {
  value: string;
  onChange: (nextValue: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onReset: () => void;
  isSending: boolean;
  hasMessages: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  className?: string;
}

export function AskOmaComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  onReset,
  isSending,
  hasMessages,
  textareaRef,
  className,
}: AskOmaComposerProps) {
  const canSend = !isSending && value.trim().length > 0;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      event.nativeEvent.keyCode !== 229
    ) {
      event.preventDefault();
      if (canSend) {
        onSubmit();
      }
    }
  }

  return (
    <form
      className={cn('chat-composer', className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) {
          onSubmit();
        }
      }}
    >
      <label htmlFor="ask-oma-input" className="site-visually-hidden">
        {CHAT_COPY.COMPOSER_LABEL}
      </label>
      <textarea
        ref={textareaRef}
        id="ask-oma-input"
        className="ui-control chat-composer-textarea"
        rows={2}
        maxLength={CHAT_LIMITS.MAX_MESSAGE_LENGTH}
        placeholder={CHAT_COPY.COMPOSER_PLACEHOLDER}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-describedby="ask-oma-composer-hint"
      />
      <div className="chat-composer-footer">
        <span id="ask-oma-composer-hint" className="chat-composer-hint">
          {CHAT_COPY.COMPOSER_HINT} ({value.length}/
          {CHAT_LIMITS.MAX_MESSAGE_LENGTH})
        </span>
        <div className="chat-composer-actions">
          {isSending ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onStop}
            >
              <Square size={14} aria-hidden="true" />
              {CHAT_COPY.STOP_CTA}
            </Button>
          ) : null}

          {hasMessages || isSending ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onReset}
              aria-label={CHAT_COPY.RESET_CTA}
            >
              <RotateCcw size={14} aria-hidden="true" />
              {CHAT_COPY.RESET_CTA}
            </Button>
          ) : null}

          <Button type="submit" variant="primary" size="md" disabled={!canSend}>
            <Send size={14} aria-hidden="true" />
            {isSending ? CHAT_COPY.SENDING_CTA : CHAT_COPY.SEND_CTA}
          </Button>
        </div>
      </div>
    </form>
  );
}
