import { ApiClientError } from '@/lib/errors';

export interface ParsedAdminMutationError {
  message: string;
  fields: Record<string, string[]>;
  status?: number;
  isConflict: boolean;
}

/**
 * Normalizes API client errors thrown by admin mutations into banner and field-level feedback.
 */
export function extractAdminMutationError(
  error: unknown,
  fallbackMessage: string,
): ParsedAdminMutationError {
  if (error instanceof ApiClientError) {
    return {
      message: error.message || fallbackMessage,
      fields: error.fieldErrors ?? {},
      status: error.status,
      isConflict: error.status === 409,
    };
  }
  if (error instanceof Error && error.message) {
    return {
      message: error.message,
      fields: {},
      isConflict: false,
    };
  }
  return {
    message: fallbackMessage,
    fields: {},
    isConflict: false,
  };
}
