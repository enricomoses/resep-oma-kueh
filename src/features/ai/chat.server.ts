import 'server-only';

import { getServerEnvironment } from '@/config/environment.server';
import { EnvironmentConfigurationError } from '@/config/parse-environment';
import {
  CHAT_COPY,
  CHAT_LIMITS,
  CHAT_OPERATIONS,
  CHAT_QUICK_PROMPTS,
} from '@/constants/chat.constant';
import { ROUTES } from '@/constants/routes.constant';
import {
  ChatGenerativeQuotaError,
  ChatLimiterUnavailableError,
  ChatServerError,
  ChatTimeoutError,
  ChatUpstreamError,
} from '@/features/ai/errors.server';
import {
  type ExternalLimiterStore,
  type GenerativeLimiterLease,
  reserveGenerativeSlot,
} from '@/features/ai/generative-limiter.server';
import {
  createGeminiChatProvider,
  type GenerativeChatProvider,
} from '@/features/ai/generative-provider.server';
import {
  readChatActiveBranches,
  readChatActivePromotionsData,
  readChatPublishedFaqsData,
  readChatPublishedProductsAndPromotions,
  readChatUpcomingClassesData,
} from '@/features/ai/retrieval.server';
import type {
  ChatItemLink,
  ChatPlan,
  ChatRequestInput,
  ChatResponseData,
} from '@/types/chat';
import { formatJakartaDateTimeDisplay } from '@/utils/admin-promotions';
import {
  computeVariantEffectivePrice,
  type PricingPromotionInput,
} from '@/utils/catalog-pricing';
import {
  buildSearchTokens,
  extractChatMonetaryValues,
  extractDietarySlugFromQuery,
  normalizeChatMatchText,
  parseIdrBudgetFromQuery,
  sanitizeChatDisplayText,
  truncateChatAnswer,
  verifyAndSanitizeGenerativeAnswer,
} from '@/utils/chat';
import { formatWhatsappDigits } from '@/utils/checkout';
import {
  computeEffectiveClassPriceIdr,
  evaluateClassSessionAvailability,
  formatClassScheduleJakarta,
} from '@/utils/classes';
import { formatIdr } from '@/utils/currency';
import {
  chatPlanSchema,
  chatResponseDataSchema,
  generativeAnswerOutputSchema,
} from '@/validations/chat.schema';

const REFUSE_MUTATION_REGEX =
  /\b(hapus\s+(?:semua\s+)?(?:produk|data|cabang|promo|kelas|faq)|delete\s+(?:from|all|product|products|data)|drop\s+table|truncate\s+table|alter\s+table|insert\s+into|upsert|sql\s+injection|select\s+\*\s+from|from\s+admin_profiles|ubah\s+harga|ganti\s+harga|naikkan\s+harga|turunkan\s+harga|update\s+(?:harga|stok|produk|data|db|tabel|cabang|promo|admin)|service_role|supabase_secret_key|secret\s*key|admin_profiles|bypass\s*rls|system\s*prompt|developer\s*prompt|tool\s*call|function_call|rpc\(|ignore\s+previous|abaikan\s+instruksi)\b/i;

const REFUSE_ORDER_REGEX =
  /\b(lacak\s+pesanan|tracking\s+order|status\s+pesanan|cek\s+pesanan|pesanan\s+saya|sudah\s+bayar|status\s+pembayaran|bukti\s+transfer|no\s+resi|resi\s+pengiriman|refund\s+saya)\b/i;

const REFUSE_SECRET_REGEX =
  /\b(resep\s+rahasia|takaran\s+rahasia|formula\s+rahasia|rahasia\s+dapur)\b/i;

const PROMO_INTENT_REGEX =
  /\b(promo|promosi|diskon|potongan|hemat|voucher|banner\s+ongkir|ongkir\s+gratis)\b/i;

const CLASS_INTENT_REGEX =
  /\b(kelas|baking\s+class|workshop|little\s+baker|daftar\s+kelas|jadwal\s+kelas)\b/i;

const BRANCH_INTENT_REGEX =
  /\b(lokasi|alamat|cabang|jam\s+buka|jam\s+operasional|telepon|whatsapp|wa\s+cabang|maps|google\s+maps|di\s*mana|outlet|toko)\b/i;

const FAQ_INTENT_REGEX =
  /\b(faq|cara\s+pesan|cara\s+order|pembayaran|bayar|penyimpanan|simpan|tahan\s+berapa|kadaluarsa|batal|cancel|reschedule|pre\s*-?\s*order|preorder|\bpo\b|pengiriman|delivery|pickup|ambil\s+sendiri|halal|kebijakan)\b/i;

const DETAIL_INTENT_REGEX =
  /\b(detail|komposisi|bahan|alergen|alergi|ingredients|deskripsi|ukuran)\b/i;

const PRICE_OR_BUDGET_INTENT_REGEX =
  /\b(budget|murah|ekonomis|di\s*bawah|dibawah|maksimal|under|below|harga|berapa)\b/i;

const GREETING_ONLY_REGEX =
  /^(?:halo|hai|hello|hi|selamat\s+(?:pagi|siang|sore|malam)|permisi|oma|ask\s+oma|tes|test|apa\s+kabar|bantu\s+apa|bisa\s+apa)(?:\s+(?:oma|kak|min))?[!?.]*$/i;

const PRODUCT_CATALOG_WORDS_REGEX =
  /\b(menu|produk|katalog|chiffon|roti|kue|cake|cookies|mix|bundle|paket|cheese|choco|coklat|kopi|coffee|pandan|best\s*seller|unggulan|baru|terbaru|gluten|vegan|dairy|egg)\b/i;

const WEEKDAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

type ProductDataset = Awaited<
  ReturnType<typeof readChatPublishedProductsAndPromotions>
>;
type ProductRow = ProductDataset['products'][number];
type ComponentVariantRow = ProductDataset['componentVariants'][number];
type ActiveBranchRow = ProductDataset['branches'][number];
type BranchLookupRow = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

function mapPromotionsForPricing(
  rows: ProductDataset['promotions'],
): PricingPromotionInput[] {
  return rows
    .filter(
      (row) =>
        (row.discount_type === 'percentage' || row.discount_type === 'fixed') &&
        (row.scope === 'all' ||
          row.scope === 'category' ||
          row.scope === 'product' ||
          row.scope === 'variant') &&
        (row.status === 'draft' ||
          row.status === 'published' ||
          row.status === 'archived'),
    )
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      discountType: row.discount_type as 'percentage' | 'fixed',
      discountValue: Number(row.discount_value),
      minSpendIdr: row.min_spend_idr,
      maxDiscountIdr: row.max_discount_idr,
      scope: row.scope as 'all' | 'category' | 'product' | 'variant',
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status as 'draft' | 'published' | 'archived',
      isEnabled: row.is_enabled,
      isStackable: row.is_stackable,
      priority: row.priority,
      branchIds: Array.isArray(row.promotion_branches)
        ? row.promotion_branches.map((b) => b.branch_id)
        : [],
      categoryIds: Array.isArray(row.promotion_categories)
        ? row.promotion_categories.map((c) => c.category_id)
        : [],
      productIds: Array.isArray(row.promotion_products)
        ? row.promotion_products.map((p) => p.product_id)
        : [],
      variantIds: Array.isArray(row.promotion_variants)
        ? row.promotion_variants.map((v) => v.variant_id)
        : [],
    }));
}

