import type { z } from 'zod';
import type {
  contactPageDataSchema,
  publicBranchHourSchema,
  publicCmsEntrySchema,
  publicCmsKeySchema,
  publicContentDirectorySchema,
  publicFaqDirectorySchema,
} from '@/validations/content.schema';

export type PublicCmsKey = z.infer<typeof publicCmsKeySchema>;
export type PublicCmsEntry = z.infer<typeof publicCmsEntrySchema>;
export type PublicContentDirectory = z.infer<
  typeof publicContentDirectorySchema
>;
export type PublicFaqDirectory = z.infer<typeof publicFaqDirectorySchema>;
export type PublicBranchHour = z.infer<typeof publicBranchHourSchema>;
export type ContactPageData = z.infer<typeof contactPageDataSchema>;

export type ContentInitial<T> =
  { status: 'success'; data: T } | { status: 'error' };
