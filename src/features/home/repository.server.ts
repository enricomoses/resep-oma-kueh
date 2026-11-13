import 'server-only';
import { HOME_LIMITS } from '@/constants/home.constant';
import { createPublicReadClient } from '@/lib/supabase/public-read.server';

const HOME_CONTENT_KEYS = [
  'home.hero',
  'home.story',
  'home.custom_business',
  'home.class_promo',
  'community.instagram',
] as const;

function withDeadline(signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(HOME_LIMITS.READ_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

export async function readPublishedHomeContent(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('site_content')
    .select('key,content_json,status')
    .in('key', [...HOME_CONTENT_KEYS])
    .eq('status', 'published')
    .retry(false)
    .order('key')
    .limit(HOME_LIMITS.CONTENT_KEYS)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Home content read unavailable');
  return data;
}

export async function readFeaturedProducts(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('products')
    .select(
      'id,name,slug,short_description,description,product_type,is_best_seller,is_new,is_featured,status,sort_order,product_categories(category_id,is_primary,categories(id,name,slug,status)),product_images(alt_text,is_primary,sort_order),product_variants(id,base_price_idr,status,sort_order,branch_variant_offers(branch_id,is_listed,availability_status,stock_quantity,price_override_idr),option_groups(id,min_select,max_select,is_required,option_choices(id,price_delta_idr,is_active)))',
    )
    .eq('status', 'published')
    .eq('is_featured', true)
    .retry(false)
    .order('sort_order')
    .order('id')
    .limit(HOME_LIMITS.FEATURED)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Featured products read unavailable');
  return data;
}

export async function readActivePromotions(signal?: AbortSignal) {
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
    .limit(HOME_LIMITS.PROMOTIONS)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Promotions read unavailable');
  return data;
}

export async function readUpcomingClassSessions(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('class_sessions')
    .select(
      'id,starts_at,ends_at,registration_deadline_at,capacity,seats_left,price_override_idr,status,is_registration_open,branches(id,code,name,city,is_active),class_programs(id,title,slug,short_description,description,base_price_idr,age_min,age_max,duration_minutes,cover_image_path,cover_storage_bucket,cover_is_approved,cover_alt_text,needs_owner_review,status)',
    )
    .eq('status', 'scheduled')
    .eq('is_registration_open', true)
    .retry(false)
    .order('starts_at')
    .order('id')
    .limit(HOME_LIMITS.CLASSES)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Class sessions read unavailable');
  return data;
}

export function resolvePublicBrandAssetUrl(
  imagePath: string | null | undefined,
): string | null {
  if (!imagePath || !imagePath.startsWith('approved/')) {
    return null;
  }
  const client = createPublicReadClient();
  const storage = (client as { storage?: typeof client.storage }).storage;
  if (!storage) return null;
  const { data } = storage.from('brand-assets').getPublicUrl(imagePath);
  return data.publicUrl ?? null;
}

export async function readPublishedTestimonials(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('testimonials')
    .select('id,display_name,quote,rating,source_label,status,sort_order')
    .eq('status', 'published')
    .retry(false)
    .order('sort_order')
    .order('id')
    .limit(HOME_LIMITS.TESTIMONIALS)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Testimonials read unavailable');
  return data;
}
