import axios from 'axios';

import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { LIMITS } from '@/constants/validation.constant';

export const axiosInstance = axios.create({
  baseURL: API_ENDPOINTS.BASE,
  timeout: LIMITS.REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});
