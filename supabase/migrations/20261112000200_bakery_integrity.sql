begin;

-- A real row lock serializes cross-table edits, including REPEATABLE READ writers.
-- Unlike an advisory lock alone, its MVCC update prevents stale-snapshot write skew.
create table bakery_private.integrity_guard (id boolean primary key check (id), token boolean not null);
insert into bakery_private.integrity_guard values (true,false);
create function bakery_private.lock_integrity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update bakery_private.integrity_guard set token = not token where id;
  return null;
end;
$$;

create function bakery_private.touch_and_preserve_identity() returns trigger
language plpgsql set search_path = '' as $$
declare field text;
begin
  for field in select a.attname from pg_catalog.pg_index i
    join pg_catalog.pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = tg_relid and i.indisprimary
    union select unnest(array['code','slug','sku']) loop
    if to_jsonb(old) ? field and (to_jsonb(old)->field) is distinct from (to_jsonb(new)->field) then
      raise exception using errcode = '23514', message = 'identity_is_immutable';
    end if;
  end loop;
  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create function bakery_private.valid_cms(payload jsonb, content_key text, published boolean) returns boolean
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
    when 'legal.privacy','legal.ordering_policy' then allowed := array['title','body']; required := allowed;
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
alter table public.site_content add constraint site_content_typed_payload
  check (bakery_private.valid_cms(content_json,key,status = 'published'));

