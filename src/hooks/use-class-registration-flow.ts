'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { CLASSES_COPY, CLASSES_LIMITS } from '@/constants/classes.constant';
import { ApiClientError } from '@/lib/errors';
import type {
  ClassRegistrationFormValues,
  PrepareClassRegistrationResult,
  PublicClassSession,
} from '@/types/classes';
import { classRegistrationFormSchema } from '@/validations/classes.schema';

import { usePrepareClassRegistration } from './use-classes';

interface UseClassRegistrationFlowParams {
  registerableSessions: readonly PublicClassSession[];
  branchCode: string | null;
}

/**
 * Coordinates baking class registration form validation, handoff preparation, and message copying.
 */
export function useClassRegistrationFlow({
  registerableSessions,
  branchCode,
}: UseClassRegistrationFlowParams) {
  const [preparedEntry, setPreparedEntry] = useState<{
    key: string;
    result: PrepareClassRegistrationResult;
  } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copyFeedbackEntry, setCopyFeedbackEntry] = useState<{
    key: string;
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const prepareMutation = usePrepareClassRegistration();
  const defaultSessionId = registerableSessions[0]?.id ?? '';

  const form = useForm<ClassRegistrationFormValues>({
    resolver: zodResolver(classRegistrationFormSchema),
    defaultValues: {
      sessionId: defaultSessionId,
      attendeeCount: 1,
      adultContactName: '',
      manualConfirmed: false,
    },
  });

  const watchedSessionId = useWatch({
    control: form.control,
    name: 'sessionId',
  });
  const watchedAttendees = useWatch({
    control: form.control,
    name: 'attendeeCount',
  });
  const watchedAdultName = useWatch({
    control: form.control,
    name: 'adultContactName',
  });
  const watchedManualConfirmed = useWatch({
    control: form.control,
    name: 'manualConfirmed',
  });

  const currentInputKey = `${watchedSessionId}|${watchedAttendees}|${watchedAdultName}|${branchCode ?? ''}`;
  const prepared =
    preparedEntry && preparedEntry.key === currentInputKey
      ? preparedEntry.result
      : null;
  const copyFeedback =
    copyFeedbackEntry && copyFeedbackEntry.key === currentInputKey
      ? { tone: copyFeedbackEntry.tone, text: copyFeedbackEntry.text }
      : null;

  useEffect(() => {
    if (
      registerableSessions.length > 0 &&
      !registerableSessions.some((session) => session.id === watchedSessionId)
    ) {
      form.setValue('sessionId', registerableSessions[0]!.id);
    }
  }, [registerableSessions, watchedSessionId, form]);

  const activeSession =
    registerableSessions.find((session) => session.id === watchedSessionId) ??
    registerableSessions[0] ??
    null;

  const maxSeatsAllowed = activeSession
    ? Math.min(
        activeSession.seatsLeft ?? activeSession.capacity,
        CLASSES_LIMITS.MAX_ATTENDEES_PER_REGISTRATION,
      )
    : CLASSES_LIMITS.MAX_ATTENDEES_PER_REGISTRATION;

  async function onSubmit(values: ClassRegistrationFormValues) {
    if (prepareMutation.isPending) return;
    setServerError(null);
    setCopyFeedbackEntry(null);
    const submitKey = `${values.sessionId}|${values.attendeeCount}|${values.adultContactName}|${branchCode ?? ''}`;

    try {
      const result = await prepareMutation.mutateAsync({
        sessionId: values.sessionId,
        attendeeCount: values.attendeeCount,
        adultContactName: values.adultContactName.trim() || null,
      });
      setPreparedEntry({ key: submitKey, result });
    } catch (err) {
      setPreparedEntry(null);
      if (err instanceof ApiClientError) {
        setServerError(err.message);
        return;
      }
      setServerError(CLASSES_COPY.WA_ERRORS.UPSTREAM_ERROR);
    }
  }

  async function handleCopyMessage() {
    if (!prepared) return;
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(prepared.whatsappMessage);
      setCopyFeedbackEntry({
        key: currentInputKey,
        tone: 'success',
        text: CLASSES_COPY.COPY_SUCCESS,
      });
    } catch {
      setCopyFeedbackEntry({
        key: currentInputKey,
        tone: 'error',
        text: CLASSES_COPY.COPY_FAILURE,
      });
    }
  }

  return {
    form,
    watchedSessionId,
    watchedAttendees,
    watchedAdultName,
    watchedManualConfirmed,
    activeSession,
    maxSeatsAllowed,
    prepared,
    serverError,
    copyFeedback,
    isPending: prepareMutation.isPending,
    onSubmitForm: form.handleSubmit(onSubmit),
    handleCopyMessage: () => {
      void handleCopyMessage();
    },
  };
}
