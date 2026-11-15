import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { BRANCH } from '@/constants/site.constant';
import { requestApi } from '@/lib/axios';
import { buildListParams } from '@/utils/api';
import { branchDirectorySchema } from '@/validations/branch.schema';

/** Public branch directory service. */
export const branchesService = {
  getAll: (code: string | null = null, signal?: AbortSignal) =>
    requestApi(
      {
        url: API_ENDPOINTS.BRANCHES,
        method: 'GET',
        params: buildListParams({ [BRANCH.PARAM]: code }),
        signal,
      },
      branchDirectorySchema,
    ),
};
