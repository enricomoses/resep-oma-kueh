import 'server-only';

import { PROMOTION_LIMITS } from '@/constants/promotion.constant';
import { createPublicReadClient } from '@/lib/supabase/public-read.server';

function withDeadline(signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(5000);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

export async function readPublicActivePromotions(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('promotions')
    .select(
      'id,title,slug,description,discount_type,discount_value,min_spend_idr,max_discount_idr,scope,starts_at,ends_at,status,is_enabled,is_stackable,priority,banner_image_path,promotion_branches(branch_id),promotion_categories(category_id),promotion_products(product_id),promotion_variants(variant_id)',
    )
    .eq('status', 'published')
    .eq('is_enabled', true)
    .retry(false)
    .order('priority', { ascending: false })
    .order('id')
    .limit(PROMOTION_LIMITS.MAX_LIST_LIMIT)
    .abortSignal(withDeadline(signal));

  if (error) {
    throw new Error('Public promotions read unavailable');
  }
  return data;
}

export async function readPublishedShippingBanner(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('site_content')
    .select('key,content_json,status,updated_at')
    .eq('key', 'promo.shipping_banner')
    .eq('status', 'published')
    .retry(false)
    .abortSignal(withDeadline(signal))
    .maybeSingle();

  if (error) {
    throw new Error('Shipping banner read unavailable');
  }
  return data;
}

export function resolvePublicBannerUrl(
  bannerImagePath: string | null,
): string | null {
  if (!bannerImagePath || !bannerImagePath.startsWith('approved/')) {
    return null;
  }
  const client = createPublicReadClient();
  const storage = (client as { storage?: typeof client.storage }).storage;
  if (!storage) return null;
  const { data } = storage.from('product-images').getPublicUrl(bannerImagePath);
  return data.publicUrl ?? null;
}
