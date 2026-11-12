import 'server-only';
import { HOME_CMS_DEFAULTS } from '@/constants/home.constant';
import { FOUNDATION_COPY } from '@/constants/ui.constant';
import {
  cmsEditorialPayloadSchema,
  cmsHeroPayloadSchema,
  cmsInstagramPayloadSchema,
  homeCategorySchema,
  homeContentBundleSchema,
  homeFeaturedProductSchema,
  homePageDataSchema,
  homePromotionSchema,
  homeTestimonialSchema,
  homeUpcomingSessionSchema,
} from '@/validations/home.schema';
import type { HomePageData, HomeSectionResult } from '@/types/home';
import {
  readActivePromotions,
  readFeaturedProducts,
  readPublishedCategories,
  readPublishedHomeContent,
  readPublishedTestimonials,
  readUpcomingClassSessions,
} from './repository.server';

interface GetHomeDataOptions {
  now?: Date;
}

async function resolveSection<T>(
  loader: () => Promise<T>,
): Promise<HomeSectionResult<T>> {
  try {
    return { status: 'success', data: await loader() };
  } catch {
    return { status: 'error' };
  }
}

export async function getHomeData(
  options: GetHomeDataOptions = {},
  signal?: AbortSignal,
): Promise<HomePageData> {
  const nowMs = (options.now ?? new Date()).getTime();

  const [
    content,
    categories,
    featuredProducts,
    promotions,
    upcomingClasses,
    testimonials,
  ] = await Promise.all([
    resolveSection(async () => {
      const rows = await readPublishedHomeContent(signal);
      const map = new Map(
        rows
          .filter((row) => row.status === 'published')
          .map((row) => [row.key, row.content_json]),
      );

      const heroParsed = cmsHeroPayloadSchema.safeParse(map.get('home.hero'));
      const storyParsed = cmsEditorialPayloadSchema.safeParse(
        map.get('home.story'),
      );
      const customBusinessParsed = cmsEditorialPayloadSchema.safeParse(
        map.get('home.custom_business'),
      );
      const classPromoParsed = cmsEditorialPayloadSchema.safeParse(
        map.get('home.class_promo'),
      );
      const instagramParsed = cmsInstagramPayloadSchema.safeParse(
        map.get('community.instagram'),
      );

      return homeContentBundleSchema.parse({
        hero: {
          headline: heroParsed.success
            ? heroParsed.data.headline
            : HOME_CMS_DEFAULTS.HERO.headline,
          subcopy: heroParsed.success
            ? heroParsed.data.subcopy
            : HOME_CMS_DEFAULTS.HERO.subcopy,
          imageAlt:
            heroParsed.success && heroParsed.data.image_alt
              ? heroParsed.data.image_alt
              : HOME_CMS_DEFAULTS.HERO.imageAlt,
        },
        story: {
          title: storyParsed.success
            ? storyParsed.data.title
            : HOME_CMS_DEFAULTS.STORY.title,
          body: storyParsed.success
            ? storyParsed.data.body
            : HOME_CMS_DEFAULTS.STORY.body,
          imageAlt:
            storyParsed.success && storyParsed.data.image_alt
              ? storyParsed.data.image_alt
              : HOME_CMS_DEFAULTS.STORY.imageAlt,
        },
        customBusiness: {
          title: customBusinessParsed.success
            ? customBusinessParsed.data.title
            : HOME_CMS_DEFAULTS.CUSTOM_BUSINESS.title,
          body: customBusinessParsed.success
            ? customBusinessParsed.data.body
            : HOME_CMS_DEFAULTS.CUSTOM_BUSINESS.body,
        },
        classPromo: {
          title: classPromoParsed.success
            ? classPromoParsed.data.title
            : HOME_CMS_DEFAULTS.CLASS_PROMO.title,
          body: classPromoParsed.success
            ? classPromoParsed.data.body
            : HOME_CMS_DEFAULTS.CLASS_PROMO.body,
        },
        instagram: {
          url: instagramParsed.success
            ? instagramParsed.data.url
            : HOME_CMS_DEFAULTS.INSTAGRAM.url,
        },
      });
    }),
    resolveSection(async () => {
      const rows = await readPublishedCategories(signal);
      return rows
        .filter((row) => row.status === 'published')
        .map((row) =>
          homeCategorySchema.parse({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            sortOrder: row.sort_order,
          }),
        );
    }),
    resolveSection(async () => {
      const rows = await readFeaturedProducts(signal);
      return rows
        .filter((row) => row.status === 'published' && row.is_featured)
        .map((row) => {
          const categoryLinks = Array.isArray(row.product_categories)
            ? row.product_categories
            : [];
          const primaryLink =
            categoryLinks.find(
              (link) =>
                link.is_primary && link.categories?.status === 'published',
            ) ??
            categoryLinks.find(
              (link) => link.categories?.status === 'published',
            );
          const primaryCategory = primaryLink?.categories
            ? {
                name: primaryLink.categories.name,
                slug: primaryLink.categories.slug,
              }
            : null;
          const images = Array.isArray(row.product_images)
            ? row.product_images
            : [];
          const primaryImage =
            images.find((img) => img.is_primary && img.alt_text) ??
            images.find((img) => Boolean(img.alt_text));

          return homeFeaturedProductSchema.parse({
            id: row.id,
            name: row.name,
            slug: row.slug,
            shortDescription: row.short_description,
            description: row.description,
            productType: row.product_type,
            isBestSeller: row.is_best_seller,
            isNew: row.is_new,
            primaryCategory,
            imageAlt: primaryImage?.alt_text ?? FOUNDATION_COPY.MEDIA_CAPTION,
          });
        });
    }),
    resolveSection(async () => {
      const rows = await readActivePromotions(signal);
      return rows
        .filter((row) => {
          if (row.status !== 'published' || !row.is_enabled) return false;
          const startsMs = Date.parse(row.starts_at);
          const endsMs = Date.parse(row.ends_at);
          if (Number.isNaN(startsMs) || Number.isNaN(endsMs)) return false;
          return startsMs <= nowMs && nowMs < endsMs;
        })
        .map((row) => {
          const branchRows = Array.isArray(row.promotion_branches)
            ? row.promotion_branches
            : [];
          return homePromotionSchema.parse({
            id: row.id,
            title: row.title,
            slug: row.slug,
            description: row.description,
            discountType: row.discount_type,
            discountValue: Number(row.discount_value),
            minSpendIdr: row.min_spend_idr,
            maxDiscountIdr: row.max_discount_idr,
            scope: row.scope,
            startsAt: row.starts_at,
            endsAt: row.ends_at,
            branchIds: branchRows.map((item) => item.branch_id),
          });
        });
    }),
    resolveSection(async () => {
      const rows = await readUpcomingClassSessions(signal);
      return rows
        .filter((row) => {
          if (row.status !== 'scheduled' || !row.is_registration_open) {
            return false;
          }
          if (row.seats_left !== null && row.seats_left <= 0) return false;
          const startsMs = Date.parse(row.starts_at);
          if (Number.isNaN(startsMs) || startsMs <= nowMs) return false;
          if (row.registration_deadline_at !== null) {
            const deadlineMs = Date.parse(row.registration_deadline_at);
            if (Number.isNaN(deadlineMs) || deadlineMs < nowMs) return false;
          }
          const branch = row.branches;
          const program = row.class_programs;
          if (!branch || !branch.is_active) return false;
          if (!program || program.status !== 'published') return false;
          return true;
        })
        .map((row) => {
          const branch = row.branches!;
          const program = row.class_programs!;
          return homeUpcomingSessionSchema.parse({
            id: row.id,
            startsAt: row.starts_at,
            endsAt: row.ends_at,
            registrationDeadlineAt: row.registration_deadline_at,
            capacity: row.capacity,
            seatsLeft: row.seats_left,
            branch: {
              id: branch.id,
              code: branch.code,
              name: branch.name,
              city: branch.city,
            },
            program: {
              id: program.id,
              title: program.title,
              slug: program.slug,
              shortDescription: program.short_description,
              description: program.description ?? program.title,
              ageMin: program.age_min,
              ageMax: program.age_max,
              durationMinutes: program.duration_minutes,
              coverAlt: program.cover_alt_text ?? FOUNDATION_COPY.MEDIA_CAPTION,
            },
          });
        });
    }),
    resolveSection(async () => {
      const rows = await readPublishedTestimonials(signal);
      return rows
        .filter((row) => row.status === 'published')
        .map((row) =>
          homeTestimonialSchema.parse({
            id: row.id,
            displayName: row.display_name,
            quote: row.quote,
            rating: row.rating,
            sourceLabel: row.source_label ?? 'Pelanggan Resep Oma Kueh',
          }),
        );
    }),
  ]);

  return homePageDataSchema.parse({
    content,
    categories,
    featuredProducts,
    promotions,
    upcomingClasses,
    testimonials,
  });
}
