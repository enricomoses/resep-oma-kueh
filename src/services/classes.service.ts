import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type { PrepareClassRegistrationInput } from '@/types/classes';
import { buildListParams } from '@/utils/api';
import {
  prepareClassRegistrationDataSchema,
  publicClassDetailDataSchema,
  publicClassesListDataSchema,
} from '@/validations/classes.schema';

/** Public baking classes listing, program detail, and registration preparation service. */
export const classesService = {
  getAll: (branchCode: string | null = null, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.CLASSES,
        method: 'GET',
        params: buildListParams({ branch: branchCode }),
        signal,
      },
      publicClassesListDataSchema,
    ),

  getBySlug: (
    slug: string,
    branchCode: string | null = null,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.CLASS_DETAIL(slug),
        method: 'GET',
        params: buildListParams({ branch: branchCode }),
        signal,
      },
      publicClassDetailDataSchema,
    ),

  prepareRegistration: (
    payload: PrepareClassRegistrationInput,
    signal?: AbortSignal,
  ) =>
    requestApi(
      {
        url: API_ENDPOINTS.CLASSES_PREPARE_REGISTRATION,
        method: 'POST',
        data: payload,
        signal,
      },
      prepareClassRegistrationDataSchema,
    ),
};
