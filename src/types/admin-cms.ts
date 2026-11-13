import type { z } from 'zod';

import type {
  adminCmsContentStatusSchema,
  adminCmsEntrySchema,
  adminCmsListResponseSchema,
  adminFaqItemSchema,
  adminFaqListResponseSchema,
  adminPublishingStatusSchema,
  adminTestimonialItemSchema,
  adminTestimonialListResponseSchema,
  archiveAdminCmsEntityInputSchema,
  createAdminFaqInputSchema,
  createAdminTestimonialInputSchema,
  saveAdminCmsInputSchema,
  updateAdminFaqInputSchema,
  updateAdminTestimonialInputSchema,
} from '@/validations/admin-cms.schema';

export type AdminCmsContentStatus = z.infer<typeof adminCmsContentStatusSchema>;
export type AdminPublishingStatus = z.infer<typeof adminPublishingStatusSchema>;
export type AdminCmsEntry = z.infer<typeof adminCmsEntrySchema>;
export type AdminCmsListResponse = z.infer<typeof adminCmsListResponseSchema>;
export type SaveAdminCmsInput = z.infer<typeof saveAdminCmsInputSchema>;

export type AdminFaqItem = z.infer<typeof adminFaqItemSchema>;
export type AdminFaqListResponse = z.infer<typeof adminFaqListResponseSchema>;
export type CreateAdminFaqInput = z.infer<typeof createAdminFaqInputSchema>;
export type UpdateAdminFaqInput = z.infer<typeof updateAdminFaqInputSchema>;
export type ArchiveAdminCmsEntityInput = z.infer<
  typeof archiveAdminCmsEntityInputSchema
>;

export type AdminTestimonialItem = z.infer<typeof adminTestimonialItemSchema>;
export type AdminTestimonialListResponse = z.infer<
  typeof adminTestimonialListResponseSchema
>;
export type CreateAdminTestimonialInput = z.infer<
  typeof createAdminTestimonialInputSchema
>;
export type UpdateAdminTestimonialInput = z.infer<
  typeof updateAdminTestimonialInputSchema
>;
