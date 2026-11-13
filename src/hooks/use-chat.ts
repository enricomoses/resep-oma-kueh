'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  CHAT_COPY,
  CHAT_LIMITS,
  CHAT_QUICK_PROMPTS,
} from '@/constants/chat.constant';
import { useBranches } from '@/hooks/use-branches';
import { ApiClientError } from '@/lib/errors';
import { sendChatMessageRequest } from '@/services/chat.service';
import type { ChatItemLink, ChatOperation, ChatSourceType } from '@/types/chat';

export interface ChatUiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  items?: ChatItemLink[];
  sourceType?: ChatSourceType;
  operation?: ChatOperation;
  notice?: string;
  branchName?: string | null;
  quickPrompts?: string[];
}

export interface ChatErrorState {
  code: string;
  message: string;
  lastFailedText: string;
}

export function useChat() {
  const {
    items: branches,
    selected: activeBranch,
    hydrated,
    isPending: branchPending,
  } = useBranches();
  const selectedBranchId = activeBranch?.id ?? null;
  const isBranchSettled = hydrated && branchPending !== true;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errorState, setErrorState] = useState<ChatErrorState | null>(null);
  const [branchNotice, setBranchNotice] = useState<string | null>(null);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([
    ...CHAT_QUICK_PROMPTS,
  ]);
  const [trackedBranchId, setTrackedBranchId] = useState<
    string | null | undefined
  >(undefined);
  const [hasInteracted, setHasInteracted] = useState(false);

  const inFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const generationIdRef = useRef(0);
  const prevBranchIdRef = useRef<string | null | undefined>(undefined);

  // Adjust React state cleanly during render once branch selection settles (avoids query-transition null flicker).
  if (isBranchSettled) {
    if (trackedBranchId === undefined) {
      setTrackedBranchId(selectedBranchId);
    } else if (trackedBranchId !== selectedBranchId) {
      setTrackedBranchId(selectedBranchId);
      if (hasInteracted || isSending || branchNotice !== null) {
        setHasInteracted(false);
        setIsSending(false);
        setErrorState(null);
        setMessages([]);
        setQuickPrompts([...CHAT_QUICK_PROMPTS]);
        if (selectedBranchId) {
          const branchLabel = activeBranch?.name ?? 'Cabang terpilih';
          setBranchNotice(CHAT_COPY.BRANCH_CHANGED_NOTICE(branchLabel));
        } else {
          setBranchNotice(CHAT_COPY.BRANCH_CLEARED_NOTICE);
        }
      }
    }
  }

  // Abort any in-flight request when settled active branch changes so late replies are discarded.
  useEffect(() => {
    if (!isBranchSettled) return;

    if (prevBranchIdRef.current === undefined) {
      prevBranchIdRef.current = selectedBranchId;
      return;
    }

    if (prevBranchIdRef.current === selectedBranchId) {
      return;
    }

    prevBranchIdRef.current = selectedBranchId;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    generationIdRef.current += 1;
    inFlightRef.current = false;
  }, [isBranchSettled, selectedBranchId]);

  // Abort any pending request on unmount.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const abortPending = useCallback(() => {
    if (!inFlightRef.current) return;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    generationIdRef.current += 1;
    inFlightRef.current = false;
    setIsSending(false);
    setBranchNotice(CHAT_COPY.CANCELED_NOTE);
  }, []);

  const resetConversation = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    generationIdRef.current += 1;
    inFlightRef.current = false;
    setHasInteracted(false);
    setIsSending(false);
    setMessages([]);
    setErrorState(null);
    setBranchNotice(null);
    setQuickPrompts([...CHAT_QUICK_PROMPTS]);
  }, []);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed || inFlightRef.current) {
        return false;
      }

      const boundedText =
        trimmed.length > CHAT_LIMITS.MAX_MESSAGE_LENGTH
          ? trimmed.slice(0, CHAT_LIMITS.MAX_MESSAGE_LENGTH)
          : trimmed;

      const genId = ++generationIdRef.current;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      inFlightRef.current = true;
      setHasInteracted(true);
      setIsSending(true);
      setErrorState(null);
      setBranchNotice(null);

      const historyPayload = messages
        .slice(-CHAT_LIMITS.MAX_HISTORY_ENTRIES)
        .map((m) => ({
          role: m.role,
          text: m.text.slice(0, CHAT_LIMITS.MAX_MESSAGE_LENGTH),
        }));

      const userMsgId = `u-${genId}-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          text: boundedText,
        },
      ]);

      try {
        const res = await sendChatMessageRequest(
          {
            message: boundedText,
            branchId: selectedBranchId ?? null,
            history: historyPayload,
          },
          controller.signal,
        );

        if (generationIdRef.current !== genId) {
          return false;
        }

        inFlightRef.current = false;
        abortControllerRef.current = null;
        setIsSending(false);

        const data = res.data;
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${genId}-${Date.now()}`,
            role: 'assistant',
            text: data.answer,
            items: data.items,
            sourceType: data.sourceType,
            operation: data.operation,
            notice: data.notice,
            branchName: data.branchName,
            quickPrompts: data.quickPrompts,
          },
        ]);

        if (data.quickPrompts && data.quickPrompts.length > 0) {
          setQuickPrompts(data.quickPrompts);
        }

        return true;
      } catch (err) {
        if (generationIdRef.current !== genId) {
          return false;
        }

        inFlightRef.current = false;
        abortControllerRef.current = null;
        setIsSending(false);

        if (err instanceof ApiClientError && err.code === 'CANCELED') {
          return false;
        }

        const errorCode =
          err instanceof ApiClientError ? err.code : 'NETWORK_ERROR';
        const errorMessage =
          err instanceof ApiClientError && err.message
            ? err.message
            : errorCode === 'TIMEOUT'
              ? CHAT_COPY.TIMEOUT_MESSAGE
              : CHAT_COPY.OUTAGE_MESSAGE;

        setErrorState({
          code: errorCode,
          message: errorMessage,
          lastFailedText: boundedText,
        });

        return false;
      }
    },
    [messages, selectedBranchId],
  );

  return {
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
  };
}
