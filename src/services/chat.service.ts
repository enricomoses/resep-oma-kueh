import { CHAT_LIMITS } from '@/constants/chat.constant';
import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios/response-handler';
import type { ChatRequestInput } from '@/types/chat';
import { chatResponseDataSchema } from '@/validations/chat.schema';

export function sendChatMessageRequest(
  payload: ChatRequestInput,
  signal?: AbortSignal,
) {
  return requestApi(
    {
      method: 'POST',
      url: API_ENDPOINTS.CHAT,
      data: payload,
      signal,
      timeout: CHAT_LIMITS.TOTAL_CHAT_DEADLINE_MS + 2_000,
    },
    chatResponseDataSchema,
  );
}
