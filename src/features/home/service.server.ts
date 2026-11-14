import 'server-only';
import { HOME_CMS_DEFAULTS, HOME_LIMITS } from '@/constants/home.constant';
import { FOUNDATION_COPY } from '@/constants/ui.constant';
import { computeVariantEffectivePrice } from '@/features/catalog/pricing';
import type { PricingPromotionInput } from '@/features/catalog/pricing';
import { pickApprovedPrimaryProductImage } from '@/features/catalog/repository.server';
import { getCategories } from '@/features/catalog/service.server';
import { resolvePublicClassCoverUrl } from '@/features/classes/repository.server';
import {
  readPublishedShippingBanner,
  resolvePublicBannerUrl,
} from '@/features/promotions/repository.server';
import { mapPublishedShippingBannerRow } from '@/features/promotions/service.server';
import {
  computeEffectiveClassPriceIdr,
  evaluateClassSessionAvailability,
  sortClassSessionsAscending,
} from '@/utils/classes';
import type { ClassSessionStatus } from '@/types/classes';
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
  readPublishedHomeContent,
  readPublishedTestimonials,
  readUpcomingClassSessions,
  resolvePublicBrandAssetUrl,
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
  const nowDate = options.now ?? new Date();
  const nowMs = nowDate.getTime();
  const rawPromotionsPromise = readActivePromotions(signal).catch(() => null);
  const rawShippingBannerPromise = readPublishedShippingBanner(signal).catch(
    () => null,
  );

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
          imageUrl:
            heroParsed.success && heroParsed.data.media_approved
              ? resolvePublicBrandAssetUrl(heroParsed.data.image_path)
              : null,
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
          imageUrl:
            storyParsed.success && storyParsed.data.media_approved
              ? resolvePublicBrandAssetUrl(storyParsed.data.image_path)
              : null,
        },
        customBusiness: {
          title: customBusinessParsed.success
            ? customBusinessParsed.data.title
            : HOME_CMS_DEFAULTS.CUSTOM_BUSINESS.title,
          body: customBusinessParsed.success
            ? customBusinessParsed.data.body
            : HOME_CMS_DEFAULTS.CUSTOM_BUSINESS.body,
          ...(customBusinessParsed.success &&
          customBusinessParsed.data.image_alt
            ? { imageAlt: customBusinessParsed.data.image_alt }
            : {}),
          imageUrl:
            customBusinessParsed.success &&
            customBusinessParsed.data.media_approved
              ? resolvePublicBrandAssetUrl(customBusinessParsed.data.image_path)
              : null,
        },
        classPromo: {
          title: classPromoParsed.success
            ? classPromoParsed.data.title
            : HOME_CMS_DEFAULTS.CLASS_PROMO.title,
          body: classPromoParsed.success
            ? classPromoParsed.data.body
            : HOME_CMS_DEFAULTS.CLASS_PROMO.body,
          ...(classPromoParsed.success && classPromoParsed.data.image_alt
            ? { imageAlt: classPromoParsed.data.image_alt }
            : {}),
          imageUrl:
            classPromoParsed.success && classPromoParsed.data.media_approved
              ? resolvePublicBrandAssetUrl(classPromoParsed.data.image_path)
              : null,
        },
        instagram: {
          url: instagramParsed.success
            ? instagramParsed.data.url
            : HOME_CMS_DEFAULTS.INSTAGRAM.url,
          items: instagramParsed.success
            ? instagramParsed.data.items.map((item) => ({
                imageUrl: item.media_approved
                  ? resolvePublicBrandAssetUrl(item.image_path)
                  : null,
                alt: item.alt,
                href: item.href,
              }))
            : [],
        },
      });
    }),
    resolveSection(async () => {
      const directory = await getCategories(signal);
      return directory.items.slice(0, HOME_LIMITS.SERIES).map((row) =>
        homeCategorySchema.parse({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          sortOrder: row.sortOrder,
        }),
      );
    }),
    resolveSection(async () => {
      const [rows, promoRows] = await Promise.all([
        readFeaturedProducts(signal),
        rawPromotionsPromise,
      ]);
      const pricingPromotions: PricingPromotionInput[] = Array.isArray(
        promoRows,
      )
        ? promoRows
            .filter(
              (p) =>
                (p.discount_type === 'percentage' ||
                  p.discount_type === 'fixed') &&
                (p.scope === 'all' ||
                  p.scope === 'category' ||
                  p.scope === 'product' ||
                  p.scope === 'variant') &&
                (p.status === 'draft' ||
                  p.status === 'published' ||
                  p.status === 'archived'),
            )
            .map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              discountType: p.discount_type as 'percentage' | 'fixed',
              discountValue: Number(p.discount_value),
              minSpendIdr: p.min_spend_idr,
              maxDiscountIdr: p.max_discount_idr,
              scope: p.scope as 'all' | 'category' | 'product' | 'variant',
              startsAt: p.starts_at,
              endsAt: p.ends_at,
              status: p.status as 'draft' | 'published' | 'archived',
              isEnabled: p.is_enabled,
              isStackable: Boolean(
                (p as { is_stackable?: boolean }).is_stackable,
              ),
              priority: p.priority,
              branchIds: Array.isArray(p.promotion_branches)
                ? p.promotion_branches.map((item) => item.branch_id)
                : [],
              categoryIds: Array.isArray(
                (p as { promotion_categories?: { category_id: string }[] })
                  .promotion_categories,
              )
                ? (
                    p as { promotion_categories: { category_id: string }[] }
                  ).promotion_categories.map((item) => item.category_id)
                : [],
              productIds: Array.isArray(
                (p as { promotion_products?: { product_id: string }[] })
                  .promotion_products,
              )
                ? (
                    p as { promotion_products: { product_id: string }[] }
                  ).promotion_products.map((item) => item.product_id)
                : [],
              variantIds: Array.isArray(
                (p as { promotion_variants?: { variant_id: string }[] })
                  .promotion_variants,
              )
                ? (
                    p as { promotion_variants: { variant_id: string }[] }
                  ).promotion_variants.map((item) => item.variant_id)
                : [],
            }))
        : [];
      return rows
        .filter(
          (row) =>
            row.status === 'published' &&
            row.is_featured &&
            (row as { needs_owner_review?: boolean | null })
              .needs_owner_review !== true,
        )
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
          const categoryIds = categoryLinks
            .filter((link) => link.categories?.status === 'published')
            .map(
              (link) =>
                link.category_id ??
                (link.categories as { id?: string } | null)?.id ??
                '',
            )
            .filter(Boolean);
          const { imageAlt, previewImageUrl } = pickApprovedPrimaryProductImage(
            row.product_images,
            FOUNDATION_COPY.MEDIA_CAPTION,
          );

          const branchFromPriceIdr: Record<string, number> = {};
          const branchPromotions: Record<
            string,
            { badgeTitle: string; originalFromPriceIdr: number }
          > = {};
          const variants = Array.isArray(row.product_variants)
            ? row.product_variants.filter((v) => v.status === 'active')
            : [];
          for (const variant of variants) {
            const offers = Array.isArray(variant.branch_variant_offers)
              ? variant.branch_variant_offers.filter((o) => o.is_listed)
              : [];
            const optionGroups = Array.isArray(variant.option_groups)
              ? variant.option_groups.map((g) => ({
                  id: g.id,
                  minSelect: g.min_select,
                  maxSelect: g.max_select,
                  isRequired: g.is_required,
                  choices: Array.isArray(g.option_choices)
                    ? g.option_choices.map((c) => ({
                        id: c.id,
                        priceDeltaIdr: c.price_delta_idr,
                        isActive: c.is_active,
                      }))
                    : [],
                }))
              : [];
            for (const offer of offers) {
              const evaluated = computeVariantEffectivePrice(
                {
                  basePriceIdr: variant.base_price_idr,
                  priceOverrideIdr: offer.price_override_idr,
                  optionGroups,
                },
                {
                  branchId: offer.branch_id,
                  productId: row.id,
                  variantId: variant.id,
                  categoryIds,
                },
                pricingPromotions,
                nowDate,
              );
              if (!evaluated) continue;
              const prev = branchFromPriceIdr[offer.branch_id];
              if (prev === undefined || evaluated.effectivePriceIdr < prev) {
                branchFromPriceIdr[offer.branch_id] =
                  evaluated.effectivePriceIdr;
                if (
                  evaluated.appliedPromotion &&
                  evaluated.unconditionalDiscountIdr > 0
                ) {
                  branchPromotions[offer.branch_id] = {
                    badgeTitle: evaluated.appliedPromotion.title,
                    originalFromPriceIdr: evaluated.unitGrossIdr,
                  };
                } else if (evaluated.conditionalPromotion) {
                  branchPromotions[offer.branch_id] = {
                    badgeTitle: evaluated.conditionalPromotion.title,
                    originalFromPriceIdr: evaluated.unitGrossIdr,
                  };
                } else {
                  delete branchPromotions[offer.branch_id];
                }
              }
            }
          }

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
            imageAlt,
            ...(previewImageUrl ? { imageUrl: previewImageUrl } : {}),
            ...(Object.keys(branchFromPriceIdr).length > 0
              ? { branchFromPriceIdr }
              : {}),
            ...(Object.keys(branchPromotions).length > 0
              ? { branchPromotions }
              : {}),
          });
        });
    }),
    resolveSection(async () => {
      const rows = await rawPromotionsPromise;
      if (!rows) throw new Error('Promotions read unavailable');
      return rows
        .filter((row) => {
          if (row.status !== 'published' || !row.is_enabled) return false;
          if ((row as { is_stackable?: boolean }).is_stackable) return false;
          const startsMs = Date.parse(row.starts_at);
          const endsMs = Date.parse(row.ends_at);
          if (Number.isNaN(startsMs) || Number.isNaN(endsMs)) return false;
          if (!(startsMs <= nowMs && nowMs < endsMs)) return false;
          const promoRow = row as {
            scope: string;
            promotion_categories?: { category_id: string }[] | null;
            promotion_products?: { product_id: string }[] | null;
            promotion_variants?: { variant_id: string }[] | null;
          };
          if (
            promoRow.scope === 'category' &&
            Array.isArray(promoRow.promotion_categories) &&
            promoRow.promotion_categories.length === 0
          ) {
            return false;
          }
          if (
            promoRow.scope === 'product' &&
            Array.isArray(promoRow.promotion_products) &&
            promoRow.promotion_products.length === 0
          ) {
            return false;
          }
          if (
            promoRow.scope === 'variant' &&
            Array.isArray(promoRow.promotion_variants) &&
            promoRow.promotion_variants.length === 0
          ) {
            return false;
          }
          return true;
        })
        .map((row) => {
          const branchRows = Array.isArray(row.promotion_branches)
            ? row.promotion_branches
            : [];
          const bannerPath =
            (row as { banner_image_path?: string | null }).banner_image_path ??
            null;
          const bannerImageUrl = resolvePublicBannerUrl(bannerPath);
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
            ...(bannerImageUrl ? { bannerImageUrl } : {}),
          });
        });
    }),
    resolveSection(async () => {
      const rows = await readUpcomingClassSessions(signal);
      const validSessions = rows
        .filter((row) => {
          const branch = row.branches;
          const program = row.class_programs as
            | (NonNullable<typeof row.class_programs> & {
                base_price_idr?: number | null;
                cover_image_path?: string | null;
                cover_storage_bucket?: string | null;
                cover_is_approved?: boolean | null;
                needs_owner_review?: boolean | null;
              })
            | null;
          const status = row.status as ClassSessionStatus;
          const programIsPublic =
            Boolean(program) &&
            program?.status === 'published' &&
            (program?.needs_owner_review ?? false) === false &&
            (program?.cover_is_approved ?? true);
          return evaluateClassSessionAvailability(
            {
              startsAt: row.starts_at,
              endsAt: row.ends_at,
              registrationDeadlineAt: row.registration_deadline_at,
              capacity: row.capacity,
              seatsLeft: row.seats_left,
              status,
              isRegistrationOpen: row.is_registration_open,
              branchIsActive: Boolean(branch?.is_active),
              programIsPublic,
            },
            nowMs,
          ).isRegisterable;
        })
        .map((row) => {
          const branch = row.branches!;
          const program = row.class_programs! as NonNullable<
            typeof row.class_programs
          > & {
            base_price_idr?: number | null;
            price_override_idr?: number | null;
            cover_image_path?: string | null;
            cover_storage_bucket?: string | null;
            cover_is_approved?: boolean | null;
          };
          const sessionRecord = row as typeof row & {
            price_override_idr?: number | null;
          };
          const coverImageUrl = resolvePublicClassCoverUrl(
            program.cover_storage_bucket,
            program.cover_image_path,
            program.cover_is_approved,
          );
          const effectivePriceIdr =
            typeof program.base_price_idr === 'number' &&
            program.base_price_idr > 0
              ? computeEffectiveClassPriceIdr(
                  program.base_price_idr,
                  sessionRecord.price_override_idr,
                )
              : undefined;

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
              ...(coverImageUrl ? { coverImageUrl } : {}),
            },
            ...(effectivePriceIdr ? { effectivePriceIdr } : {}),
          });
        });

      return sortClassSessionsAscending(validSessions);
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

  const shippingBanner = mapPublishedShippingBannerRow(
    await rawShippingBannerPromise,
  );

  return homePageDataSchema.parse({
    content,
    categories,
    featuredProducts,
    promotions,
    upcomingClasses,
    testimonials,
    ...(shippingBanner ? { shippingBanner } : {}),
  });
}