function isVariantVerifiedForDiet(
  variant: NonNullable<ProductRow['product_variants']>[number],
  productType: string,
  dietSlug: string,
  componentMap: Map<string, ComponentVariantRow>,
): boolean {
  const tags = Array.isArray(variant.variant_dietary_tags)
    ? variant.variant_dietary_tags
    : [];
  const hasDirectTag = tags.some(
    (t) =>
      t.verification_status === 'verified' &&
      Boolean(t.verified_at) &&
      t.dietary_tags?.slug === dietSlug,
  );
  if (!hasDirectTag) return false;

  if (productType !== 'bundle') {
    return true;
  }

  if (!variant.bundle_rules_verified) {
    return false;
  }

  const hasVerifiedComponent = (componentId: string | null | undefined) => {
    if (!componentId) return false;
    const comp = componentMap.get(componentId);
    if (!comp || comp.status !== 'active') return false;
    const compTags = Array.isArray(comp.variant_dietary_tags)
      ? comp.variant_dietary_tags
      : [];
    return compTags.some(
      (t) =>
        t.verification_status === 'verified' &&
        Boolean(t.verified_at) &&
        t.dietary_tags?.slug === dietSlug,
    );
  };

  const fixed = Array.isArray(variant.bundle_fixed_components)
    ? variant.bundle_fixed_components
    : [];
  if (fixed.some((item) => !hasVerifiedComponent(item.component_variant_id))) {
    return false;
  }

  if (dietSlug === 'gluten-free') {
    const groups = Array.isArray(variant.option_groups)
      ? variant.option_groups
      : [];
    for (const group of groups) {
      const choices = Array.isArray(group.option_choices)
        ? group.option_choices
        : [];
      const activeComponentChoices = choices.filter(
        (c) => c.is_active && Boolean(c.component_variant_id),
      );
      if (
        activeComponentChoices.some(
          (c) => !hasVerifiedComponent(c.component_variant_id),
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

function collectVerifiedProductDietNames(
  product: ProductRow,
  componentMap: Map<string, ComponentVariantRow>,
): string[] {
  const variants = Array.isArray(product.product_variants)
    ? product.product_variants.filter((v) => v.status === 'active')
    : [];
  const names = new Set<string>();
  for (const variant of variants) {
    const tags = Array.isArray(variant.variant_dietary_tags)
      ? variant.variant_dietary_tags
      : [];
    for (const t of tags) {
      if (
        t.verification_status === 'verified' &&
        Boolean(t.verified_at) &&
        t.dietary_tags?.slug &&
        t.dietary_tags?.name &&
        isVariantVerifiedForDiet(
          variant,
          product.product_type,
          t.dietary_tags.slug,
          componentMap,
        )
      ) {
        names.add(sanitizeChatDisplayText(t.dietary_tags.name, 60));
      }
    }
  }
  return [...names];
}

function resolveActiveBranch<T extends BranchLookupRow>(
  branches: readonly T[],
  branchId: string | null,
): T | null {
  if (!branchId) return null;
  return branches.find((b) => b.id === branchId && b.is_active) ?? null;
}

function buildBranchQuerySuffix(branch: BranchLookupRow | null): string {
  return branch ? `?branch=${encodeURIComponent(branch.code)}` : '';
}

function computeProductMatchesForBranch(
  dataset: ProductDataset,
  branch: ActiveBranchRow | null,
  options: {
    tokens: readonly string[];
    dietSlug: string | null;
    maxPriceIdr: number | null;
    now: Date;
  },
) {
  const promotions = mapPromotionsForPricing(dataset.promotions);
  const componentMap = new Map(
    dataset.componentVariants.map((comp) => [comp.id, comp] as const),
  );

  interface CandidateProduct {
    product: ProductRow;
    primaryCategoryName: string;
    verifiedDietLabels: string[];
    minEffectivePriceIdr: number | null;
    matchingVariants: Array<{
      id: string;
      name: string;
      sizeLabel: string | null;
      effectivePriceIdr: number;
      availabilityLabel: string;
      promoTitle: string | null;
    }>;
  }

  const results: CandidateProduct[] = [];

  for (const product of dataset.products) {
    if (product.status !== 'published' || product.needs_owner_review) {
      continue;
    }

    const categories = Array.isArray(product.product_categories)
      ? product.product_categories.filter(
          (link) => link.categories?.status === 'published',
        )
      : [];
    if (categories.length === 0) continue;

    const categoryIds = categories
      .map((link) => link.categories?.id)
      .filter((id): id is string => Boolean(id));
    const primaryCategory =
      categories.find((c) => c.is_primary)?.categories?.name ??
      categories[0]?.categories?.name ??
      'Menu';

    const variants = Array.isArray(product.product_variants)
      ? product.product_variants.filter((v) => v.status === 'active')
      : [];
    if (variants.length === 0) continue;

    if (options.tokens.length > 0) {
      const corpus = normalizeChatMatchText(
        [
          product.name,
          product.slug,
          product.short_description ?? '',
          product.description ?? '',
          ...categories.map((c) => c.categories?.name ?? ''),
          ...variants.flatMap((v) => [v.name, v.sku, v.size_label ?? '']),
        ].join(' '),
      );
      if (!options.tokens.every((token) => corpus.includes(token))) {
        continue;
      }
    }

    const verifiedDietLabels = collectVerifiedProductDietNames(
      product,
      componentMap,
    );

    if (branch === null) {
      const matchingByDiet = variants.filter((variant) =>
        options.dietSlug
          ? isVariantVerifiedForDiet(
              variant,
              product.product_type,
              options.dietSlug,
              componentMap,
            )
          : true,
      );
      if (matchingByDiet.length === 0) continue;

      results.push({
        product,
        primaryCategoryName: sanitizeChatDisplayText(primaryCategory, 80),
        verifiedDietLabels,
        minEffectivePriceIdr: null,
        matchingVariants: [],
      });
      continue;
    }

    const matchingVariants: CandidateProduct['matchingVariants'] = [];
    for (const variant of variants) {
      if (
        options.dietSlug &&
        !isVariantVerifiedForDiet(
          variant,
          product.product_type,
          options.dietSlug,
          componentMap,
        )
      ) {
        continue;
      }

      const offers = Array.isArray(variant.branch_variant_offers)
        ? variant.branch_variant_offers
        : [];
      const offer = offers.find(
        (o) => o.branch_id === branch.id && o.is_listed,
      );
      if (!offer) continue;

      const isSoldOut =
        offer.availability_status === 'sold_out' ||
        (offer.stock_quantity !== null && offer.stock_quantity <= 0);

      if (options.maxPriceIdr !== null && isSoldOut) {
        continue;
      }

      const optionGroups = Array.isArray(variant.option_groups)
        ? variant.option_groups.map((group) => ({
            id: group.id,
            minSelect: group.min_select,
            maxSelect: group.max_select,
            isRequired: group.is_required,
            choices: Array.isArray(group.option_choices)
              ? group.option_choices.map((c) => ({
                  id: c.id,
                  priceDeltaIdr: c.price_delta_idr,
                  isActive: c.is_active,
                }))
              : [],
          }))
        : [];

      const pricing = computeVariantEffectivePrice(
        {
          basePriceIdr: variant.base_price_idr,
          priceOverrideIdr: offer.price_override_idr,
          optionGroups,
        },
        {
          branchId: branch.id,
          productId: product.id,
          variantId: variant.id,
          categoryIds,
        },
        promotions,
        options.now,
      );

      if (!pricing) continue;
      if (
        options.maxPriceIdr !== null &&
        pricing.effectivePriceIdr > options.maxPriceIdr
      ) {
        continue;
      }

      const availabilityLabel = isSoldOut
        ? 'Habis sementara'
        : offer.availability_status === 'unconfirmed'
          ? 'Konfirmasi stok via WA'
          : 'Tersedia';

      matchingVariants.push({
        id: variant.id,
        name: sanitizeChatDisplayText(variant.name, 80),
        sizeLabel: variant.size_label
          ? sanitizeChatDisplayText(variant.size_label, 40)
          : null,
        effectivePriceIdr: pricing.effectivePriceIdr,
        availabilityLabel,
        promoTitle: pricing.appliedPromotion
          ? sanitizeChatDisplayText(pricing.appliedPromotion.title, 80)
          : null,
      });
    }

    if (matchingVariants.length === 0) continue;

    matchingVariants.sort((a, b) => a.effectivePriceIdr - b.effectivePriceIdr);
    results.push({
      product,
      primaryCategoryName: sanitizeChatDisplayText(primaryCategory, 80),
      verifiedDietLabels,
      minEffectivePriceIdr: matchingVariants[0]?.effectivePriceIdr ?? null,
      matchingVariants,
    });
  }

  return results;
}

export function planChatOperation(input: ChatRequestInput): ChatPlan {
  const trimmed = input.message.trim();
  const normalized = normalizeChatMatchText(trimmed);

  if (REFUSE_MUTATION_REGEX.test(trimmed)) {
    return chatPlanSchema.parse({
      operation: 'refuse',
      reason: 'mutation_or_admin',
    });
  }

  if (REFUSE_ORDER_REGEX.test(trimmed)) {
    return chatPlanSchema.parse({
      operation: 'refuse',
      reason: 'order_or_payment_tracking',
    });
  }

  if (REFUSE_SECRET_REGEX.test(trimmed)) {
    return chatPlanSchema.parse({
      operation: 'refuse',
      reason: 'secret_or_internal',
    });
  }

  if (CLASS_INTENT_REGEX.test(trimmed)) {
    return chatPlanSchema.parse({
      operation: 'get_upcoming_classes',
      limit: CHAT_LIMITS.MAX_ITEMS,
    });
  }

  if (PROMO_INTENT_REGEX.test(trimmed)) {
    return chatPlanSchema.parse({
      operation: 'get_active_promotions',
      limit: CHAT_LIMITS.MAX_ITEMS,
    });
  }

  if (BRANCH_INTENT_REGEX.test(trimmed)) {
    return chatPlanSchema.parse({
      operation: 'get_branches',
    });
  }

  const maxPriceIdr = parseIdrBudgetFromQuery(trimmed);
  const dietSlug = extractDietarySlugFromQuery(trimmed);
  const query = sanitizeChatDisplayText(trimmed, CHAT_LIMITS.MAX_SEARCH_CHARS);

  if (maxPriceIdr !== null) {
    if (!input.branchId) {
      return chatPlanSchema.parse({
        operation: 'clarify',
        reason: 'branch_required_for_price',
      });
    }
    return chatPlanSchema.parse({
      operation: 'recommend_by_budget',
      maxPriceIdr,
      query,
      dietSlug,
      limit: CHAT_LIMITS.MAX_ITEMS,
    });
  }

  if (FAQ_INTENT_REGEX.test(trimmed)) {
    return chatPlanSchema.parse({
      operation: 'search_faqs',
      query,
      limit: CHAT_LIMITS.MAX_ITEMS,
    });
  }

  const tokens = buildSearchTokens(trimmed);
  if (DETAIL_INTENT_REGEX.test(trimmed) && tokens.length > 0) {
    return chatPlanSchema.parse({
      operation: 'get_product_detail',
      query,
    });
  }

  if (PRICE_OR_BUDGET_INTENT_REGEX.test(trimmed)) {
    if (!input.branchId) {
      return chatPlanSchema.parse({
        operation: 'clarify',
        reason: 'branch_required_for_price',
      });
    }
    if (tokens.length === 0 && !dietSlug) {
      return chatPlanSchema.parse({
        operation: 'clarify',
        reason: 'ambiguous',
      });
    }
  }

  if (GREETING_ONLY_REGEX.test(normalized)) {
    return chatPlanSchema.parse({
      operation: 'clarify',
      reason: 'ambiguous',
    });
  }

  if (
    PRODUCT_CATALOG_WORDS_REGEX.test(trimmed) ||
    dietSlug !== null ||
    tokens.length > 0
  ) {
    return chatPlanSchema.parse({
      operation: 'search_products',
      query,
      dietSlug,
      limit: CHAT_LIMITS.MAX_ITEMS,
    });
  }

  return chatPlanSchema.parse({
    operation: 'clarify',
    reason: 'ambiguous',
  });
}

async function handleRefuse(
  branchId: string | null,
  reason:
    'mutation_or_admin' | 'order_or_payment_tracking' | 'secret_or_internal',
): Promise<ChatResponseData> {
  const suffix =
    reason === 'order_or_payment_tracking'
      ? ' Untuk pengecekan pesanan manual, silakan hubungi admin cabang via WhatsApp melalui halaman Kontak.'
      : '';
  return chatResponseDataSchema.parse({
    answer: truncateChatAnswer(`${CHAT_COPY.REFUSE_MESSAGE}${suffix}`),
    items: [
      {
        type: 'route',
        href: ROUTES.CONTACT,
        label: 'Hubungi Admin Cabang',
        subtitle: 'Konfirmasi pesanan & pertanyaan langsung',
      },
    ],
    sourceType: 'policy',
    operation: 'refuse',
    branchId,
    branchName: null,
    notice: CHAT_COPY.REFUSE_NOTICE,
    quickPrompts: [...CHAT_QUICK_PROMPTS.slice(0, 4)],
    coverage: { totalMatched: 0, returned: 0, truncated: false },
  });
}

async function handleClarify(
  branchId: string | null,
  reason: 'ambiguous' | 'branch_required_for_price',
): Promise<ChatResponseData> {
  if (reason === 'branch_required_for_price') {
    return chatResponseDataSchema.parse({
      answer: CHAT_COPY.BRANCH_PRICE_REQUIRED,
      items: [
        {
          type: 'route',
          href: ROUTES.MENU,
          label: 'Lihat Katalog Menu',
          subtitle: 'Pilih cabang Surabaya atau Bintaro di bilah atas',
        },
        {
          type: 'route',
          href: ROUTES.CONTACT,
          label: 'Kontak & Cabang Resmi',
          subtitle: 'Tanya admin Surabaya atau Bintaro',
        },
      ],
      sourceType: 'clarification',
      operation: 'clarify',
      branchId: null,
      branchName: null,
      notice: CHAT_COPY.NO_BRANCH_NOTICE,
      quickPrompts: [
        CHAT_QUICK_PROMPTS[1],
        CHAT_QUICK_PROMPTS[2],
        CHAT_QUICK_PROMPTS[3],
        CHAT_QUICK_PROMPTS[4],
      ],
      coverage: { totalMatched: 0, returned: 0, truncated: false },
    });
  }

  return chatResponseDataSchema.parse({
    answer: CHAT_COPY.CLARIFY_MESSAGE,
    items: [],
    sourceType: 'clarification',
    operation: 'clarify',
    branchId,
    branchName: null,
    notice: CHAT_COPY.CLARIFY_NOTICE,
    quickPrompts: [...CHAT_QUICK_PROMPTS.slice(0, 5)],
    coverage: { totalMatched: 0, returned: 0, truncated: false },
  });
}

async function handleBranches(
  branchId: string | null,
  signal?: AbortSignal,
): Promise<ChatResponseData> {
  const { branches, hours } = await readChatActiveBranches(signal);
  const resolved = resolveActiveBranch(branches, branchId);
  const limited = branches.slice(0, CHAT_LIMITS.MAX_ITEMS);

  const lines = limited.map((b) => {
    const address = b.address
      ? sanitizeChatDisplayText(b.address, 140)
      : 'Alamat belum dikonfirmasi (hubungi WhatsApp admin cabang)';
    const branchHours = hours.filter((h) => h.branch_id === b.id);
    const firstKnown = branchHours.find((h) => h.opens_at && h.closes_at);
    const hoursNote = firstKnown
      ? `${WEEKDAY_NAMES[firstKnown.day_of_week] ?? 'Hari'} ${firstKnown.opens_at}–${firstKnown.closes_at} WIB`
      : 'Jam operasional mengikuti konfirmasi admin cabang';
    const waDigits = formatWhatsappDigits(b.whatsapp_number);
    return `• ${sanitizeChatDisplayText(b.name, 60)} (${sanitizeChatDisplayText(b.city, 60)}): ${address}. WhatsApp: +${waDigits}. ${hoursNote}.`;
  });

  const items: ChatItemLink[] = [];
  for (const b of limited) {
    const waDigits = formatWhatsappDigits(b.whatsapp_number);
    if (waDigits.length >= 8 && items.length < CHAT_LIMITS.MAX_ITEMS) {
      items.push({
        type: 'whatsapp',
        href: `https://wa.me/${waDigits}`,
        label: `WhatsApp ${sanitizeChatDisplayText(b.name, 60)}`,
        subtitle: b.address
          ? sanitizeChatDisplayText(b.address, 120)
          : 'Alamat belum dikonfirmasi',
      });
    }
  }
  if (items.length < CHAT_LIMITS.MAX_ITEMS) {
    items.push({
      type: 'route',
      href: `${ROUTES.CONTACT}${buildBranchQuerySuffix(resolved)}`,
      label: 'Halaman Kontak Lengkap',
      subtitle: 'Alamat, jam operasional, dan FAQ cabang',
    });
  }

  return chatResponseDataSchema.parse({
    answer: truncateChatAnswer(
      limited.length > 0
        ? `Informasi cabang aktif Resep Oma Kueh:\n${lines.join('\n')}`
        : 'Belum ada data cabang aktif saat ini.',
    ),
    items: items.slice(0, CHAT_LIMITS.MAX_ITEMS),
    sourceType: 'branches',
    operation: 'get_branches',
    branchId: resolved?.id ?? null,
    branchName: resolved ? sanitizeChatDisplayText(resolved.name, 60) : null,
    notice: CHAT_COPY.BRANCHES_NOTICE,
    coverage: {
      totalMatched: branches.length,
      returned: limited.length,
      truncated: branches.length > CHAT_LIMITS.MAX_ITEMS,
    },
  });
}

async function handleRecommendByBudget(
  plan: Extract<ChatPlan, { operation: 'recommend_by_budget' }>,
  branchId: string | null,
  now: Date,
  signal?: AbortSignal,
): Promise<ChatResponseData> {
  const dataset = await readChatPublishedProductsAndPromotions(signal);
  const resolved = resolveActiveBranch(dataset.branches, branchId);
  if (!resolved) {
    return handleClarify(null, 'branch_required_for_price');
  }

  const tokens = buildSearchTokens(plan.query);
  let matches = computeProductMatchesForBranch(dataset, resolved, {
    tokens,
    dietSlug: plan.dietSlug,
    maxPriceIdr: plan.maxPriceIdr,
    now,
  });

  if (matches.length === 0 && tokens.length > 0) {
    matches = computeProductMatchesForBranch(dataset, resolved, {
      tokens: [],
      dietSlug: plan.dietSlug,
      maxPriceIdr: plan.maxPriceIdr,
      now,
    });
  }

  matches.sort((a, b) => {
    const priceDiff =
      (a.minEffectivePriceIdr ?? Number.MAX_SAFE_INTEGER) -
      (b.minEffectivePriceIdr ?? Number.MAX_SAFE_INTEGER);
    if (priceDiff !== 0) return priceDiff;
    return a.product.name.localeCompare(b.product.name);
  });

  const limited = matches.slice(0, plan.limit);
  const suffix = buildBranchQuerySuffix(resolved);
  const items: ChatItemLink[] = limited.map((entry) => {
    const best = entry.matchingVariants[0];
    return {
      type: 'product',
      slug: entry.product.slug,
      href: `${ROUTES.MENU}/${encodeURIComponent(entry.product.slug)}${suffix}`,
      label: sanitizeChatDisplayText(entry.product.name, 100),
      subtitle: best
        ? `${best.name}${best.sizeLabel ? ` (${best.sizeLabel})` : ''} · ${best.availabilityLabel}`
        : entry.primaryCategoryName,
      priceLabel:
        best !== undefined ? formatIdr(best.effectivePriceIdr) : undefined,
      badge: entry.verifiedDietLabels[0],
    };
  });

  const summaryLines = limited.map((entry) => {
    const best = entry.matchingVariants[0];
    return `• ${sanitizeChatDisplayText(entry.product.name, 80)} (${best?.name ?? ''}): ${formatIdr(best?.effectivePriceIdr ?? 0)} (${best?.availabilityLabel ?? 'Cek cabang'})`;
  });

  const answer =
    limited.length > 0
      ? `Berikut pilihan menu di cabang ${resolved.name} dengan harga maksimal ${formatIdr(plan.maxPriceIdr)}:\n${summaryLines.join('\n')}`
      : `Belum ada SKU aktif yang tersedia dengan harga hingga ${formatIdr(plan.maxPriceIdr)} di cabang ${resolved.name}. Anda dapat melihat katalog lengkap atau menaikkan kisaran budget.`;

  return chatResponseDataSchema.parse({
    answer: truncateChatAnswer(answer),
    items,
    sourceType: 'catalog',
    operation: 'recommend_by_budget',
    branchId: resolved.id,
    branchName: sanitizeChatDisplayText(resolved.name, 60),
    notice: `${CHAT_COPY.DEFAULT_CATALOG_NOTICE} Cabang: ${resolved.name}.`,
    coverage: {
      totalMatched: matches.length,
      returned: limited.length,
      truncated: matches.length > plan.limit,
    },
  });
}

async function handleSearchProducts(
  plan: Extract<ChatPlan, { operation: 'search_products' }>,
  branchId: string | null,
  now: Date,
  signal?: AbortSignal,
): Promise<ChatResponseData> {
  const dataset = await readChatPublishedProductsAndPromotions(signal);
  const resolved = resolveActiveBranch(dataset.branches, branchId);
  const tokens = buildSearchTokens(plan.query);

  const matches = computeProductMatchesForBranch(dataset, resolved, {
    tokens,
    dietSlug: plan.dietSlug,
    maxPriceIdr: null,
    now,
  });

  const limited = matches.slice(0, plan.limit);
  const suffix = buildBranchQuerySuffix(resolved);
  const items: ChatItemLink[] = limited.map((entry) => {
    const best = entry.matchingVariants[0];
    return {
      type: 'product',
      slug: entry.product.slug,
      href: `${ROUTES.MENU}/${encodeURIComponent(entry.product.slug)}${suffix}`,
      label: sanitizeChatDisplayText(entry.product.name, 100),
      subtitle: resolved
        ? best
          ? `${entry.primaryCategoryName} · ${best.availabilityLabel}`
          : entry.primaryCategoryName
        : `${entry.primaryCategoryName} · Pilih cabang untuk harga`,
      priceLabel:
        resolved && best !== undefined
          ? `Mulai ${formatIdr(best.effectivePriceIdr)}`
          : undefined,
      badge: entry.verifiedDietLabels[0],
    };
  });

  const lines = limited.map((entry) => {
    const best = entry.matchingVariants[0];
    const pricePart =
      resolved && best !== undefined
        ? ` — mulai ${formatIdr(best.effectivePriceIdr)} (${best.availabilityLabel})`
        : ' — pilih cabang untuk melihat harga cabang';
    const dietPart =
      entry.verifiedDietLabels.length > 0
        ? ` [${entry.verifiedDietLabels.join(', ')} terverifikasi]`
        : '';
    return `• ${sanitizeChatDisplayText(entry.product.name, 80)}${dietPart}${pricePart}`;
  });

  const header = resolved
    ? `Menu Resep Oma Kueh di cabang ${resolved.name}`
    : 'Daftar menu Resep Oma Kueh (lintas cabang)';

  const answer =
    limited.length > 0
      ? `${header} (${limited.length}${matches.length > limited.length ? ` dari ${matches.length}` : ''} produk cocok):\n${lines.join('\n')}`
      : 'Belum ada produk terpublikasi yang cocok dengan kata kunci tersebut. Coba ubah kata kunci atau jelajahi halaman Menu.';

  return chatResponseDataSchema.parse({
    answer: truncateChatAnswer(answer),
    items,
    sourceType: 'catalog',
    operation: 'search_products',
    branchId: resolved?.id ?? null,
    branchName: resolved ? sanitizeChatDisplayText(resolved.name, 60) : null,
    notice: resolved
      ? `${CHAT_COPY.DEFAULT_CATALOG_NOTICE} Cabang: ${resolved.name}.`
      : CHAT_COPY.NO_BRANCH_NOTICE,
    coverage: {
      totalMatched: matches.length,
      returned: limited.length,
      truncated: matches.length > plan.limit,
    },
  });
}

async function handleProductDetail(
  plan: Extract<ChatPlan, { operation: 'get_product_detail' }>,
  branchId: string | null,
  now: Date,
  signal?: AbortSignal,
): Promise<ChatResponseData> {
  const dataset = await readChatPublishedProductsAndPromotions(signal);
  const resolved = resolveActiveBranch(dataset.branches, branchId);
  const tokens = buildSearchTokens(plan.query);

  const matches = computeProductMatchesForBranch(dataset, resolved, {
    tokens,
    dietSlug: null,
    maxPriceIdr: null,
    now,
  });

  if (matches.length === 0) {
    return chatResponseDataSchema.parse({
      answer:
        'Produk yang Anda maksud belum ditemukan dalam katalog terpublikasi. Anda dapat melihat seluruh varian menu di halaman Menu.',
      items: [
        {
          type: 'route',
          href: `${ROUTES.MENU}${buildBranchQuerySuffix(resolved)}`,
          label: 'Jelajahi Semua Menu',
          subtitle: 'Lihat produk, varian, dan klaim diet terverifikasi',
        },
      ],
      sourceType: 'catalog',
      operation: 'get_product_detail',
      branchId: resolved?.id ?? null,
      branchName: resolved ? sanitizeChatDisplayText(resolved.name, 60) : null,
      notice: resolved
        ? CHAT_COPY.DEFAULT_CATALOG_NOTICE
        : CHAT_COPY.NO_BRANCH_NOTICE,
      coverage: { totalMatched: 0, returned: 0, truncated: false },
    });
  }

  const picked = matches[0];
  const suffix = buildBranchQuerySuffix(resolved);
  const activeVariants = Array.isArray(picked.product.product_variants)
    ? picked.product.product_variants.filter((v) => v.status === 'active')
    : [];
  const allergenLabels = new Set<string>();
  for (const variant of activeVariants) {
    const allergens = Array.isArray(variant.variant_allergens)
      ? variant.variant_allergens
      : [];
    for (const a of allergens) {
      if (a.allergens?.name) {
        allergenLabels.add(
          `${sanitizeChatDisplayText(a.allergens.name, 50)} (${a.presence === 'may_contain' ? 'jejak silang' : 'mengandung'})`,
        );
      }
    }
  }

  const variantSummaries = resolved
    ? picked.matchingVariants.map(
        (v) =>
          `${v.name}${v.sizeLabel ? ` (${v.sizeLabel})` : ''}: ${formatIdr(v.effectivePriceIdr)} — ${v.availabilityLabel}`,
      )
    : activeVariants.map(
        (v) =>
          `${sanitizeChatDisplayText(v.name, 60)}${v.size_label ? ` (${sanitizeChatDisplayText(v.size_label, 30)})` : ''}`,
      );

  const lines = [
    `${sanitizeChatDisplayText(picked.product.name, 100)} (${picked.primaryCategoryName}):`,
  ];
  if (picked.product.short_description) {
    lines.push(sanitizeChatDisplayText(picked.product.short_description, 300));
  }
  if (variantSummaries.length > 0) {
    lines.push(`Varian: ${variantSummaries.join('; ')}`);
  }
  if (picked.verifiedDietLabels.length > 0) {
    lines.push(
      `Klaim diet terverifikasi: ${picked.verifiedDietLabels.join(', ')}.`,
    );
  }
  if (allergenLabels.size > 0) {
    lines.push(
      `Catatan alergen: ${[...allergenLabels].join(', ')}. Ketidakhadiran label tidak otomatis berarti bebas alergen.`,
    );
  }
  if (picked.product.ingredients_info) {
    lines.push(
      `Bahan utama: ${sanitizeChatDisplayText(picked.product.ingredients_info, 300)}`,
    );
  }
  if (picked.product.storage_instructions) {
    lines.push(
      `Penyimpanan: ${sanitizeChatDisplayText(picked.product.storage_instructions, 240)}`,
    );
  }

  return chatResponseDataSchema.parse({
    answer: truncateChatAnswer(lines.join('\n')),
    items: [
      {
        type: 'product',
        slug: picked.product.slug,
        href: `${ROUTES.MENU}/${encodeURIComponent(picked.product.slug)}${suffix}`,
        label: sanitizeChatDisplayText(picked.product.name, 100),
        subtitle: picked.primaryCategoryName,
        priceLabel:
          resolved && picked.minEffectivePriceIdr !== null
            ? `Mulai ${formatIdr(picked.minEffectivePriceIdr)}`
            : undefined,
        badge: picked.verifiedDietLabels[0],
      },
    ],
    sourceType: 'catalog',
    operation: 'get_product_detail',
    branchId: resolved?.id ?? null,
    branchName: resolved ? sanitizeChatDisplayText(resolved.name, 60) : null,
    notice: resolved
      ? CHAT_COPY.DEFAULT_CATALOG_NOTICE
      : CHAT_COPY.NO_BRANCH_NOTICE,
    coverage: {
      totalMatched: matches.length,
      returned: 1,
      truncated: false,
    },
  });
}

async function handleActivePromotions(
  plan: Extract<ChatPlan, { operation: 'get_active_promotions' }>,
  branchId: string | null,
  now: Date,
  signal?: AbortSignal,
): Promise<ChatResponseData> {
  const data = await readChatActivePromotionsData(signal);
  const resolved = resolveActiveBranch(data.branches, branchId);
  const activeBranchIdSet = new Set(data.branches.map((b) => b.id));
  const nowMs = now.getTime();

  const activeRows = data.promotions.filter((row) => {
    if (row.status !== 'published' || !row.is_enabled || row.is_stackable) {
      return false;
    }
    const startsMs = Date.parse(row.starts_at);
    const endsMs = Date.parse(row.ends_at);
    if (Number.isNaN(startsMs) || Number.isNaN(endsMs)) return false;
    if (!(startsMs <= nowMs && nowMs < endsMs)) return false;

    const branchIds = Array.isArray(row.promotion_branches)
      ? row.promotion_branches.map((b) => b.branch_id)
      : [];
    if (
      branchIds.length > 0 &&
      !branchIds.some((id) => activeBranchIdSet.has(id))
    ) {
      return false;
    }
    if (resolved && branchIds.length > 0 && !branchIds.includes(resolved.id)) {
      return false;
    }
    return true;
  });

  const limited = activeRows.slice(0, plan.limit);
  const lines = limited.map((row) => {
    const discountLabel =
      row.discount_type === 'percentage'
        ? `Diskon ${row.discount_value}%`
        : `Potongan ${formatIdr(row.discount_value)}/unit`;
    const minSpendPart =
      row.min_spend_idr > 0
        ? ` (min. belanja ${formatIdr(row.min_spend_idr)})`
        : '';
    const capPart =
      row.max_discount_idr !== null
        ? `, maks. ${formatIdr(row.max_discount_idr)}/baris`
        : '';
    return `• ${sanitizeChatDisplayText(row.title, 100)}: ${discountLabel}${minSpendPart}${capPart}. Berlaku s.d. ${formatJakartaDateTimeDisplay(row.ends_at)}.`;
  });

  const shippingJson =
    data.shippingBanner &&
    typeof data.shippingBanner.content_json === 'object' &&
    data.shippingBanner.content_json !== null &&
    !Array.isArray(data.shippingBanner.content_json)
      ? (data.shippingBanner.content_json as Record<string, unknown>)
      : null;

  const shippingNote =
    shippingJson && typeof shippingJson.body === 'string'
      ? `\nInfo Pengiriman: ${sanitizeChatDisplayText(shippingJson.body, 260)}`
      : '';

  const answer =
    limited.length > 0
      ? `Promo aktif saat ini${resolved ? ` untuk cabang ${resolved.name}` : ''}:\n${lines.join('\n')}${shippingNote}`
      : `Tidak ada promo aktif saat ini${resolved ? ` untuk cabang ${resolved.name}` : ''}.${shippingNote}`;

  const suffix = buildBranchQuerySuffix(resolved);
  return chatResponseDataSchema.parse({
    answer: truncateChatAnswer(answer),
    items: [
      {
        type: 'route',
        href: `${ROUTES.MENU}${suffix}`,
        label: 'Belanja Menu di Katalog',
        subtitle:
          limited.length > 0
            ? 'Diskon dihitung otomatis di katalog & checkout'
            : 'Lihat daftar produk & harga cabang',
      },
    ],
    sourceType: 'promotions',
    operation: 'get_active_promotions',
    branchId: resolved?.id ?? null,
    branchName: resolved ? sanitizeChatDisplayText(resolved.name, 60) : null,
    notice: CHAT_COPY.PROMO_NOTICE,
    coverage: {
      totalMatched: activeRows.length,
      returned: limited.length,
      truncated: activeRows.length > plan.limit,
    },
  });
}

async function handleUpcomingClasses(
  plan: Extract<ChatPlan, { operation: 'get_upcoming_classes' }>,
  branchId: string | null,
  now: Date,
  signal?: AbortSignal,
): Promise<ChatResponseData> {
  const data = await readChatUpcomingClassesData(signal);
  const resolved = resolveActiveBranch(data.branches, branchId);
  const nowMs = now.getTime();
  const programMap = new Map(data.programs.map((p) => [p.id, p] as const));

  const futureSessions = data.sessions
    .map((session) => {
      const program = programMap.get(session.program_id);
      if (!program || !session.branches?.is_active) return null;
      if (resolved && session.branch_id !== resolved.id) return null;
      const status =
        session.status === 'scheduled' ||
        session.status === 'full' ||
        session.status === 'cancelled' ||
        session.status === 'completed'
          ? session.status
          : 'completed';
      const evalResult = evaluateClassSessionAvailability(
        {
          startsAt: session.starts_at,
          endsAt: session.ends_at,
          registrationDeadlineAt: session.registration_deadline_at,
          capacity: session.capacity,
          seatsLeft: session.seats_left,
          status,
          isRegistrationOpen: session.is_registration_open,
          branchIsActive: session.branches.is_active,
          programIsPublic:
            program.status === 'published' &&
            !program.needs_owner_review &&
            program.cover_is_approved,
        },
        nowMs,
      );
      if (evalResult.isPast || status === 'completed') return null;

      return {
        session,
        program,
        branch: session.branches,
        evalResult,
        priceIdr: computeEffectiveClassPriceIdr(
          program.base_price_idr,
          session.price_override_idr,
        ),
        schedule: formatClassScheduleJakarta(
          session.starts_at,
          session.ends_at,
        ),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const limited = futureSessions.slice(0, plan.limit);
  const suffix = buildBranchQuerySuffix(resolved);

  const lines = limited.map((entry) => {
    const seatsPart =
      entry.session.seats_left !== null
        ? `sisa perkiraan ${entry.session.seats_left} dari ${entry.session.capacity} kursi`
        : `kapasitas perkiraan ${entry.session.capacity} kursi (konfirmasi admin)`;
    return `• ${sanitizeChatDisplayText(entry.program.title, 80)} (${sanitizeChatDisplayText(entry.branch.name, 40)}): ${entry.schedule} — ${formatIdr(entry.priceIdr)}/peserta [${entry.evalResult.statusBadgeLabel}, ${seatsPart}].`;
  });

  const seenProgramSlugs = new Set<string>();
  const items: ChatItemLink[] = [];
  for (const entry of limited) {
    if (seenProgramSlugs.has(entry.program.slug)) continue;
    seenProgramSlugs.add(entry.program.slug);
    items.push({
      type: 'class',
      slug: entry.program.slug,
      href: `${ROUTES.CLASSES}/${encodeURIComponent(entry.program.slug)}${suffix}`,
      label: sanitizeChatDisplayText(entry.program.title, 100),
      subtitle: `${sanitizeChatDisplayText(entry.branch.name, 40)} · ${entry.schedule}`,
      priceLabel: formatIdr(entry.priceIdr),
      badge: entry.evalResult.statusBadgeLabel,
    });
  }

  if (items.length === 0) {
    items.push({
      type: 'route',
      href: `${ROUTES.CLASSES}${suffix}`,
      label: 'Lihat Halaman ROK Baking Class',
      subtitle: 'Tanyakan jadwal berikutnya via WhatsApp admin cabang',
    });
  }

  const answer =
    limited.length > 0
      ? `Jadwal ROK Baking Class mendatang${resolved ? ` untuk cabang ${resolved.name}` : ''}:\n${lines.join('\n')}`
      : `Belum ada jadwal sesi Baking Class mendatang yang dibuka${resolved ? ` di cabang ${resolved.name}` : ''}. Silakan buka halaman Baking Class untuk menanyakan jadwal berikutnya via WhatsApp admin cabang.`;

  return chatResponseDataSchema.parse({
    answer: truncateChatAnswer(answer),
    items: items.slice(0, CHAT_LIMITS.MAX_ITEMS),
    sourceType: 'classes',
    operation: 'get_upcoming_classes',
    branchId: resolved?.id ?? null,
    branchName: resolved ? sanitizeChatDisplayText(resolved.name, 60) : null,
    notice: CHAT_COPY.CLASSES_NOTICE,
    coverage: {
      totalMatched: futureSessions.length,
      returned: limited.length,
      truncated: futureSessions.length > plan.limit,
    },
  });
}

async function handleSearchFaqs(
  plan: Extract<ChatPlan, { operation: 'search_faqs' }>,
  branchId: string | null,
  signal?: AbortSignal,
): Promise<ChatResponseData> {
  const data = await readChatPublishedFaqsData(signal);
  const resolved = resolveActiveBranch(data.branches, branchId);
  const tokens = buildSearchTokens(plan.query);
  const published = data.faqs.filter((f) => f.status === 'published');

  const scored = published
    .map((faq) => {
      const normalizedCorpus = normalizeChatMatchText(
        `${faq.category} ${faq.question} ${faq.answer}`,
      );
      if (tokens.length === 0) {
        return { faq, hits: 1 };
      }
      const hits = tokens.reduce(
        (count, token) =>
          normalizedCorpus.includes(token) ? count + 1 : count,
        0,
      );
      return { faq, hits };
    })
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => {
      if (b.hits !== a.hits) return b.hits - a.hits;
      return a.faq.sort_order - b.faq.sort_order;
    });

  const limited = scored.slice(0, Math.min(plan.limit, 5));
  const suffix = buildBranchQuerySuffix(resolved);

  const lines = limited.map(
    ({ faq }) =>
      `• ${sanitizeChatDisplayText(faq.question, 160)}\n  ${sanitizeChatDisplayText(faq.answer, 450)}`,
  );

  const answer =
    limited.length > 0
      ? `Informasi dari FAQ Resep Oma Kueh:\n${lines.join('\n')}`
      : 'Belum ada entri FAQ terpublikasi yang cocok dengan pertanyaan tersebut. Silakan kunjungi halaman FAQ atau hubungi admin cabang via WhatsApp.';

  return chatResponseDataSchema.parse({
    answer: truncateChatAnswer(answer),
    items: [
      {
        type: 'route',
        href: `${ROUTES.FAQ}${suffix}`,
        label: 'Lihat Semua FAQ',
        subtitle: 'Daftar lengkap tanya-jawab Resep Oma Kueh',
      },
      {
        type: 'route',
        href: `${ROUTES.ORDERING_POLICY}${suffix}`,
        label: 'Kebijakan Pemesanan',
        subtitle: 'Panduan pemesanan & konfirmasi WhatsApp',
      },
    ],
    sourceType: 'faqs',
    operation: 'search_faqs',
    branchId: resolved?.id ?? null,
    branchName: resolved ? sanitizeChatDisplayText(resolved.name, 60) : null,
    notice: CHAT_COPY.FAQ_NOTICE,
    coverage: {
      totalMatched: scored.length,
      returned: limited.length,
      truncated: scored.length > limited.length,
    },
  });
}

const ALLOWED_DIET_SLUGS = new Set([
  'gluten-free',
  'vegan',
  'egg-free',
  'dairy-free',
]);

type ChatExecutionMode = 'deterministic' | 'generative' | 'generative_fallback';

interface AskOmaChatExecutionOptions {
  now?: Date;
  signal?: AbortSignal;
  clientKey?: string;
  provider?: GenerativeChatProvider;
  limiterStore?: ExternalLimiterStore;
  envOverride?: ReturnType<typeof getServerEnvironment>;
}

interface AskOmaChatExecutionResult {
  data: ChatResponseData;
  meta: {
    mode: ChatExecutionMode;
    fallbackReason?: string;
  };
}

function clampPlanLimit(rawLimit: unknown): number {
  const num =
    typeof rawLimit === 'number' ? Math.trunc(rawLimit) : CHAT_LIMITS.MAX_ITEMS;
  if (!Number.isFinite(num) || num < 1) return CHAT_LIMITS.MAX_ITEMS;
  return Math.min(num, CHAT_LIMITS.MAX_ITEMS);
}

function sanitizeProposedDietSlug(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  return ALLOWED_DIET_SLUGS.has(trimmed) ? trimmed : null;
}

/**
 * Validates and constrains an LLM-proposed plan against backend authorization
 * and schema rules before executing read-only catalog retrieval.
 */
export function validateGenerativeProposedPlan(
  rawPlan: unknown,
  input: ChatRequestInput,
): ChatPlan | null {
  if (!rawPlan || typeof rawPlan !== 'object' || Array.isArray(rawPlan)) {
    return null;
  }

  const candidate = rawPlan as Record<string, unknown>;
  const operation = candidate.operation;
  if (
    typeof operation !== 'string' ||
    !(CHAT_OPERATIONS as readonly string[]).includes(operation)
  ) {
    return null;
  }

  const rawQuery = typeof candidate.query === 'string' ? candidate.query : '';
  if (rawQuery && REFUSE_MUTATION_REGEX.test(rawQuery)) {
    return null;
  }

  const fallbackQuery = sanitizeChatDisplayText(
    input.message,
    CHAT_LIMITS.MAX_SEARCH_CHARS,
  );
  const safeQuery = rawQuery
    ? sanitizeChatDisplayText(rawQuery, CHAT_LIMITS.MAX_SEARCH_CHARS)
    : fallbackQuery;

  let normalizedCandidate: unknown;
  switch (operation) {
    case 'refuse':
      normalizedCandidate = {
        operation: 'refuse',
        reason:
          candidate.reason === 'order_or_payment_tracking' ||
          candidate.reason === 'secret_or_internal' ||
          candidate.reason === 'mutation_or_admin'
            ? candidate.reason
            : 'mutation_or_admin',
      };
      break;
    case 'clarify':
      normalizedCandidate = {
        operation: 'clarify',
        reason:
          candidate.reason === 'branch_required_for_price'
            ? 'branch_required_for_price'
            : 'ambiguous',
      };
      break;
    case 'get_branches':
      normalizedCandidate = { operation: 'get_branches' };
      break;
    case 'get_active_promotions':
      normalizedCandidate = {
        operation: 'get_active_promotions',
        limit: clampPlanLimit(candidate.limit),
      };
      break;
    case 'get_upcoming_classes':
      normalizedCandidate = {
        operation: 'get_upcoming_classes',
        limit: clampPlanLimit(candidate.limit),
      };
      break;
    case 'search_faqs':
      normalizedCandidate = {
        operation: 'search_faqs',
        query: safeQuery,
        limit: clampPlanLimit(candidate.limit),
      };
      break;
    case 'search_products':
      normalizedCandidate = {
        operation: 'search_products',
        query: safeQuery,
        dietSlug: sanitizeProposedDietSlug(candidate.dietSlug),
        limit: clampPlanLimit(candidate.limit),
      };
      break;
    case 'get_product_detail':
      if (!safeQuery) return null;
      normalizedCandidate = {
        operation: 'get_product_detail',
        query: safeQuery,
      };
      break;
    case 'recommend_by_budget': {
      if (!input.branchId) {
        normalizedCandidate = {
          operation: 'clarify',
          reason: 'branch_required_for_price',
        };
        break;
      }
      const proposedMax =
        typeof candidate.maxPriceIdr === 'number'
          ? Math.trunc(candidate.maxPriceIdr)
          : null;
      const inferredMax = parseIdrBudgetFromQuery(input.message);
      const maxPriceIdr =
        proposedMax && proposedMax > 0 && proposedMax <= 1_000_000_000
          ? proposedMax
          : inferredMax;
      if (!maxPriceIdr || maxPriceIdr <= 0) {
        return null;
      }
      normalizedCandidate = {
        operation: 'recommend_by_budget',
        maxPriceIdr,
        query: safeQuery,
        dietSlug: sanitizeProposedDietSlug(candidate.dietSlug),
        limit: clampPlanLimit(candidate.limit),
      };
      break;
    }
    default:
      return null;
  }

  const parsed = chatPlanSchema.safeParse(normalizedCandidate);
  return parsed.success ? parsed.data : null;
}

function collectAllowedPriceValues(
  dto: ChatResponseData,
  plan: ChatPlan,
  input: ChatRequestInput,
): number[] {
  const values = new Set<number>(extractChatMonetaryValues(dto.answer));
  for (const item of dto.items) {
    if (item.priceLabel) {
      for (const v of extractChatMonetaryValues(item.priceLabel)) {
        values.add(v);
      }
    }
    if (item.subtitle) {
      for (const v of extractChatMonetaryValues(item.subtitle)) {
        values.add(v);
      }
    }
  }
  if (plan.operation === 'recommend_by_budget') {
    values.add(plan.maxPriceIdr);
  }
  const messageBudget = parseIdrBudgetFromQuery(input.message);
  if (messageBudget !== null) {
    values.add(messageBudget);
  }
  return [...values];
}

async function executeChatPlan(
  plan: ChatPlan,
  branchId: string | null,
  now: Date,
  combinedSignal: AbortSignal,
): Promise<ChatResponseData> {
  try {
    switch (plan.operation) {
      case 'refuse':
        return await handleRefuse(branchId, plan.reason);
      case 'clarify':
        return await handleClarify(branchId, plan.reason);
      case 'get_branches':
        return await handleBranches(branchId, combinedSignal);
      case 'recommend_by_budget':
        return await handleRecommendByBudget(
          plan,
          branchId,
          now,
          combinedSignal,
        );
      case 'search_products':
        return await handleSearchProducts(plan, branchId, now, combinedSignal);
      case 'get_product_detail':
        return await handleProductDetail(plan, branchId, now, combinedSignal);
      case 'get_active_promotions':
        return await handleActivePromotions(
          plan,
          branchId,
          now,
          combinedSignal,
        );
      case 'get_upcoming_classes':
        return await handleUpcomingClasses(plan, branchId, now, combinedSignal);
      case 'search_faqs':
        return await handleSearchFaqs(plan, branchId, combinedSignal);
    }
  } catch (err) {
    if (err instanceof ChatServerError) {
      throw err;
    }
    if (
      combinedSignal.aborted ||
      (err instanceof Error &&
        (err.name === 'TimeoutError' || err.name === 'AbortError'))
    ) {
      throw new ChatTimeoutError();
    }
    throw new ChatUpstreamError();
  }
}

export async function answerAskOmaChatWithMeta(
  input: ChatRequestInput,
  options: AskOmaChatExecutionOptions = {},
): Promise<AskOmaChatExecutionResult> {
  const now = options.now ?? new Date();
  const totalDeadlineSignal = AbortSignal.timeout(
    CHAT_LIMITS.TOTAL_CHAT_DEADLINE_MS,
  );
  const combinedSignal = options.signal
    ? AbortSignal.any([options.signal, totalDeadlineSignal])
    : totalDeadlineSignal;

  if (combinedSignal.aborted) {
    throw new ChatTimeoutError();
  }

  const deterministicPlan = planChatOperation(input);

  // Enforce refusal before touching limiter store or generative provider.
  if (deterministicPlan.operation === 'refuse') {
    const data = await executeChatPlan(
      deterministicPlan,
      input.branchId ?? null,
      now,
      combinedSignal,
    );
    return { data, meta: { mode: 'deterministic' } };
  }

  let env: ReturnType<typeof getServerEnvironment>;
  try {
    env = options.envOverride ?? getServerEnvironment();
  } catch (err) {
    if (err instanceof EnvironmentConfigurationError) {
      throw new ChatLimiterUnavailableError();
    }
    throw err;
  }

  if (!env.CHAT_PROVIDER_ENABLED) {
    const data = await executeChatPlan(
      deterministicPlan,
      input.branchId ?? null,
      now,
      combinedSignal,
    );
    return { data, meta: { mode: 'deterministic' } };
  }

  if (
    !env.GOOGLE_GEN_AI_API_KEY ||
    !env.GOOGLE_GEN_AI_CHAT_MODEL ||
    !env.CHAT_GENERATIVE_QUOTA_PER_DAY ||
    !env.CHAT_LIMITER_STORE_URL ||
    !env.CHAT_LIMITER_STORE_TOKEN
  ) {
    throw new ChatLimiterUnavailableError();
  }

  let lease: GenerativeLimiterLease | null = null;
  let quotaExhausted = false;
  try {
    lease = await reserveGenerativeSlot({
      storeUrl: env.CHAT_LIMITER_STORE_URL,
      storeToken: env.CHAT_LIMITER_STORE_TOKEN,
      hashSalt: env.CHAT_LIMITER_HASH_SALT,
      clientKey: options.clientKey ?? 'anon-server',
      dailyQuota: env.CHAT_GENERATIVE_QUOTA_PER_DAY,
      rpmLimit: env.CHAT_GENERATIVE_RPM_LIMIT,
      globalRpmLimit: env.CHAT_GENERATIVE_GLOBAL_RPM_LIMIT,
      maxConcurrency: env.CHAT_GENERATIVE_MAX_CONCURRENCY,
      now,
      signal: combinedSignal,
      store: options.limiterStore,
    });
  } catch (err) {
    if (err instanceof ChatGenerativeQuotaError) {
      quotaExhausted = true;
    } else if (err instanceof ChatServerError) {
      throw err;
    } else {
      throw new ChatLimiterUnavailableError();
    }
  }

  if (quotaExhausted || !lease) {
    const fallbackData = await executeChatPlan(
      deterministicPlan,
      input.branchId ?? null,
      now,
      combinedSignal,
    );
    return {
      data: chatResponseDataSchema.parse({
        ...fallbackData,
        notice: CHAT_COPY.GENERATIVE_QUOTA_FALLBACK_NOTICE,
      }),
      meta: {
        mode: 'generative_fallback',
        fallbackReason: 'quota_exhausted',
      },
    };
  }

  try {
    const provider =
      options.provider ??
      createGeminiChatProvider({
        apiKey: env.GOOGLE_GEN_AI_API_KEY,
        model: env.GOOGLE_GEN_AI_CHAT_MODEL,
      });

    let activePlan: ChatPlan = deterministicPlan;
    let fallbackReason: string | undefined;

    try {
      const rawPlan = await provider.proposeReadPlan({
        message: input.message,
        history: input.history,
        hasBranch: Boolean(input.branchId),
        branchName: null,
        signal: combinedSignal,
      });
      const validated = validateGenerativeProposedPlan(rawPlan, input);
      if (validated) {
        activePlan = validated;
      } else {
        fallbackReason = 'invalid_plan';
      }
    } catch (err) {
      if (options.signal?.aborted || totalDeadlineSignal.aborted) {
        throw new ChatTimeoutError();
      }
      fallbackReason =
        err instanceof Error &&
        (err.name === 'TimeoutError' || err.name === 'AbortError')
          ? 'planner_timeout'
          : 'planner_error';
    }

    const retrievedData = await executeChatPlan(
      activePlan,
      input.branchId ?? null,
      now,
      combinedSignal,
    );

    if (
      activePlan.operation === 'refuse' ||
      activePlan.operation === 'clarify'
    ) {
      return {
        data: retrievedData,
        meta: {
          mode: fallbackReason ? 'generative_fallback' : 'generative',
          fallbackReason,
        },
      };
    }

    try {
      const rawComposed = await provider.composeGroundedAnswer({
        message: input.message,
        history: input.history,
        groundedDto: retrievedData,
        signal: combinedSignal,
      });
      const parsedOutput = generativeAnswerOutputSchema.safeParse(rawComposed);
      if (!parsedOutput.success) {
        return {
          data: chatResponseDataSchema.parse({
            ...retrievedData,
            notice:
              retrievedData.notice || CHAT_COPY.GENERATIVE_FALLBACK_NOTICE,
          }),
          meta: {
            mode: 'generative_fallback',
            fallbackReason: fallbackReason ?? 'invalid_composer_output',
          },
        };
      }

      const verification = verifyAndSanitizeGenerativeAnswer(
        parsedOutput.data.answer,
        {
          allowedHrefs: retrievedData.items.map((item) => item.href),
          allowedPriceValues: collectAllowedPriceValues(
            retrievedData,
            activePlan,
            input,
          ),
        },
      );

      if (!verification.ok) {
        return {
          data: chatResponseDataSchema.parse({
            ...retrievedData,
            notice:
              retrievedData.notice || CHAT_COPY.GENERATIVE_FALLBACK_NOTICE,
          }),
          meta: {
            mode: 'generative_fallback',
            fallbackReason:
              fallbackReason ??
              verification.reason ??
              'composer_verification_failed',
          },
        };
      }

      return {
        data: chatResponseDataSchema.parse({
          ...retrievedData,
          answer: truncateChatAnswer(verification.sanitizedText),
        }),
        meta: {
          mode: fallbackReason ? 'generative_fallback' : 'generative',
          fallbackReason,
        },
      };
    } catch (err) {
      if (options.signal?.aborted || totalDeadlineSignal.aborted) {
        throw new ChatTimeoutError();
      }
      const composeErrorReason =
        err instanceof Error &&
        (err.name === 'TimeoutError' || err.name === 'AbortError')
          ? 'composer_timeout'
          : 'composer_error';
      return {
        data: retrievedData,
        meta: {
          mode: 'generative_fallback',
          fallbackReason: fallbackReason ?? composeErrorReason,
        },
      };
    }
  } finally {
    await lease.release();
  }
}
