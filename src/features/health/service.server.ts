import 'server-only';

import { getServerEnvironment } from '@/config/environment.server';
import { APP } from '@/constants/app.constant';
import { createPublicReadClient } from '@/lib/supabase/public-read.server';
import { healthStatusSchema } from '@/validations/health.schema';

/**
 * Verifies non-sensitive runtime configuration and database reachability without
 * exposing environment values, software versions, or business rows.
 */
export async function checkRuntimeHealth(signal?: AbortSignal) {
  getServerEnvironment();

  const deadline = AbortSignal.timeout(APP.HEALTH_READ_TIMEOUT_MS);
  const query = createPublicReadClient()
    .from('branches')
    .select('id')
    .eq('is_active', true)
    .limit(1);

  const { error } = await query.abortSignal(
    signal ? AbortSignal.any([signal, deadline]) : deadline,
  );
  if (error) {
    throw new Error('Health database check unavailable');
  }

  return healthStatusSchema.parse({
    status: 'ok',
    checks: { database: 'ok' },
  });
}
