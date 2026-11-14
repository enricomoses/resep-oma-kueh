import 'server-only';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { APPROVED_CONTACTS } from '@/constants/contacts.constant';
import { AuthForbiddenError } from '@/features/auth/errors.server';
import { createServerAuthClient } from '@/lib/supabase/server';
import type {
  AdminBranchHourItem,
  AdminBranchItem,
  AdminBranchesResponse,
  ReplaceBranchHoursInput,
  UpdateAdminBranchInput,
} from '@/types/admin-catalog';
import type { AdminSessionProfile } from '@/types/auth';
import type { Json } from '@/types/database';
import {
  buildWhatsappTargetUrl,
  normalizeTimeHHMM,
  normalizeWhatsappDigits,
} from '@/utils/admin-branches';

import {
  AdminCatalogConflictError,
  AdminCatalogNotFoundError,
  AdminCatalogUpstreamError,
  AdminCatalogValidationError,
} from './errors.server';
import { revalidatePublicLocationAndOfferPaths } from './http.server';
import type { AdminRepoContext } from './repository.server';

interface RawBranchRow {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string | null;
  maps_url: string | null;
  whatsapp_number: string;
  description: string | null;
  allow_pickup: boolean;
  allow_delivery: boolean;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

interface RawBusinessHourRow {
  id: string;
  branch_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  note: string | null;
}

function assertOwner(profile: AdminSessionProfile): void {
  if (profile.role !== 'owner') {
    throw new AuthForbiddenError(
      ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.OWNER_ONLY,
    );
  }
}

function mapHoursRows(rows: RawBusinessHourRow[]): AdminBranchHourItem[] {
  return rows
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((row) => ({
      id: row.id,
      branchId: row.branch_id,
      dayOfWeek: row.day_of_week,
      opensAt: normalizeTimeHHMM(row.opens_at),
      closesAt: normalizeTimeHHMM(row.closes_at),
      isClosed: Boolean(row.is_closed),
      note: row.note ?? null,
    }));
}

function mapBranchRow(
  row: RawBranchRow,
  hourRows: RawBusinessHourRow[],
): AdminBranchItem {
  const hours = mapHoursRows(hourRows);
  const code = row.code === 'bintaro' ? 'bintaro' : 'surabaya';
  const whatsappTargetUrl = buildWhatsappTargetUrl(row.whatsapp_number) ?? '';

  return {
    id: row.id,
    code,
    name: row.name,
    city: row.city,
    address: row.address ?? null,
    mapsUrl: row.maps_url ?? null,
    whatsappNumber: row.whatsapp_number,
    description: row.description ?? null,
    allowPickup: Boolean(row.allow_pickup),
    allowDelivery: Boolean(row.allow_delivery),
    sortOrder: row.sort_order,
    isActive: Boolean(row.is_active),
    updatedAt: row.updated_at,
    hours,
    readiness: {
      hasConfirmedAddress: Boolean(
        row.address && row.address.trim().length > 0,
      ),
      hasMapsUrl: Boolean(row.maps_url && row.maps_url.trim().length > 0),
      hasVerifiedHours: hours.some(
        (item) =>
          item.isClosed || (item.opensAt !== null && item.closesAt !== null),
      ),
      fulfillmentEnabled: Boolean(row.allow_pickup || row.allow_delivery),
      officialEmail: APPROVED_CONTACTS.email,
      whatsappTargetUrl,
    },
  };
}

function mapBranchPgError(error: {
  code?: string | null;
  message?: string | null;
}): never {
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();

  if (code === '42501') {
    throw new AuthForbiddenError(
      ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.OWNER_ONLY,
    );
  }
  if (code === 'P0002') {
    throw new AdminCatalogNotFoundError();
  }
  if (code === '40900') {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.STALE_CONFLICT,
    );
  }
  if (code === '23514' || code === '22023') {
    if (msg.includes('whatsapp')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_WHATSAPP,
        {
          whatsappNumber: [
            ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_WHATSAPP,
          ],
        },
      );
    }
    if (msg.includes('maps_url')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_MAPS_URL,
        { mapsUrl: [ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_MAPS_URL] },
      );
    }
    if (msg.includes('invalid_closed_hours')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_CLOSED_HOURS,
        { hours: [ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_CLOSED_HOURS] },
      );
    }
    if (msg.includes('incomplete_open_hours')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INCOMPLETE_HOURS,
        { hours: [ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INCOMPLETE_HOURS] },
      );
    }
    if (msg.includes('invalid_hours_range')) {
      throw new AdminCatalogValidationError(
        ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_OVERNIGHT_RANGE,
        {
          hours: [ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_OVERNIGHT_RANGE],
        },
      );
    }
    throw new AdminCatalogValidationError();
  }

  throw new AdminCatalogUpstreamError();
}

