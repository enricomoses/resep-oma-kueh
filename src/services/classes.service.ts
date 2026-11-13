import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type { PrepareClassRegistrationInput } from '@/types/classes';
import {
  prepareClassRegistrationDataSchema,
  publicClassDetailDataSchema,
  publicClassesListDataSchema,
} from '@/validations/classes.schema';

export function readPublicClassesRequest(
  branchCode: string | null,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.CLASSES,
      method: 'GET',
      params: branchCode ? { branch: branchCode } : undefined,
      signal,
    },
    publicClassesListDataSchema,
  );
}

export function readPublicClassDetailRequest(
  slug: string,
  branchCode: string | null,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: `${API_ENDPOINTS.CLASSES}/${encodeURIComponent(slug)}`,
      method: 'GET',
      params: branchCode ? { branch: branchCode } : undefined,
      signal,
    },
    publicClassDetailDataSchema,
  );
}

export function prepareClassRegistrationRequest(
  payload: PrepareClassRegistrationInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      url: API_ENDPOINTS.CLASSES_PREPARE_REGISTRATION,
      method: 'POST',
      data: payload,
      signal,
    },
    prepareClassRegistrationDataSchema,
  );
}
