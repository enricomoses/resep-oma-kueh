'use client';

import { MessageCircle, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModalSurface } from '@/components/ui/modal-surface';
import { CHAT_COPY } from '@/constants/chat.constant';
import { UI_COPY } from '@/constants/ui.constant';
import { useChat } from '@/hooks/use-chat';
import { cn } from '@/utils';

import { AskOmaComposer } from './ask-oma-composer';
import { AskOmaMessages } from './ask-oma-messages';

interface AskOmaWidgetProps {
  className?: string;
}

export function AskOmaWidget({ className }: AskOmaWidgetProps) {
  const {
    isOpen,
    setIsOpen,
    messages,
    isSending,
    errorState,
    branchNotice,
    quickPrompts,
    activeBranch,
    branches,
    sendMessage,
    abortPending,
    resetConversation,
  } = useChat();

  const [draft, setDraft] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isOpen && !isMobile) {
      requestAnimationFrame(() => {
        composerRef.current?.focus();
      });
    }
  }, [isOpen, isMobile]);

  function closePanel() {
    setIsOpen(false);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }

  function handleSendDraft() {
    const toSend = draft;
    if (!toSend.trim() || isSending) return;
    setDraft('');
    void sendMessage(toSend);
  }

  function handleQuickPrompt(prompt: string) {
    if (isSending) return;
    void sendMessage(prompt);
  }

  function handleRetry() {
    if (!errorState || isSending) return;
    void sendMessage(errorState.lastFailedText);
  }

  const branchBadgeText = activeBranch
    ? activeBranch.name
    : CHAT_COPY.NO_BRANCH_BADGE;

  const content = (
    <>
      <AskOmaMessages
        messages={messages}
        quickPrompts={quickPrompts}
        isSending={isSending}
        branchNotice={branchNotice}
        errorState={errorState}
        branches={branches}
        onSelectQuickPrompt={handleQuickPrompt}
        onRetry={handleRetry}
      />
      <AskOmaComposer
        value={draft}
        onChange={setDraft}
        onSubmit={handleSendDraft}
        onStop={abortPending}
        onReset={() => {
          setDraft('');
          resetConversation();
        }}
        isSending={isSending}
        hasMessages={messages.length > 0}
        textareaRef={composerRef}
      />
    </>
  );

  return (
    <div className={cn('chat-widget-root', className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="primary"
        size="md"
        className="chat-trigger"
        aria-expanded={isOpen}
        aria-controls={isMobile ? undefined : panelId}
        aria-haspopup={isMobile ? 'dialog' : undefined}
        onClick={() => {
          if (isOpen) {
            closePanel();
          } else {
            setIsOpen(true);
          }
        }}
      >
        <MessageCircle size={18} aria-hidden="true" />
        <span>{isOpen ? CHAT_COPY.TRIGGER_CLOSE : CHAT_COPY.TRIGGER_OPEN}</span>
      </Button>

      {isOpen && !isMobile ? (
        <section
          id={panelId}
          aria-label={CHAT_COPY.PANEL_LABEL}
          className="chat-panel"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              closePanel();
            }
          }}
        >
          <header className="chat-panel-header">
            <div className="chat-panel-heading">
              <div className="chat-panel-title-row">
                <h2 className="chat-panel-title">{CHAT_COPY.MOBILE_TITLE}</h2>
                <Badge tone={activeBranch ? 'accent' : 'neutral'}>
                  {branchBadgeText}
                </Badge>
              </div>
              <p className="chat-panel-subtitle">{CHAT_COPY.SUBTITLE}</p>
            </div>
            <div className="chat-panel-header-actions">
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="chat-icon-btn"
                aria-label={UI_COPY.CLOSE}
                onClick={closePanel}
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>
          </header>
          {content}
        </section>
      ) : null}

      {isMobile ? (
        <ModalSurface
          open={isOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closePanel();
            } else {
              setIsOpen(true);
            }
          }}
          kind="drawer"
          title={`${CHAT_COPY.MOBILE_TITLE} · ${branchBadgeText}`}
          description={CHAT_COPY.MOBILE_DESCRIPTION}
          initialFocusRef={composerRef}
          className="chat-mobile-modal"
        >
          {content}
        </ModalSurface>
      ) : null}
    </div>
  );
}
