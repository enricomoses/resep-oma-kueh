import { CHAT_LIMITS } from '@/constants/chat.constant';
import { API_ENDPOINTS } from '@/constants/endpoint.constant';
import { requestApi } from '@/lib/axios';
import type { ChatRequestInput } from '@/types/chat';
import { chatResponseDataSchema } from '@/validations/chat.schema';

/** Ask Oma bakery assistant chat service. */
export const chatService = {
  sendMessage: (payload: ChatRequestInput, signal?: AbortSignal) =>
    requestApi(
      {
        method: 'POST',
        url: API_ENDPOINTS.CHAT,
        data: payload,
        signal,
        timeout: CHAT_LIMITS.TOTAL_CHAT_DEADLINE_MS + 2_000,
      },
      chatResponseDataSchema,
    ),
};
