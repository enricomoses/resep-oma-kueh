import 'server-only';
import { CONTENT_LIMITS } from '@/constants/content.constant';
import { createPublicReadClient } from '@/lib/supabase/public-read.server';
import type { PublicCmsKey } from '@/types/content';

function withDeadline(signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(CONTENT_LIMITS.READ_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

export async function readPublishedSiteContentByKeys(
  keys: readonly PublicCmsKey[],
  signal?: AbortSignal,
) {
  if (keys.length === 0) return [];
  const { data, error } = await createPublicReadClient()
    .from('site_content')
    .select('key,content_json,status,updated_at')
    .in('key', [...keys])
    .eq('status', 'published')
    .retry(false)
    .order('key')
    .limit(CONTENT_LIMITS.MAX_KEYS_QUERY)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Published site content read unavailable');
  return data;
}

export async function readPublishedFaqs(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('faqs')
    .select('id,category,question,answer,sort_order,status')
    .eq('status', 'published')
    .retry(false)
    .order('sort_order')
    .order('id')
    .limit(CONTENT_LIMITS.MAX_FAQS)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Published FAQs read unavailable');
  return data;
}

export async function readActiveBranchHours(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('business_hours')
    .select('id,branch_id,day_of_week,opens_at,closes_at,is_closed,note')
    .retry(false)
    .order('branch_id')
    .order('day_of_week')
    .limit(CONTENT_LIMITS.MAX_HOURS)
    .abortSignal(withDeadline(signal));
  if (error) throw new Error('Branch hours read unavailable');
  return data;
}