create function bakery_private.validate_integrity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    with recursive ancestry as (
      select id, parent_id, array[id] as path, false as cycle from public.categories
      union all
      select a.id,c.parent_id,a.path || c.id,c.id = any(a.path)
      from ancestry a join public.categories c on c.id = a.parent_id where not a.cycle
    ) select 1 from ancestry where cycle
  ) then raise exception using errcode = '23514', message = 'category_cycle'; end if;
  if exists(select 1 from public.categories c join public.categories p on p.id = c.parent_id
    where c.status = 'published' and p.status <> 'published') then
    raise exception using errcode = '23514', message = 'category_parent_not_published'; end if;

  if exists(select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where (p.product_type <> 'bundle' and (v.bundle_recipe is not null or v.bundle_units_total is not null or v.bundle_rules_verified))
      or (v.bundle_recipe = 'chiffon_mix' and v.bundle_units_total is distinct from 12)) then
    raise exception using errcode = '23514', message = 'variant_bundle_shape'; end if;
  if exists(select 1 from public.option_groups g join public.product_variants v on v.id = g.bundle_variant_id
    join public.products p on p.id = v.product_id where p.product_type <> 'bundle') then
    raise exception using errcode = '23514', message = 'option_parent_not_bundle'; end if;
  if exists(select 1 from public.product_variants v where
    greatest(v.base_price_idr,coalesce((select max(o.price_override_idr) from public.branch_variant_offers o where o.variant_id = v.id),0))
    + coalesce((select sum(prices.delta) from public.option_groups g cross join lateral (
      select coalesce(sum(top_choices.price_delta_idr),0) as delta from (
        select c.price_delta_idr from public.option_choices c where c.group_id = g.id and c.is_active
        order by c.price_delta_idr desc,c.id limit g.max_select
      ) top_choices
    ) prices where g.bundle_variant_id = v.id),0) > 1000000000) then
    raise exception using errcode = '23514', message = 'configured_unit_price_exceeds_cap'; end if;
  if exists(select 1 from public.bundle_fixed_components f
    join public.product_variants b on b.id = f.bundle_variant_id join public.products bp on bp.id = b.product_id
    join public.product_variants c on c.id = f.component_variant_id join public.products cp on cp.id = c.product_id
    where bp.product_type <> 'bundle' or cp.product_type = 'bundle' or bp.id = cp.id) or
    exists(select 1 from public.option_choices ch join public.option_groups g on g.id = ch.group_id
    join public.product_variants b on b.id = g.bundle_variant_id
    left join public.product_variants c on c.id = ch.component_variant_id left join public.products cp on cp.id = c.product_id
    where (b.bundle_recipe = 'chiffon_mix' and c.id is null) or cp.product_type = 'bundle' or b.product_id = c.product_id) then
    raise exception using errcode = '23514', message = 'invalid_bundle_component'; end if;

  -- Verified recipes and every active published bundle must satisfy the same complete recipe.
  if exists(select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where p.product_type = 'bundle' and (v.bundle_rules_verified or (p.status = 'published' and v.status = 'active')) and (
      v.bundle_recipe is distinct from 'chiffon_mix' or v.bundle_units_total is distinct from 12 or not v.bundle_rules_verified
      or (select count(*) from public.bundle_fixed_components f where f.bundle_variant_id = v.id) <> 2
      or exists(select 1 from public.bundle_fixed_components f where f.bundle_variant_id = v.id and f.quantity <> 3)
      or (select count(distinct c.product_id) from public.bundle_fixed_components f
          join public.product_variants c on c.id = f.component_variant_id where f.bundle_variant_id = v.id) <> 2
      or (select count(*) from public.option_groups g where g.bundle_variant_id = v.id) <> 2
      or exists(select 1 from public.option_groups g where g.bundle_variant_id = v.id and
        (g.min_select <> 1 or g.max_select <> 1 or g.quantity_per_selection <> 3 or not g.is_required
         or not exists(select 1 from public.option_choices c where c.group_id = g.id and c.is_active)))
      or exists(select 1 from public.option_groups g join public.option_choices c on c.group_id = g.id and c.is_active
        join public.product_variants cv on cv.id = c.component_variant_id
        join public.bundle_fixed_components f on f.bundle_variant_id = g.bundle_variant_id
        join public.product_variants fv on fv.id = f.component_variant_id
        where g.bundle_variant_id = v.id and cv.product_id = fv.product_id)
      or not exists(select 1 from public.option_groups g1 join public.option_groups g2 on g2.bundle_variant_id = g1.bundle_variant_id and g2.id <> g1.id
        join public.option_choices c1 on c1.group_id = g1.id and c1.is_active
        join public.option_choices c2 on c2.group_id = g2.id and c2.is_active
        join public.product_variants v1 on v1.id = c1.component_variant_id
        join public.product_variants v2 on v2.id = c2.component_variant_id
        where g1.bundle_variant_id = v.id and v1.product_id <> v2.product_id)
    )) then raise exception using errcode = '23514', message = 'invalid_chiffon_recipe'; end if;

  if exists(select 1 from public.products p where p.status = 'published' and (
    p.needs_owner_review
    or not exists(select 1 from public.product_variants v where v.product_id = p.id and v.status = 'active')
    or (p.product_type = 'simple' and (select count(*) from public.product_variants v where v.product_id = p.id and v.status = 'active') <> 1)
    or not exists(select 1 from public.product_categories pc join public.categories c on c.id = pc.category_id
      where pc.product_id = p.id and c.status = 'published')
    or not exists(select 1 from public.product_variants v join public.branch_variant_offers o on o.variant_id = v.id
      join public.branches b on b.id = o.branch_id where v.product_id = p.id and v.status = 'active' and o.is_listed and b.is_active)
    or not exists(select 1 from public.product_images i where i.product_id = p.id and i.is_approved and i.alt_text is not null
      and (i.variant_id is null or exists(select 1 from public.product_variants iv where iv.id = i.variant_id and iv.status = 'active')))
  )) then raise exception using errcode = '23514', message = 'product_not_publish_ready'; end if;

  -- Mapping 'pending' is private metadata, never a claim. Verified GF bundle claim
  -- additionally requires verified GF on every configured component (even if draft).
  if exists(
    with components as (
      select f.bundle_variant_id,f.component_variant_id from public.bundle_fixed_components f
      union
      select g.bundle_variant_id,c.component_variant_id from public.option_groups g
        join public.option_choices c on c.group_id = g.id where c.is_active
    ) select 1 from components x join public.variant_dietary_tags t on t.variant_id = x.bundle_variant_id
      join public.dietary_tags d on d.id = t.dietary_tag_id
      where d.slug = 'gluten-free' and t.verification_status = 'verified' and not exists(
        select 1 from public.variant_dietary_tags ct where ct.variant_id = x.component_variant_id
          and ct.dietary_tag_id = d.id and ct.verification_status = 'verified')
  ) then raise exception using errcode = '23514', message = 'bundle_component_gf_unverified'; end if;

  if exists(
    with components as (
      select f.bundle_variant_id,f.component_variant_id from public.bundle_fixed_components f
      union select g.bundle_variant_id,c.component_variant_id from public.option_groups g
        join public.option_choices c on c.group_id = g.id where c.is_active
    ) select 1 from components x join public.product_variants bv on bv.id = x.bundle_variant_id
      join public.products bp on bp.id = bv.product_id
      join public.product_variants cv on cv.id = x.component_variant_id join public.products cp on cp.id = cv.product_id
      where bp.status = 'published' and bv.status = 'active' and (
        cv.status <> 'active' or cp.status <> 'published' or exists(
          select 1 from public.branch_variant_offers bo join public.branches b on b.id = bo.branch_id
          where bo.variant_id = bv.id and bo.is_listed and b.is_active and not exists(
            select 1 from public.branch_variant_offers co where co.variant_id = cv.id and co.branch_id = bo.branch_id and co.is_listed))
      )
  ) then raise exception using errcode = '23514', message = 'bundle_component_not_offered'; end if;

  if exists(select 1 from public.promotions p where
    (p.scope <> 'category' and exists(select 1 from public.promotion_categories x where x.promotion_id = p.id)) or
    (p.scope <> 'product' and exists(select 1 from public.promotion_products x where x.promotion_id = p.id)) or
    (p.scope <> 'variant' and exists(select 1 from public.promotion_variants x where x.promotion_id = p.id)) or
    (p.status = 'published' and (
      (p.scope = 'category' and not exists(select 1 from public.promotion_categories x join public.categories c on c.id = x.category_id where x.promotion_id = p.id and c.status = 'published')) or
      (p.scope = 'product' and not exists(select 1 from public.promotion_products x join public.products c on c.id = x.product_id where x.promotion_id = p.id and c.status = 'published')) or
      (p.scope = 'variant' and not exists(select 1 from public.promotion_variants x join public.product_variants c on c.id = x.variant_id join public.products pr on pr.id = c.product_id where x.promotion_id = p.id and c.status = 'active' and pr.status = 'published'))
    ))) then raise exception using errcode = '23514', message = 'promotion_target_mismatch'; end if;
  if exists(select 1 from public.class_sessions s join public.class_programs p on p.id = s.program_id
    join public.branches b on b.id = s.branch_id where s.is_registration_open and (p.status <> 'published' or not b.is_active)) then
    raise exception using errcode = '23514', message = 'class_not_registration_ready'; end if;
  return null;
end;
$$;

-- Only tables created by this feature, never unrelated public/extension objects.
do $$
declare tbl text;
begin
  foreach tbl in array array['branches','business_hours','admin_profiles','categories','products','product_categories',
    'product_variants','product_images','branch_variant_offers','option_groups','option_choices','bundle_fixed_components',
    'dietary_tags','variant_dietary_tags','allergens','variant_allergens','promotions','promotion_branches',
    'promotion_categories','promotion_products','promotion_variants','class_programs','class_sessions','testimonials','faqs','site_content'] loop
    execute format('create trigger bakery_serialize before insert or update or delete on public.%I for each statement execute function bakery_private.lock_integrity()',tbl);
    execute format('create trigger bakery_touch before update on public.%I for each row execute function bakery_private.touch_and_preserve_identity()',tbl);
    execute format('create constraint trigger bakery_integrity after insert or update or delete on public.%I deferrable initially deferred for each row execute function bakery_private.validate_integrity()',tbl);
  end loop;
end;
$$;
revoke all on all functions in schema bakery_private from public,anon,authenticated;
revoke all on all tables in schema bakery_private from public,anon,authenticated;
commit;
