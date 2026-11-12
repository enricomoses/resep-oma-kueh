begin;
-- Private dataset marker; never a customer/order/history table or public RPC.
create table bakery_private.seed_state (
  id boolean primary key default true check(id),
  dataset_kind text not null check(dataset_kind = 'local-demo'),
  seed_version text not null check(seed_version = 'f04-v1'),
  reference_date timestamptz not null,
  created_at timestamptz not null default now()
);
alter table bakery_private.seed_state enable row level security;
revoke all on bakery_private.seed_state from public,anon,authenticated;
commit;