export async function listAdminBranches(
  profile: AdminSessionProfile,
  ctx: AdminRepoContext = {},
): Promise<AdminBranchesResponse> {
  assertOwner(profile);
  const supabase = await createServerAuthClient(ctx.response);

  let branchQuery = supabase
    .from('branches')
    .select(
      'id,code,name,city,address,maps_url,whatsapp_number,description,allow_pickup,allow_delivery,sort_order,is_active,updated_at',
    )
    .order('sort_order')
    .order('name')
    .order('id');

  if (ctx.signal) {
    branchQuery = branchQuery.abortSignal(ctx.signal);
  }

  const { data: branchRows, error: branchError } = await branchQuery;
  if (branchError) {
    mapBranchPgError(branchError);
  }

  const typedBranches = (branchRows ?? []) as RawBranchRow[];
  let hoursByBranch = new Map<string, RawBusinessHourRow[]>();

  if (typedBranches.length > 0) {
    let hoursQuery = supabase
      .from('business_hours')
      .select('id,branch_id,day_of_week,opens_at,closes_at,is_closed,note')
      .in(
        'branch_id',
        typedBranches.map((item) => item.id),
      )
      .order('day_of_week');

    if (ctx.signal) {
      hoursQuery = hoursQuery.abortSignal(ctx.signal);
    }

    const { data: hourRows, error: hoursError } = await hoursQuery;
    if (hoursError) {
      mapBranchPgError(hoursError);
    }

    const grouped = new Map<string, RawBusinessHourRow[]>();
    for (const hourRow of (hourRows ?? []) as RawBusinessHourRow[]) {
      const existing = grouped.get(hourRow.branch_id);
      if (existing) {
        existing.push(hourRow);
      } else {
        grouped.set(hourRow.branch_id, [hourRow]);
      }
    }
    hoursByBranch = grouped;
  }

  const branches = typedBranches.map((row) =>
    mapBranchRow(row, hoursByBranch.get(row.id) ?? []),
  );
  const bintaro = branches.find((item) => item.code === 'bintaro');

  const surabayaConfirmedAddress =
    APPROVED_CONTACTS.branches.find((item) => item.code === 'surabaya')
      ?.address ?? '';

  return {
    branches,
    approvedContacts: {
      email: APPROVED_CONTACTS.email,
      instagramUrl: APPROVED_CONTACTS.instagramUrl,
      surabayaConfirmedAddress,
      bintaroAddressResolved: Boolean(
        bintaro?.address && bintaro.address.trim().length > 0,
      ),
    },
  };
}

export async function getAdminBranchById(
  profile: AdminSessionProfile,
  branchId: string,
  ctx: AdminRepoContext = {},
): Promise<AdminBranchItem> {
  assertOwner(profile);
  const supabase = await createServerAuthClient(ctx.response);

  let branchQuery = supabase
    .from('branches')
    .select(
      'id,code,name,city,address,maps_url,whatsapp_number,description,allow_pickup,allow_delivery,sort_order,is_active,updated_at',
    )
    .eq('id', branchId);

  if (ctx.signal) {
    branchQuery = branchQuery.abortSignal(ctx.signal);
  }

  const { data: branchRow, error: branchError } =
    await branchQuery.maybeSingle();
  if (branchError) {
    mapBranchPgError(branchError);
  }
  if (!branchRow) {
    throw new AdminCatalogNotFoundError();
  }

  let hoursQuery = supabase
    .from('business_hours')
    .select('id,branch_id,day_of_week,opens_at,closes_at,is_closed,note')
    .eq('branch_id', branchId)
    .order('day_of_week');

  if (ctx.signal) {
    hoursQuery = hoursQuery.abortSignal(ctx.signal);
  }

  const { data: hourRows, error: hoursError } = await hoursQuery;
  if (hoursError) {
    mapBranchPgError(hoursError);
  }

  return mapBranchRow(
    branchRow as RawBranchRow,
    (hourRows ?? []) as RawBusinessHourRow[],
  );
}

