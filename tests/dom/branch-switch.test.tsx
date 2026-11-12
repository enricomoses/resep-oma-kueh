import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { BranchProvider } from '@/providers/branch-provider';
import { ReactQueryProvider } from '@/providers';
import { useBranches } from '@/hooks/use-branches';
import type { BranchSwitchGuard } from '@/types/branch';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/menu',
  useSearchParams: () => new URLSearchParams('category=bread'),
  useRouter: () => navigation,
}));
const next = {
  id: '11111111-1111-4111-8111-111111111111',
  code: 'surabaya',
  name: 'DEMO',
  city: 'DEMO',
  whatsappNumber: '628000000001',
  address: null,
  mapsUrl: null,
};
afterEach(() => {
  cleanup();
  localStorage.clear();
  navigation.replace.mockClear();
});
function wrapper(guard?: BranchSwitchGuard) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ReactQueryProvider>
        <BranchProvider
          initial={{
            status: 'success',
            data: { items: [next], resolvedBranchId: null },
          }}
          cartItemCount={2}
          beforeBranchChange={guard}
        >
          {children}
        </BranchProvider>
      </ReactQueryProvider>
    );
  };
}
it('does not mutate preference/navigation or reset a nonempty cart before conflict callback approval', async () => {
  const guard = vi.fn().mockResolvedValue(false);
  const { result } = renderHook(useBranches, { wrapper: wrapper(guard) });
  await waitFor(() => expect(result.current.hydrated).toBe(true));
  await act(() => result.current.switchBranch(next));
  expect(result.current.pending).toEqual(next);
  expect(guard).not.toHaveBeenCalled();
  await act(() => result.current.switchBranch(next, true));
  expect(guard).toHaveBeenCalledWith({
    currentBranchId: null,
    nextBranchId: next.id,
  });
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(result.current.cartItemCount).toBe(2);
  guard.mockResolvedValue(true);
  await act(() => result.current.switchBranch(next, true));
  expect(navigation.replace).toHaveBeenCalledWith(
    '/menu?category=bread&branch=surabaya',
    { scroll: false },
  );
  expect(result.current.cartItemCount).toBe(2);
});
it('fails closed when cart revalidation callback is not installed yet', async () => {
  const { result } = renderHook(useBranches, { wrapper: wrapper() });
  await waitFor(() => expect(result.current.hydrated).toBe(true));
  await act(() => result.current.switchBranch(next, true));
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(result.current.notice).toBeTruthy();
  expect(result.current.cartItemCount).toBe(2);
});
