import type { z } from 'zod';

import type {
  CHAT_OPERATIONS,
  CHAT_SOURCE_TYPES,
} from '@/constants/chat.constant';
import type {
  chatItemLinkSchema,
  chatPlanSchema,
  chatRequestSchema,
  chatResponseDataSchema,
} from '@/validations/chat.schema';

export type ChatOperation = (typeof CHAT_OPERATIONS)[number];
export type ChatSourceType = (typeof CHAT_SOURCE_TYPES)[number];
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type ChatPlan = z.infer<typeof chatPlanSchema>;
export type ChatItemLink = z.infer<typeof chatItemLinkSchema>;
export type ChatResponseData = z.infer<typeof chatResponseDataSchema>;
