import type { z } from 'zod';
import type {
  branchDirectorySchema,
  publicBranchSchema,
} from '@/validations/branch.schema';

export type PublicBranch = z.infer<typeof publicBranchSchema>;
type BranchDirectory = z.infer<typeof branchDirectorySchema>;
export type BranchInitial =
  { status: 'success'; data: BranchDirectory } | { status: 'error' };
interface BranchSwitchRequest {
  currentBranchId: string | null;
  nextBranchId: string;
}
export type BranchSwitchGuard = (
  request: BranchSwitchRequest,
) => boolean | Promise<boolean>;

export interface ApprovedBranchContact {
  code: string;
  name: string;
  whatsappNumber: string;
  address: string | null;
}

export interface ApprovedContacts {
  email: string;
  instagramUrl: string;
  branches: readonly ApprovedBranchContact[];
}
