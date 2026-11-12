import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { QUERY_KEYS } from '@/constants';
import { ReactQueryProvider } from '@/providers';
import { cn } from '@/utils';

afterEach(cleanup);

it('retains one QueryClient across re-renders and isolates separate mounts', () => {
  const observed: QueryClient[] = [];
  function Observe() {
    observed.push(useQueryClient());
    return null;
  }
  const view = render(
    <ReactQueryProvider>
      <Observe />
    </ReactQueryProvider>,
  );
  const first = observed[0];
  first.setQueryData([...QUERY_KEYS.ROOT, 'fixture'], 'cached');
  view.rerender(
    <ReactQueryProvider>
      <Observe />
    </ReactQueryProvider>,
  );
  expect(observed.at(-1)).toBe(first);
  expect(observed.at(-1)?.getQueryData([...QUERY_KEYS.ROOT, 'fixture'])).toBe(
    'cached',
  );
  view.unmount();
  render(
    <ReactQueryProvider>
      <Observe />
    </ReactQueryProvider>,
  );
  expect(observed.at(-1)).not.toBe(first);
  expect(
    observed.at(-1)?.getQueryData([...QUERY_KEYS.ROOT, 'fixture']),
  ).toBeUndefined();
  observed.forEach((client) => client.clear());
});

it('cn merges consumer classes rather than leaving conflicting Tailwind utilities', () => {
  expect(cn('p-2 text-sm', false, { 'font-bold': true }, 'p-4')).toBe(
    'text-sm font-bold p-4',
  );
});
