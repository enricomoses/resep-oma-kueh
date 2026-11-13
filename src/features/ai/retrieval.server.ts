import 'server-only';

import { CATALOG_LIMITS } from '@/constants/catalog.constant';
import { CHAT_LIMITS } from '@/constants/chat.constant';
import {
  ChatTimeoutError,
  ChatUpstreamError,
} from '@/features/ai/errors.server';
import { createChatReadClient } from '@/lib/supabase/public-read.server';

function withQueryDeadline(signal?: AbortSignal): AbortSignal {
  const deadline = AbortSignal.timeout(CHAT_LIMITS.QUERY_DEADLINE_MS);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

function throwClassifiedReadError(err: unknown, signal?: AbortSignal): never {
  if (
    signal?.aborted ||
    (err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError')) ||
    (typeof err === 'object' &&
      err !== null &&
      'message' in err &&
      typeof (err as { message?: unknown }).message === 'string' &&
      /(timeout|abort)/i.test((err as { message: string }).message))
  ) {
    throw new ChatTimeoutError();
  }
  throw new ChatUpstreamError();
}

export async function readChatActiveBranches(signal?: AbortSignal) {
  const client = createChatReadClient();
  try {
    const [branchesRes, hoursRes] = await Promise.all([
      client
        .from('branches')
        .select(
          'id,code,name,city,whatsapp_number,address,maps_url,allow_pickup,allow_delivery,is_active',
        )
        .eq('is_active', true)
        .retry(false)
        .order('sort_order')
        .order('id')
        .limit(24)
        .abortSignal(withQueryDeadline(signal)),
      client
        .from('business_hours')
        .select('id,branch_id,day_of_week,opens_at,closes_at,is_closed,note')
        .retry(false)
        .order('branch_id')
        .order('day_of_week')
        .limit(100)
        .abortSignal(withQueryDeadline(signal)),
    ]);

    if (branchesRes.error || hoursRes.error) {
      throwClassifiedReadError(branchesRes.error ?? hoursRes.error, signal);
    }

    return {
      branches: branchesRes.data ?? [],
      hours: hoursRes.data ?? [],
    };
  } catch (err) {
    if (err instanceof ChatTimeoutError || err instanceof ChatUpstreamError) {
      throw err;
    }
    throwClassifiedReadError(err, signal);
  }
}

export async function readChatPublishedProductsAndPromotions(
  signal?: AbortSignal,
) {
  const client = createChatReadClient();
  try {
    const [branchesRes, productsRes, promotionsRes] = await Promise.all([
      client
        .from('branches')
        .select(
          'id,code,name,city,whatsapp_number,address,maps_url,allow_pickup,allow_delivery,is_active',
        )
        .eq('is_active', true)
        .retry(false)
        .order('sort_order')
        .order('id')
        .limit(24)
        .abortSignal(withQueryDeadline(signal)),
      client
        .from('products')
        .select(
          'id,name,slug,short_description,description,ingredients_info,storage_instructions,product_type,is_featured,is_best_seller,is_new,status,needs_owner_review,sort_order,product_categories(category_id,is_primary,categories(id,name,slug,status)),product_variants(id,sku,name,size_label,base_price_idr,status,sort_order,is_default,bundle_recipe,bundle_units_total,bundle_rules_verified,branch_variant_offers(branch_id,is_listed,availability_status,stock_quantity,price_override_idr),option_groups(id,name,min_select,max_select,quantity_per_selection,is_required,sort_order,option_choices(id,label,price_delta_idr,component_variant_id,is_active,sort_order)),bundle_fixed_components!bundle_fixed_components_bundle_variant_id_fkey(id,component_slot,component_variant_id,quantity,sort_order),variant_dietary_tags(dietary_tag_id,verification_status,verified_at,dietary_tags(id,slug,name)),variant_allergens(allergen_id,presence,verified_at,allergens(id,slug,name)))',
        )
        .eq('status', 'published')
        .eq('needs_owner_review', false)
        .retry(false)
        .order('sort_order')
        .order('id')
        .limit(CATALOG_LIMITS.MAX_PRODUCTS_READ)
        .abortSignal(withQueryDeadline(signal)),
      client
        .from('promotions')
        .select(
          'id,title,slug,description,discount_type,discount_value,min_spend_idr,max_discount_idr,scope,starts_at,ends_at,status,is_enabled,is_stackable,priority,promotion_branches(branch_id),promotion_categories(category_id),promotion_products(product_id),promotion_variants(variant_id)',
        )
        .eq('status', 'published')
        .eq('is_enabled', true)
        .retry(false)
        .order('priority', { ascending: false })
        .order('id')
        .limit(CATALOG_LIMITS.MAX_PROMOTIONS_READ)
        .abortSignal(withQueryDeadline(signal)),
    ]);

    if (branchesRes.error || productsRes.error || promotionsRes.error) {
      throwClassifiedReadError(
        branchesRes.error ?? productsRes.error ?? promotionsRes.error,
        signal,
      );
    }

    const products = productsRes.data ?? [];
    const componentVariantIds = new Set<string>();
    for (const product of products) {
      const variants = Array.isArray(product.product_variants)
        ? product.product_variants
        : [];
      for (const variant of variants) {
        const fixed = Array.isArray(variant.bundle_fixed_components)
          ? variant.bundle_fixed_components
          : [];
        for (const item of fixed) {
          if (item.component_variant_id) {
            componentVariantIds.add(item.component_variant_id);
          }
        }
        const groups = Array.isArray(variant.option_groups)
          ? variant.option_groups
          : [];
        for (const group of groups) {
          const choices = Array.isArray(group.option_choices)
            ? group.option_choices
            : [];
          for (const choice of choices) {
            if (choice.component_variant_id) {
              componentVariantIds.add(choice.component_variant_id);
            }
          }
        }
      }
    }

    let componentVariants: Array<{
      id: string;
      status: string;
      variant_dietary_tags?: Array<{
        verification_status: string;
        verified_at: string | null;
        dietary_tags?: { id: string; slug: string; name: string } | null;
      }> | null;
      branch_variant_offers?: Array<{
        branch_id: string;
        is_listed: boolean;
        availability_status: string;
        stock_quantity: number | null;
      }> | null;
    }> = [];

    if (componentVariantIds.size > 0) {
      const compRes = await client
        .from('product_variants')
        .select(
          'id,status,variant_dietary_tags(verification_status,verified_at,dietary_tags(id,slug,name)),branch_variant_offers(branch_id,is_listed,availability_status,stock_quantity)',
        )
        .in('id', [...componentVariantIds])
        .retry(false)
        .limit(100)
        .abortSignal(withQueryDeadline(signal));

      if (compRes.error) {
        throwClassifiedReadError(compRes.error, signal);
      }
      componentVariants = compRes.data ?? [];
    }

    return {
      branches: branchesRes.data ?? [],
      products,
      promotions: promotionsRes.data ?? [],
      componentVariants,
    };
  } catch (err) {
    if (err instanceof ChatTimeoutError || err instanceof ChatUpstreamError) {
      throw err;
    }
    throwClassifiedReadError(err, signal);
  }
}

export async function readChatActivePromotionsData(signal?: AbortSignal) {
  const client = createChatReadClient();
  try {
    const [branchesRes, promotionsRes, bannerRes] = await Promise.all([
      client
        .from('branches')
        .select('id,code,name,city,whatsapp_number,address,is_active')
        .eq('is_active', true)
        .retry(false)
        .order('sort_order')
        .order('id')
        .limit(24)
        .abortSignal(withQueryDeadline(signal)),
      client
        .from('promotions')
        .select(
          'id,title,slug,description,discount_type,discount_value,min_spend_idr,max_discount_idr,scope,starts_at,ends_at,status,is_enabled,is_stackable,priority,promotion_branches(branch_id),promotion_categories(category_id),promotion_products(product_id),promotion_variants(variant_id)',
        )
        .eq('status', 'published')
        .eq('is_enabled', true)
        .retry(false)
        .order('priority', { ascending: false })
        .order('id')
        .limit(32)
        .abortSignal(withQueryDeadline(signal)),
      client
        .from('site_content')
        .select('key,content_json,status,updated_at')
        .eq('key', 'promo.shipping_banner')
        .eq('status', 'published')
        .retry(false)
        .abortSignal(withQueryDeadline(signal))
        .maybeSingle(),
    ]);

    if (branchesRes.error || promotionsRes.error || bannerRes.error) {
      throwClassifiedReadError(
        branchesRes.error ?? promotionsRes.error ?? bannerRes.error,
        signal,
      );
    }

    return {
      branches: branchesRes.data ?? [],
      promotions: promotionsRes.data ?? [],
      shippingBanner: bannerRes.data,
    };
  } catch (err) {
    if (err instanceof ChatTimeoutError || err instanceof ChatUpstreamError) {
      throw err;
    }
    throwClassifiedReadError(err, signal);
  }
}

export async function readChatUpcomingClassesData(signal?: AbortSignal) {
  const client = createChatReadClient();
  try {
    const [branchesRes, programsRes] = await Promise.all([
      client
        .from('branches')
        .select('id,code,name,city,whatsapp_number,address,is_active')
        .eq('is_active', true)
        .retry(false)
        .order('sort_order')
        .order('id')
        .limit(24)
        .abortSignal(withQueryDeadline(signal)),
      client
        .from('class_programs')
        .select(
          'id,title,slug,short_description,base_price_idr,age_min,age_max,duration_minutes,needs_owner_review,cover_is_approved,status',
        )
        .eq('status', 'published')
        .eq('needs_owner_review', false)
        .eq('cover_is_approved', true)
        .retry(false)
        .order('created_at', { ascending: false })
        .order('id')
        .limit(24)
        .abortSignal(withQueryDeadline(signal)),
    ]);

    if (branchesRes.error || programsRes.error) {
      throwClassifiedReadError(branchesRes.error ?? programsRes.error, signal);
    }

    const programs = programsRes.data ?? [];
    let sessions: Array<{
      id: string;
      program_id: string;
      branch_id: string;
      starts_at: string;
      ends_at: string;
      registration_deadline_at: string | null;
      capacity: number;
      seats_left: number | null;
      price_override_idr: number | null;
      status: string;
      is_registration_open: boolean;
      branches: {
        id: string;
        code: string;
        name: string;
        city: string;
        whatsapp_number: string;
        address: string | null;
        is_active: boolean;
      } | null;
    }> = [];

    if (programs.length > 0) {
      const sessionsRes = await client
        .from('class_sessions')
        .select(
          'id,program_id,branch_id,starts_at,ends_at,registration_deadline_at,capacity,seats_left,price_override_idr,status,is_registration_open,branches(id,code,name,city,whatsapp_number,address,is_active)',
        )
        .in(
          'program_id',
          programs.map((p) => p.id),
        )
        .retry(false)
        .order('starts_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(60)
        .abortSignal(withQueryDeadline(signal));

      if (sessionsRes.error) {
        throwClassifiedReadError(sessionsRes.error, signal);
      }
      sessions = (sessionsRes.data ?? []) as typeof sessions;
    }

    return {
      branches: branchesRes.data ?? [],
      programs,
      sessions,
    };
  } catch (err) {
    if (err instanceof ChatTimeoutError || err instanceof ChatUpstreamError) {
      throw err;
    }
    throwClassifiedReadError(err, signal);
  }
}

export async function readChatPublishedFaqsData(signal?: AbortSignal) {
  const client = createChatReadClient();
  try {
    const [branchesRes, faqsRes] = await Promise.all([
      client
        .from('branches')
        .select('id,code,name,city,whatsapp_number,address,is_active')
        .eq('is_active', true)
        .retry(false)
        .order('sort_order')
        .order('id')
        .limit(24)
        .abortSignal(withQueryDeadline(signal)),
      client
        .from('faqs')
        .select('id,category,question,answer,sort_order,status')
        .eq('status', 'published')
        .retry(false)
        .order('sort_order')
        .order('id')
        .limit(50)
        .abortSignal(withQueryDeadline(signal)),
    ]);

    if (branchesRes.error || faqsRes.error) {
      throwClassifiedReadError(branchesRes.error ?? faqsRes.error, signal);
    }

    return {
      branches: branchesRes.data ?? [],
      faqs: faqsRes.data ?? [],
    };
  } catch (err) {
    if (err instanceof ChatTimeoutError || err instanceof ChatUpstreamError) {
      throw err;
    }
    throwClassifiedReadError(err, signal);
  }
}