export async function updateAdminBranch(
  profile: AdminSessionProfile,
  branchId: string,
  input: UpdateAdminBranchInput,
  ctx: AdminRepoContext,
): Promise<AdminBranchItem> {
  assertOwner(profile);
  const supabase = await createServerAuthClient(ctx.response);

  let readQuery = supabase
    .from('branches')
    .select(
      'id,code,name,city,address,maps_url,whatsapp_number,description,allow_pickup,allow_delivery,sort_order,is_active,updated_at',
    )
    .eq('id', branchId);

  if (ctx.signal) {
    readQuery = readQuery.abortSignal(ctx.signal);
  }

  const { data: existingRow, error: readError } = await readQuery.maybeSingle();
  if (readError) {
    mapBranchPgError(readError);
  }
  if (!existingRow) {
    throw new AdminCatalogNotFoundError();
  }

  const existing = existingRow as RawBranchRow;
  if (existing.updated_at !== input.expectedUpdatedAt) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.STALE_CONFLICT,
    );
  }

  const normalizedWa = normalizeWhatsappDigits(input.whatsappNumber);
  if (!normalizedWa) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_WHATSAPP,
      {
        whatsappNumber: [ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.INVALID_WHATSAPP],
      },
    );
  }

  if (
    normalizedWa !== existing.whatsapp_number &&
    !input.confirmWhatsappChange
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.WHATSAPP_REVERIFY_REQUIRED,
      {
        confirmWhatsappChange: [
          ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.WHATSAPP_REVERIFY_REQUIRED,
        ],
      },
    );
  }

  const enablesPickup = !existing.allow_pickup && input.allowPickup;
  const enablesDelivery = !existing.allow_delivery && input.allowDelivery;
  if (
    (enablesPickup || enablesDelivery) &&
    !input.fulfillmentReviewedForProduction
  ) {
    throw new AdminCatalogValidationError(
      ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.FULFILLMENT_REVIEW_REQUIRED,
      {
        fulfillmentReviewedForProduction: [
          ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.FULFILLMENT_REVIEW_REQUIRED,
        ],
      },
    );
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from('branches')
    .update({
      name: input.name,
      city: input.city,
      address: input.address,
      maps_url: input.mapsUrl,
      whatsapp_number: normalizedWa,
      description: input.description,
      allow_pickup: input.allowPickup,
      allow_delivery: input.allowDelivery,
      sort_order: input.sortOrder,
    })
    .eq('id', branchId)
    .eq('updated_at', input.expectedUpdatedAt)
    .select('id,updated_at')
    .maybeSingle();

  if (updateError) {
    mapBranchPgError(updateError);
  }
  if (!updatedRow) {
    throw new AdminCatalogConflictError(
      ADMIN_CATALOG_COPY.LOCATIONS.ERRORS.STALE_CONFLICT,
    );
  }

  revalidatePublicLocationAndOfferPaths();
  return getAdminBranchById(profile, branchId, ctx);
}

export async function replaceAdminBranchHours(
  profile: AdminSessionProfile,
  branchId: string,
  input: ReplaceBranchHoursInput,
  ctx: AdminRepoContext,
): Promise<AdminBranchItem> {
  assertOwner(profile);
  const supabase = await createServerAuthClient(ctx.response);

  let rpcQuery = supabase.rpc('replace_branch_hours', {
    p_branch_id: branchId,
    p_expected_branch_updated_at: input.expectedUpdatedAt,
    p_hours: input.hours as unknown as Json,
  });

  if (ctx.signal) {
    rpcQuery = rpcQuery.abortSignal(ctx.signal);
  }

  const { error: rpcError } = await rpcQuery;
  if (rpcError) {
    mapBranchPgError(rpcError);
  }

  revalidatePublicLocationAndOfferPaths();
  return getAdminBranchById(profile, branchId, ctx);
}
