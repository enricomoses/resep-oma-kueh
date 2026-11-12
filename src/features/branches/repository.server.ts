import 'server-only';
import { createPublicReadClient } from '@/lib/supabase/public-read.server';
import { BRANCH } from '@/constants/site.constant';

export async function readActiveBranches(signal?: AbortSignal) {
  const query = createPublicReadClient()
    .from('branches')
    .select('id,code,name,city,whatsapp_number,address,maps_url')
    .eq('is_active', true)
    .retry(false)
    .order('sort_order')
    .order('id')
    .limit(BRANCH.MAX_RECORDS + 1);
  const deadline = AbortSignal.timeout(BRANCH.READ_TIMEOUT_MS);
  const { data, error } = await query.abortSignal(
    signal ? AbortSignal.any([signal, deadline]) : deadline,
  );
  if (error) throw new Error('Branch read unavailable');
  return data;
}
