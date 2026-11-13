begin;

-- Transactional weekly business_hours replace for F18 Owner Branch Locations & Hours.
-- Runs as SECURITY INVOKER so table grants, RLS, and bakery_integrity constraints stay active.
create or replace function public.replace_branch_hours(
  p_branch_id uuid,
  p_expected_branch_updated_at timestamptz,
  p_hours jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_branch public.branches%rowtype;
  v_item jsonb;
  v_day integer;
  v_seen_days integer[] := array[]::integer[];
  v_is_closed boolean;
  v_opens time;
  v_closes time;
  v_note text;
  v_new_updated_at timestamptz;
begin
  if not bakery_private.is_owner() then
    raise exception using errcode = '42501', message = 'owner_required';
  end if;

  if p_branch_id is null
    or p_expected_branch_updated_at is null
    or jsonb_typeof(p_hours) <> 'array'
    or jsonb_array_length(p_hours) <> 7 then
    raise exception using errcode = '22023', message = 'invalid_branch_hours_payload';
  end if;

  select * into v_branch
  from public.branches
  where id = p_branch_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'branch_not_found';
  end if;

  if v_branch.updated_at is distinct from p_expected_branch_updated_at then
    raise exception using errcode = '40900', message = 'stale_conflict';
  end if;

  delete from public.business_hours
  where branch_id = p_branch_id;

  for v_item in select value from jsonb_array_elements(p_hours) loop
    if jsonb_typeof(v_item) <> 'object'
      or not (v_item ? 'dayOfWeek')
      or jsonb_typeof(v_item->'dayOfWeek') <> 'number' then
      raise exception using errcode = '22023', message = 'invalid_branch_hours_payload';
    end if;

    v_day := (v_item->>'dayOfWeek')::integer;
    if v_day < 0 or v_day > 6 or v_day = any(v_seen_days) then
      raise exception using errcode = '22023', message = 'invalid_day_of_week';
    end if;
    v_seen_days := array_append(v_seen_days, v_day);

    v_is_closed := coalesce((v_item->>'isClosed')::boolean, false);
    v_opens := nullif(trim(coalesce(v_item->>'opensAt', '')), '')::time;
    v_closes := nullif(trim(coalesce(v_item->>'closesAt', '')), '')::time;
    v_note := nullif(trim(coalesce(v_item->>'note', '')), '');

    if v_is_closed and (v_opens is not null or v_closes is not null) then
      raise exception using errcode = '23514', message = 'invalid_closed_hours';
    end if;

    if not v_is_closed and ((v_opens is null) <> (v_closes is null)) then
      raise exception using errcode = '23514', message = 'incomplete_open_hours';
    end if;

    if not v_is_closed and v_opens is not null and v_closes <= v_opens then
      raise exception using errcode = '23514', message = 'invalid_hours_range';
    end if;

    insert into public.business_hours (
      branch_id,
      day_of_week,
      opens_at,
      closes_at,
      is_closed,
      note
    ) values (
      p_branch_id,
      v_day,
      v_opens,
      v_closes,
      v_is_closed,
      v_note
    );
  end loop;

  if coalesce(array_length(v_seen_days, 1), 0) <> 7 then
    raise exception using errcode = '22023', message = 'invalid_branch_hours_payload';
  end if;

  set constraints all immediate;

  update public.branches
  set updated_at = clock_timestamp()
  where id = p_branch_id
  returning updated_at into v_new_updated_at;

  return jsonb_build_object(
    'branchId', p_branch_id,
    'updatedAt', v_new_updated_at
  );
end;
$$;

revoke all on function public.replace_branch_hours(uuid, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.replace_branch_hours(uuid, timestamptz, jsonb) to authenticated;

-- Transactional owner offer & optional base-price update for F18 Branch Availability.
-- Runs as SECURITY INVOKER so owner-only RLS, price triggers, and bundle listing integrity remain active.
create or replace function public.owner_upsert_branch_offer(
  p_branch_id uuid,
  p_variant_id uuid,
  p_expected_offer_updated_at timestamptz,
  p_expected_variant_updated_at timestamptz,
  p_update_base_price boolean,
  p_base_price_idr integer,
  p_is_listed boolean,
  p_availability_status text,
  p_stock_quantity integer,
  p_price_override_idr integer
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_branch public.branches%rowtype;
  v_variant public.product_variants%rowtype;
  v_offer public.branch_variant_offers%rowtype;
  v_new_variant_updated_at timestamptz;
  v_new_offer_updated_at timestamptz;
begin
  if not bakery_private.is_owner() then
    raise exception using errcode = '42501', message = 'owner_required';
  end if;

  if p_branch_id is null
    or p_variant_id is null
    or p_availability_status not in ('available', 'sold_out', 'unconfirmed') then
    raise exception using errcode = '22023', message = 'invalid_offer_payload';
  end if;

  if p_stock_quantity is not null and p_stock_quantity < 0 then
    raise exception using errcode = '23514', message = 'invalid_stock_quantity';
  end if;

  if p_stock_quantity = 0 and p_availability_status <> 'sold_out' then
    raise exception using errcode = '23514', message = 'zero_stock_requires_sold_out';
  end if;

  if p_price_override_idr is not null and (p_price_override_idr < 0 or p_price_override_idr > 1000000000) then
    raise exception using errcode = '22023', message = 'invalid_price_override';
  end if;

  select * into v_branch
  from public.branches
  where id = p_branch_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'branch_not_found';
  end if;

  select * into v_variant
  from public.product_variants
  where id = p_variant_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'variant_not_found';
  end if;

  if v_variant.status <> 'active' then
    raise exception using errcode = '23514', message = 'variant_not_active';
  end if;

  if coalesce(p_update_base_price, false) then
    if p_expected_variant_updated_at is null
      or v_variant.updated_at is distinct from p_expected_variant_updated_at then
      raise exception using errcode = '40900', message = 'stale_variant_conflict';
    end if;

    if p_base_price_idr is null or p_base_price_idr < 0 or p_base_price_idr > 1000000000 then
      raise exception using errcode = '22023', message = 'invalid_base_price';
    end if;

    update public.product_variants
    set base_price_idr = p_base_price_idr
    where id = p_variant_id
    returning updated_at into v_new_variant_updated_at;
  else
    v_new_variant_updated_at := v_variant.updated_at;
  end if;

  select * into v_offer
  from public.branch_variant_offers
  where branch_id = p_branch_id
    and variant_id = p_variant_id
  for update;

  if found then
    if p_expected_offer_updated_at is null
      or v_offer.updated_at is distinct from p_expected_offer_updated_at then
      raise exception using errcode = '40900', message = 'stale_conflict';
    end if;

    update public.branch_variant_offers
    set
      is_listed = coalesce(p_is_listed, false),
      availability_status = p_availability_status,
      stock_quantity = p_stock_quantity,
      price_override_idr = p_price_override_idr
    where branch_id = p_branch_id
      and variant_id = p_variant_id
    returning updated_at into v_new_offer_updated_at;
  else
    if p_expected_offer_updated_at is not null then
      raise exception using errcode = '40900', message = 'stale_conflict';
    end if;

    insert into public.branch_variant_offers (
      branch_id,
      variant_id,
      is_listed,
      availability_status,
      stock_quantity,
      price_override_idr
    ) values (
      p_branch_id,
      p_variant_id,
      coalesce(p_is_listed, false),
      p_availability_status,
      p_stock_quantity,
      p_price_override_idr
    )
    returning updated_at into v_new_offer_updated_at;
  end if;

  set constraints all immediate;

  return jsonb_build_object(
    'branchId', p_branch_id,
    'variantId', p_variant_id,
    'offerUpdatedAt', v_new_offer_updated_at,
    'variantUpdatedAt', v_new_variant_updated_at
  );
end;
$$;

revoke all on function public.owner_upsert_branch_offer(uuid, uuid, timestamptz, timestamptz, boolean, integer, boolean, text, integer, integer) from public, anon, authenticated;
grant execute on function public.owner_upsert_branch_offer(uuid, uuid, timestamptz, timestamptz, boolean, integer, boolean, text, integer, integer) to authenticated;

notify pgrst, 'reload schema';
commit;
