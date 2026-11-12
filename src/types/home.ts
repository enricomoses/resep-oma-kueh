import type { z } from 'zod';
import type {
  homeCategorySchema,
  homeFeaturedProductSchema,
  homePageDataSchema,
  homePromotionSchema,
  homeTestimonialSchema,
  homeUpcomingSessionSchema,
} from '@/validations/home.schema';

export type HomeCategory = z.infer<typeof homeCategorySchema>;
export type HomeFeaturedProduct = z.infer<typeof homeFeaturedProductSchema>;
export type HomePromotion = z.infer<typeof homePromotionSchema>;
export type HomeUpcomingSession = z.infer<typeof homeUpcomingSessionSchema>;
export type HomeTestimonial = z.infer<typeof homeTestimonialSchema>;
export type HomePageData = z.infer<typeof homePageDataSchema>;

export type HomeSectionResult<T> =
  { status: 'success'; data: T } | { status: 'error' };
