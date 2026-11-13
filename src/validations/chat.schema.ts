import { z } from 'zod';

import {
  CHAT_LIMITS,
  CHAT_OPERATIONS,
  CHAT_SOURCE_TYPES,
} from '@/constants/chat.constant';
import { isSafeChatHref } from '@/utils/chat';

const chatRoleSchema = z.enum(['user', 'assistant']);

const chatOperationSchema = z.enum(CHAT_OPERATIONS);

const chatSourceTypeSchema = z.enum(CHAT_SOURCE_TYPES);

const chatHistoryEntrySchema = z.strictObject({
  role: chatRoleSchema,
  text: z.string().trim().min(1).max(CHAT_LIMITS.MAX_MESSAGE_LENGTH),
});

export const chatRequestSchema = z.strictObject({
  message: z.string().trim().min(1).max(CHAT_LIMITS.MAX_MESSAGE_LENGTH),
  branchId: z.uuid().nullable().optional().default(null),
  history: z
    .array(chatHistoryEntrySchema)
    .max(CHAT_LIMITS.MAX_HISTORY_ENTRIES)
    .optional()
    .default([]),
});

export const chatPlanSchema = z.discriminatedUnion('operation', [
  z.strictObject({
    operation: z.literal('search_products'),
    query: z.string().max(CHAT_LIMITS.MAX_SEARCH_CHARS),
    dietSlug: z.string().max(40).nullable(),
    limit: z.int().min(1).max(CHAT_LIMITS.MAX_ITEMS),
  }),
  z.strictObject({
    operation: z.literal('recommend_by_budget'),
    maxPriceIdr: z.int().positive().max(1_000_000_000),
    query: z.string().max(CHAT_LIMITS.MAX_SEARCH_CHARS),
    dietSlug: z.string().max(40).nullable(),
    limit: z.int().min(1).max(CHAT_LIMITS.MAX_ITEMS),
  }),
  z.strictObject({
    operation: z.literal('get_product_detail'),
    query: z.string().min(1).max(CHAT_LIMITS.MAX_SEARCH_CHARS),
  }),
  z.strictObject({
    operation: z.literal('get_active_promotions'),
    limit: z.int().min(1).max(CHAT_LIMITS.MAX_ITEMS),
  }),
  z.strictObject({
    operation: z.literal('get_branches'),
  }),
  z.strictObject({
    operation: z.literal('get_upcoming_classes'),
    limit: z.int().min(1).max(CHAT_LIMITS.MAX_ITEMS),
  }),
  z.strictObject({
    operation: z.literal('search_faqs'),
    query: z.string().max(CHAT_LIMITS.MAX_SEARCH_CHARS),
    limit: z.int().min(1).max(CHAT_LIMITS.MAX_ITEMS),
  }),
  z.strictObject({
    operation: z.literal('clarify'),
    reason: z.enum(['ambiguous', 'branch_required_for_price']),
  }),
  z.strictObject({
    operation: z.literal('refuse'),
    reason: z.enum([
      'mutation_or_admin',
      'order_or_payment_tracking',
      'secret_or_internal',
    ]),
  }),
]);

export const chatItemLinkSchema = z.strictObject({
  type: z.enum(['product', 'class', 'whatsapp', 'route']),
  slug: z.string().min(1).max(160).optional(),
  href: z
    .string()
    .min(1)
    .max(512)
    .refine(isSafeChatHref, 'Unsafe chat link target'),
  label: z.string().min(1).max(200),
  subtitle: z.string().max(240).optional(),
  priceLabel: z.string().max(120).optional(),
  badge: z.string().max(80).optional(),
});

export const generativeAnswerOutputSchema = z.strictObject({
  answer: z.string().trim().min(1).max(CHAT_LIMITS.MAX_ANSWER_LENGTH),
});

export const chatResponseDataSchema = z.strictObject({
  answer: z.string().min(1).max(CHAT_LIMITS.MAX_ANSWER_LENGTH),
  items: z.array(chatItemLinkSchema).max(CHAT_LIMITS.MAX_ITEMS),
  sourceType: chatSourceTypeSchema,
  operation: chatOperationSchema,
  branchId: z.uuid().nullable(),
  branchName: z.string().max(100).nullable(),
  notice: z.string().min(1).max(400),
  quickPrompts: z.array(z.string().min(1).max(160)).max(6).optional(),
  coverage: z.strictObject({
    totalMatched: z.int().nonnegative(),
    returned: z.int().nonnegative().max(CHAT_LIMITS.MAX_ITEMS),
    truncated: z.boolean(),
  }),
});
