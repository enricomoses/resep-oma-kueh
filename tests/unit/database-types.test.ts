import { expectTypeOf, it } from 'vitest';

import type { Database } from '@/types/database';

it('keeps actual schema quantity, seats, IDR and RPC fields typed', () => {
  expectTypeOf<
    Database['public']['Tables']['option_groups']['Row']['quantity_per_selection']
  >().toEqualTypeOf<number>();
  expectTypeOf<
    Database['public']['Tables']['class_sessions']['Row']['seats_left']
  >().toEqualTypeOf<number | null>();
  expectTypeOf<
    Database['public']['Tables']['product_variants']['Row']['base_price_idr']
  >().toEqualTypeOf<number>();
  expectTypeOf<
    Database['public']['Functions']['read_active_branches']['Returns'][number]['id']
  >().toEqualTypeOf<string>();
});
