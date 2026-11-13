import 'server-only';

import { CLASSES_LIMITS } from '@/constants/classes.constant';
import { createPublicReadClient } from '@/lib/supabase/public-read.server';
import {
  ADMIN_MEDIA_BUCKETS,
  isSafeStoragePathForBucket,
} from '@/utils/admin-media';

const PROGRAM_PUBLIC_SELECT =
  'id,title,slug,short_description,description,base_price_idr,age_min,age_max,duration_minutes,cover_image_path,cover_storage_bucket,cover_is_approved,cover_alt_text,needs_owner_review,included_items,status';

const SESSION_PUBLIC_SELECT =
  'id,program_id,branch_id,starts_at,ends_at,registration_deadline_at,capacity,seats_left,price_override_idr,status,is_registration_open,branches(id,code,name,city,whatsapp_number,address,is_active)';

function withDeadline(signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(CLASSES_LIMITS.READ_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

export function resolvePublicClassCoverUrl(
  coverStorageBucket: string | null | undefined,
  coverImagePath: string | null | undefined,
  coverIsApproved: boolean | null | undefined,
): string | null {
  if (
    !coverIsApproved ||
    coverStorageBucket !== ADMIN_MEDIA_BUCKETS.CLASS_IMAGES ||
    !coverImagePath ||
    !isSafeStoragePathForBucket(
      ADMIN_MEDIA_BUCKETS.CLASS_IMAGES,
      coverImagePath,
    )
  ) {
    return null;
  }

  const client = createPublicReadClient();
  const storage = (client as { storage?: typeof client.storage }).storage;
  if (!storage) return null;
  const { data } = storage
    .from(ADMIN_MEDIA_BUCKETS.CLASS_IMAGES)
    .getPublicUrl(coverImagePath);
  return data.publicUrl ?? null;
}

export async function readActiveClassBranchesRepo(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('branches')
    .select('id,code,name,city,whatsapp_number,address,is_active')
    .eq('is_active', true)
    .retry(false)
    .order('sort_order')
    .order('name')
    .order('id')
    .limit(20)
    .abortSignal(withDeadline(signal));
  if (error) {
    throw new Error('Class branches read unavailable');
  }
  return data ?? [];
}

export async function readPublicClassProgramsRepo(signal?: AbortSignal) {
  const { data, error } = await createPublicReadClient()
    .from('class_programs')
    .select(PROGRAM_PUBLIC_SELECT)
    .eq('status', 'published')
    .eq('needs_owner_review', false)
    .eq('cover_is_approved', true)
    .retry(false)
    .order('created_at', { ascending: false })
    .order('id')
    .limit(CLASSES_LIMITS.MAX_PROGRAMS)
    .abortSignal(withDeadline(signal));
  if (error) {
    throw new Error('Class programs read unavailable');
  }
  return data ?? [];
}

export async function readPublicClassProgramBySlugRepo(
  slug: string,
  signal?: AbortSignal,
) {
  const { data, error } = await createPublicReadClient()
    .from('class_programs')
    .select(PROGRAM_PUBLIC_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('needs_owner_review', false)
    .eq('cover_is_approved', true)
    .retry(false)
    .abortSignal(withDeadline(signal))
    .maybeSingle();
  if (error) {
    throw new Error('Class program detail read unavailable');
  }
  return data;
}

export async function readPublicClassSessionsRepo(
  programIds?: readonly string[],
  signal?: AbortSignal,
) {
  let query = createPublicReadClient()
    .from('class_sessions')
    .select(SESSION_PUBLIC_SELECT)
    .retry(false)
    .order('starts_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(CLASSES_LIMITS.MAX_SESSIONS);

  if (programIds && programIds.length > 0) {
    query = query.in('program_id', [...programIds]);
  }

  const { data, error } = await query.abortSignal(withDeadline(signal));
  if (error) {
    throw new Error('Class sessions read unavailable');
  }
  return data ?? [];
}

export async function readClassSessionForPrepareRepo(
  sessionId: string,
  signal?: AbortSignal,
) {
  const { data, error } = await createPublicReadClient()
    .from('class_sessions')
    .select(
      'id,program_id,branch_id,starts_at,ends_at,registration_deadline_at,capacity,seats_left,price_override_idr,status,is_registration_open,branches(id,code,name,city,whatsapp_number,address,is_active),class_programs(id,title,slug,base_price_idr,age_min,age_max,cover_image_path,cover_storage_bucket,cover_is_approved,cover_alt_text,needs_owner_review,status)',
    )
    .eq('id', sessionId)
    .retry(false)
    .abortSignal(withDeadline(signal))
    .maybeSingle();

  if (error) {
    throw new Error('Class session prepare read unavailable');
  }
  return data;
}
