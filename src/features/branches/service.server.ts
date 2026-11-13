import 'server-only';
import {
  branchDirectorySchema,
  branchQuerySchema,
} from '@/validations/branch.schema';
import type { BranchInitial } from '@/types/branch';
import { readActiveBranches } from './repository.server';

export async function getBranches(input: unknown = {}, signal?: AbortSignal) {
  const query = branchQuerySchema.parse(input);
  const rows = await readActiveBranches(signal);
  const items = rows.map((row) => {
    const raw = row as typeof row & {
      allow_pickup?: boolean;
      allow_delivery?: boolean;
    };
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      city: row.city,
      whatsappNumber: row.whatsapp_number,
      address: row.address,
      mapsUrl: row.maps_url,
      ...(typeof raw.allow_pickup === 'boolean'
        ? { allowPickup: raw.allow_pickup }
        : {}),
      ...(typeof raw.allow_delivery === 'boolean'
        ? { allowDelivery: raw.allow_delivery }
        : {}),
    };
  });
  // Stable URL code resolves to the authoritative active DB UUID here, never from storage.
  return branchDirectorySchema.parse({
    items,
    resolvedBranchId:
      items.find((branch) => branch.code === query.branch)?.id ?? null,
  });
}
export async function getInitialBranches(): Promise<BranchInitial> {
  try {
    return { status: 'success', data: await getBranches() };
  } catch {
    return { status: 'error' };
  }
}
