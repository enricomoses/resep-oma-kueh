begin;

alter table public.site_content
  drop constraint if exists site_content_key_check;

alter table public.site_content
  add constraint site_content_key_check check (
    key in (
      'business.contacts',
      'home.hero',
      'home.story',
      'home.class_promo',
      'home.custom_business',
      'about.story',
      'about.values',
      'footer.note',
      'legal.privacy',
      'legal.ordering_policy',
      'community.instagram',
      'promo.shipping_banner'
    )
  );

create or replace function bakery_private.valid_cms(payload jsonb, content_key text, published boolean) returns boolean
language plpgsql immutable set search_path = '' as $$
declare allowed text[]; required text[]; item record;
begin
  if jsonb_typeof(payload) <> 'object' then return false; end if;
  case content_key
    when 'business.contacts' then allowed := array['email','instagram_url']; required := allowed;
    when 'home.hero' then
      allowed := array['headline','subcopy','image_path','image_alt','media_approved'];
      required := allowed;
    when 'home.story','home.class_promo','home.custom_business','about.story' then
      allowed := array['title','body','image_path','image_alt','media_approved']; required := array['title','body'];
    when 'about.values' then allowed := array['items']; required := allowed;
    when 'footer.note' then allowed := array['text']; required := allowed;
    when 'legal.privacy','legal.ordering_policy','promo.shipping_banner' then allowed := array['title','body']; required := allowed;
    when 'community.instagram' then allowed := array['url','items']; required := allowed;
    else return false;
  end case;
  if exists(select 1 from jsonb_object_keys(payload) k where not k = any(allowed)) then return false; end if;
  if published and not payload ?& required then return false; end if;
  for item in select key,value from jsonb_each(payload) loop
    if item.key = 'media_approved' then
      if jsonb_typeof(item.value) <> 'boolean' then return false; end if;
    elsif item.key = 'items' then
      if jsonb_typeof(item.value) <> 'array' then return false; end if;
      if jsonb_array_length(item.value) > 50 or (published and jsonb_array_length(item.value) = 0) then return false; end if;
      if content_key = 'about.values' then
        if exists(select 1 from jsonb_array_elements(item.value) v where jsonb_typeof(v) <> 'string'
          or length(trim(v #>> '{}')) not between 1 and 200) then return false; end if;
      else
        if exists(select 1 from jsonb_array_elements(item.value) v where jsonb_typeof(v) <> 'object'
          or not (v ?& array['image_path','alt','href','media_approved'])
          or (v - array['image_path','alt','href','media_approved']) <> '{}'::jsonb
          or jsonb_typeof(v->'image_path') <> 'string' or length(trim(v->>'image_path')) not between 1 and 500
          or jsonb_typeof(v->'alt') <> 'string' or length(trim(v->>'alt')) not between 1 and 200
          or jsonb_typeof(v->'href') <> 'string' or (v->>'href') !~ '^https://www\.instagram\.com/'
          or jsonb_typeof(v->'media_approved') <> 'boolean'
          or (published and v->'media_approved' <> 'true'::jsonb)) then return false; end if;
      end if;
    else
      if jsonb_typeof(item.value) <> 'string' or length(trim(item.value #>> '{}')) not between 1 and 10000 then return false; end if;
      if item.key in ('instagram_url','url') and (item.value #>> '{}') !~ '^https://www\.instagram\.com/[a-zA-Z0-9_.]+/$' then return false; end if;
      if item.key = 'email' and (item.value #>> '{}') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return false; end if;
    end if;
  end loop;
  -- Plain text/structured media only; no HTML payload or arbitrary remote image destination.
  if payload::text ~ '<[/!A-Za-z]' then return false; end if;
  if payload ? 'image_path' and ((payload->>'image_path') ~ '(^/|://|\\|(^|/)\.\.?(/|$))'
    or length(payload->>'image_path') > 500 or not payload ? 'image_alt'
    or length(payload->>'image_alt') > 200) then return false; end if;
  if published and payload ? 'image_path' and payload->'media_approved' is distinct from 'true'::jsonb then return false; end if;
  if content_key = 'community.instagram' and exists(select 1 from jsonb_array_elements(coalesce(payload->'items','[]')) v
    where v->>'image_path' ~ '(^/|://|\\|(^|/)\.\.?(/|$))') then return false; end if;
  return true;
end;
$$;

-- Transactional Owner promotion save + pivot replacement for F19.
-- Runs as SECURITY INVOKER so table grants, RLS, and bakery_integrity constraints stay active.
create or replace function public.save_admin_promotion(
  p_promotion_id uuid,
  p_expected_updated_at timestamptz,
  p_payload jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.promotions%rowtype;
  v_promotion_id uuid;
  v_new_updated_at timestamptz;
  v_title text;
  v_slug text;
  v_description text;
  v_discount_type text;
  v_discount_value numeric(12,2);
  v_max_discount_idr integer;
  v_min_spend_idr integer;
  v_scope text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_priority integer;
  v_status text;
  v_is_enabled boolean;
  v_is_stackable boolean;
  v_banner_image_path text;
  v_branch_ids uuid[];
  v_category_ids uuid[];
  v_product_ids uuid[];
  v_variant_ids uuid[];
begin
  if not bakery_private.is_owner() then
    raise exception using errcode = '42501', message = 'owner_required';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_promotion_payload';
  end if;

  v_title := trim(coalesce(p_payload->>'title', ''));
  v_slug := trim(coalesce(p_payload->>'slug', ''));
  v_description := nullif(trim(coalesce(p_payload->>'description', '')), '');
  v_discount_type := p_payload->>'discountType';
  v_discount_value := (p_payload->>'discountValue')::numeric(12,2);
  v_max_discount_idr := case
    when p_payload->'maxDiscountIdr' is null or p_payload->>'maxDiscountIdr' is null then null
    else (p_payload->>'maxDiscountIdr')::integer
  end;
  v_min_spend_idr := coalesce((p_payload->>'minSpendIdr')::integer, 0);
  v_scope := p_payload->>'scope';
  v_starts_at := (p_payload->>'startsAt')::timestamptz;
  v_ends_at := (p_payload->>'endsAt')::timestamptz;
  v_priority := coalesce((p_payload->>'priority')::integer, 0);
  v_status := coalesce(p_payload->>'status', 'draft');
  v_is_enabled := coalesce((p_payload->>'isEnabled')::boolean, false);
  v_is_stackable := coalesce((p_payload->>'isStackable')::boolean, false);
  v_banner_image_path := nullif(trim(coalesce(p_payload->>'bannerImagePath', '')), '');

  if v_title = '' or v_slug = '' or v_discount_type is null or v_discount_value is null or v_scope is null or v_starts_at is null or v_ends_at is null then
    raise exception using errcode = '22023', message = 'invalid_promotion_payload';
  end if;

  if v_is_stackable then
    raise exception using errcode = '23514', message = 'promotion_non_stackable';
  end if;

  if v_ends_at <= v_starts_at then
    raise exception using errcode = '23514', message = 'invalid_promotion_period';
  end if;

  select coalesce(array_agg(distinct value::uuid), array[]::uuid[])
  into v_branch_ids
  from jsonb_array_elements_text(coalesce(p_payload->'branchIds', '[]'::jsonb)) as t(value);

  select coalesce(array_agg(distinct value::uuid), array[]::uuid[])
  into v_category_ids
  from jsonb_array_elements_text(coalesce(p_payload->'categoryIds', '[]'::jsonb)) as t(value);

  select coalesce(array_agg(distinct value::uuid), array[]::uuid[])
  into v_product_ids
  from jsonb_array_elements_text(coalesce(p_payload->'productIds', '[]'::jsonb)) as t(value);

  select coalesce(array_agg(distinct value::uuid), array[]::uuid[])
  into v_variant_ids
  from jsonb_array_elements_text(coalesce(p_payload->'variantIds', '[]'::jsonb)) as t(value);

  if p_promotion_id is null then
    insert into public.promotions (
      title,
      slug,
      description,
      discount_type,
      discount_value,
      max_discount_idr,
      min_spend_idr,
      scope,
      starts_at,
      ends_at,
      priority,
      status,
      is_enabled,
      is_stackable,
      banner_image_path
    ) values (
      v_title,
      v_slug,
      v_description,
      v_discount_type,
      v_discount_value,
      v_max_discount_idr,
      v_min_spend_idr,
      v_scope,
      v_starts_at,
      v_ends_at,
      v_priority,
      v_status,
      v_is_enabled,
      false,
      v_banner_image_path
    )
    returning id, updated_at into v_promotion_id, v_new_updated_at;
  else
    select * into v_existing
    from public.promotions
    where id = p_promotion_id
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'promotion_not_found';
    end if;

    if p_expected_updated_at is null
      or v_existing.updated_at is distinct from p_expected_updated_at then
      raise exception using errcode = '40900', message = 'stale_conflict';
    end if;

    if v_existing.slug is distinct from v_slug then
      raise exception using errcode = '23514', message = 'identity_is_immutable';
    end if;

    update public.promotions
    set
      title = v_title,
      description = v_description,
      discount_type = v_discount_type,
      discount_value = v_discount_value,
      max_discount_idr = v_max_discount_idr,
      min_spend_idr = v_min_spend_idr,
      scope = v_scope,
      starts_at = v_starts_at,
      ends_at = v_ends_at,
      priority = v_priority,
      status = v_status,
      is_enabled = v_is_enabled,
      is_stackable = false,
      banner_image_path = v_banner_image_path
    where id = p_promotion_id
    returning id, updated_at into v_promotion_id, v_new_updated_at;

    delete from public.promotion_branches where promotion_id = v_promotion_id;
    delete from public.promotion_categories where promotion_id = v_promotion_id;
    delete from public.promotion_products where promotion_id = v_promotion_id;
    delete from public.promotion_variants where promotion_id = v_promotion_id;
  end if;

  if exists(
    select 1 from unnest(v_branch_ids) b_id
    where not exists(select 1 from public.branches b where b.id = b_id)
  ) then
    raise exception using errcode = 'P0002', message = 'branch_not_found';
  end if;

  if v_status = 'published' then
    if coalesce(array_length(v_branch_ids, 1), 0) > 0
      and not exists(select 1 from public.branches b where b.id = any(v_branch_ids) and b.is_active) then
      raise exception using errcode = '23514', message = 'promotion_branch_inactive';
    end if;

    if coalesce(array_length(v_branch_ids, 1), 0) = 0
      and not exists(select 1 from public.branches b where b.is_active) then
      raise exception using errcode = '23514', message = 'promotion_branch_inactive';
    end if;
  end if;

  insert into public.promotion_branches (promotion_id, branch_id)
  select v_promotion_id, b_id
  from unnest(v_branch_ids) as b_id;

  if v_scope = 'all' then
    if coalesce(array_length(v_category_ids, 1), 0) > 0
      or coalesce(array_length(v_product_ids, 1), 0) > 0
      or coalesce(array_length(v_variant_ids, 1), 0) > 0 then
      raise exception using errcode = '23514', message = 'promotion_target_mismatch';
    end if;
  elsif v_scope = 'category' then
    if coalesce(array_length(v_product_ids, 1), 0) > 0
      or coalesce(array_length(v_variant_ids, 1), 0) > 0 then
      raise exception using errcode = '23514', message = 'promotion_target_mismatch';
    end if;
    if exists(
      select 1 from unnest(v_category_ids) c_id
      where not exists(select 1 from public.categories c where c.id = c_id)
    ) then
      raise exception using errcode = 'P0002', message = 'promotion_target_not_found';
    end if;
    insert into public.promotion_categories (promotion_id, category_id)
    select v_promotion_id, c_id from unnest(v_category_ids) as c_id;
  elsif v_scope = 'product' then
    if coalesce(array_length(v_category_ids, 1), 0) > 0
      or coalesce(array_length(v_variant_ids, 1), 0) > 0 then
      raise exception using errcode = '23514', message = 'promotion_target_mismatch';
    end if;
    if exists(
      select 1 from unnest(v_product_ids) p_id
      where not exists(select 1 from public.products pr where pr.id = p_id)
    ) then
      raise exception using errcode = 'P0002', message = 'promotion_target_not_found';
    end if;
    insert into public.promotion_products (promotion_id, product_id)
    select v_promotion_id, p_id from unnest(v_product_ids) as p_id;
  elsif v_scope = 'variant' then
    if coalesce(array_length(v_category_ids, 1), 0) > 0
      or coalesce(array_length(v_product_ids, 1), 0) > 0 then
      raise exception using errcode = '23514', message = 'promotion_target_mismatch';
    end if;
    if exists(
      select 1 from unnest(v_variant_ids) v_id
      where not exists(select 1 from public.product_variants pv where pv.id = v_id)
    ) then
      raise exception using errcode = 'P0002', message = 'promotion_target_not_found';
    end if;
    insert into public.promotion_variants (promotion_id, variant_id)
    select v_promotion_id, v_id from unnest(v_variant_ids) as v_id;
  else
    raise exception using errcode = '22023', message = 'invalid_promotion_scope';
  end if;

  set constraints all immediate;

  return jsonb_build_object(
    'id', v_promotion_id,
    'updatedAt', v_new_updated_at
  );
end;
$$;

revoke all on function public.save_admin_promotion(uuid, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.save_admin_promotion(uuid, timestamptz, jsonb) to authenticated;

create or replace function public.archive_admin_promotion(
  p_promotion_id uuid,
  p_expected_updated_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.promotions%rowtype;
  v_new_updated_at timestamptz;
begin
  if not bakery_private.is_owner() then
    raise exception using errcode = '42501', message = 'owner_required';
  end if;

  if p_promotion_id is null then
    raise exception using errcode = '22023', message = 'invalid_promotion_id';
  end if;

  select * into v_existing
  from public.promotions
  where id = p_promotion_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'promotion_not_found';
  end if;

  if p_expected_updated_at is null
    or v_existing.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40900', message = 'stale_conflict';
  end if;

  update public.promotions
  set
    status = 'archived',
    is_enabled = false
  where id = p_promotion_id
  returning updated_at into v_new_updated_at;

  set constraints all immediate;

  return jsonb_build_object(
    'id', p_promotion_id,
    'updatedAt', v_new_updated_at
  );
end;
$$;

revoke all on function public.archive_admin_promotion(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.archive_admin_promotion(uuid, timestamptz) to authenticated;

notify pgrst, 'reload schema';
commit;
