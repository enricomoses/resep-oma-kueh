import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { BRANCH } from '@/constants/site.constant';
import { requestApi } from '@/lib/axios';
import { branchDirectorySchema } from '@/validations/branch.schema';

export function readBranches(code: string | null, signal?: AbortSignal) {
  return requestApi(
    {
      url: API_ENDPOINTS.BRANCHES,
      method: 'GET',
      params: code === null ? undefined : { [BRANCH.PARAM]: code },
      signal,
    },
    branchDirectorySchema,
  );
}
