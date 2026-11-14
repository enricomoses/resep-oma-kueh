'use client';

import { Send, Square } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type RefObject,
} from 'react';

import { Button } from '@/components/ui/button';
import { CHAT_COPY, CHAT_LIMITS } from '@/constants/chat.constant';
import { cn } from '@/utils';

const MAX_TEXTAREA_HEIGHT_PX = 104;

interface AskOmaComposerProps {
  value: string;
  onChange: (nextValue: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isSending: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  className?: string;
}

export function AskOmaComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isSending,
  textareaRef,
  className,
}: AskOmaComposerProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !isSending && value.trim().length > 0;

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      if (textareaRef) {
        textareaRef.current = node;
      }
    },
    [textareaRef],
  );

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [value]);

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
      <div className="chat-composer-box">
        <textarea
          ref={setRefs}
          id="ask-oma-input"
          className="chat-composer-textarea"
          rows={1}
          maxLength={CHAT_LIMITS.MAX_MESSAGE_LENGTH}
          placeholder={CHAT_COPY.COMPOSER_PLACEHOLDER}
          aria-label={CHAT_COPY.COMPOSER_LABEL}
          aria-describedby="ask-oma-composer-hint"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="chat-composer-actions">
          {isSending ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="chat-composer-send"
              aria-label={CHAT_COPY.STOP_CTA}
              onClick={onStop}
            >
              <Square size={14} aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="chat-composer-send"
              aria-label={CHAT_COPY.SEND_CTA}
              disabled={!canSend}
            >
              <Send size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      <p id="ask-oma-composer-hint" className="chat-composer-hint">
        {CHAT_COPY.COMPOSER_HINT}
      </p>
    </form>
  );
}
