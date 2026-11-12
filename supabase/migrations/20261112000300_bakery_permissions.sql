begin;

revoke create on schema public from public,anon,authenticated;
alter default privileges for role postgres in schema public revoke all on tables from public,anon,authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from public,anon,authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public,anon,authenticated;
revoke all on all tables in schema public from public,anon,authenticated;
revoke all on all sequences in schema public from public,anon,authenticated;
revoke all on all functions in schema public from public,anon,authenticated;
grant usage on schema public,bakery_private to anon,authenticated;

-- No user_metadata/JWT role flags. These functions avoid admin_profiles RLS recursion.
create function bakery_private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_profiles p
    where p.user_id = (select auth.uid()) and p.is_active and p.role = 'owner');
$$;
create function bakery_private.can_manage_branch(branch_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_profiles p where p.user_id = (select auth.uid()) and p.is_active
    and (p.role = 'owner' or (p.role = 'branch_admin' and p.branch_id = branch_uuid
      and exists(select 1 from public.branches b where b.id = branch_uuid and b.is_active))));
$$;
create function bakery_private.public_category(category_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  with recursive ancestors as (
    select c.id,c.parent_id,c.status,array[c.id] as path from public.categories c where c.id = category_uuid
    union all select c.id,c.parent_id,c.status,a.path || c.id from public.categories c
      join ancestors a on c.id = a.parent_id where not c.id = any(a.path)
  ) select exists(select 1 from ancestors) and not exists(select 1 from ancestors where status <> 'published');
$$;
create function bakery_private.public_product(product_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.products p where p.id = product_uuid and p.status = 'published'
    and not p.needs_owner_review
    and exists(select 1 from public.product_categories pc where pc.product_id = p.id and bakery_private.public_category(pc.category_id))
    and exists(select 1 from public.product_variants v join public.branch_variant_offers o on o.variant_id = v.id
      join public.branches b on b.id = o.branch_id where v.product_id = p.id and v.status = 'active' and o.is_listed and b.is_active)
    and exists(select 1 from public.product_images i where i.product_id = p.id and i.is_approved
      and i.storage_bucket = 'product-images' and i.alt_text is not null
      and (i.variant_id is null or exists(select 1 from public.product_variants v where v.id = i.variant_id and v.status = 'active'
        and exists(select 1 from public.branch_variant_offers o join public.branches b on b.id=o.branch_id
          where o.variant_id=v.id and o.is_listed and b.is_active)))));
$$;
create function bakery_private.public_variant(variant_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.product_variants v where v.id = variant_uuid and v.status = 'active'
    and bakery_private.public_product(v.product_id)
    and exists(select 1 from public.branch_variant_offers o join public.branches b on b.id=o.branch_id
      where o.variant_id=v.id and o.is_listed and b.is_active));
$$;
create function bakery_private.manageable_variant(variant_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  -- Staff must be able to relist its own hidden offer without exposing it publicly.
  select exists(select 1 from public.product_variants v where v.id=variant_uuid and v.status='active'
    and bakery_private.public_product(v.product_id));
$$;
create function bakery_private.public_option_group(group_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.option_groups g where g.id = group_uuid and bakery_private.public_variant(g.bundle_variant_id));
$$;
create function bakery_private.public_promotion(promotion_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.promotions p where p.id = promotion_uuid and p.status = 'published' and p.is_enabled
    and p.starts_at <= now() and now() < p.ends_at
    and (not exists(select 1 from public.promotion_branches x where x.promotion_id = p.id)
      or exists(select 1 from public.promotion_branches x join public.branches b on b.id = x.branch_id
        where x.promotion_id = p.id and b.is_active))
    and (p.scope = 'all'
      or (p.scope = 'category' and exists(select 1 from public.promotion_categories x where x.promotion_id = p.id and bakery_private.public_category(x.category_id)))
      or (p.scope = 'product' and exists(select 1 from public.promotion_products x where x.promotion_id = p.id and bakery_private.public_product(x.product_id)))
      or (p.scope = 'variant' and exists(select 1 from public.promotion_variants x where x.promotion_id = p.id and bakery_private.public_variant(x.variant_id)))));
$$;
create function bakery_private.public_class(program_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.class_programs p where p.id = program_uuid and p.status = 'published'
    and not p.needs_owner_review and p.cover_is_approved and p.cover_storage_bucket = 'class-images'
    and p.cover_image_path is not null and p.cover_alt_text is not null);
$$;
create function bakery_private.public_testimonial(testimonial_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.testimonials t where t.id = testimonial_uuid and t.status = 'published'
    and t.consent_at is not null and length(trim(t.consent_reference)) > 0);
$$;

revoke all on all functions in schema bakery_private from public,anon,authenticated;
grant execute on function bakery_private.is_owner(),bakery_private.can_manage_branch(uuid),bakery_private.manageable_variant(uuid) to authenticated;
grant execute on function bakery_private.public_category(uuid),bakery_private.public_product(uuid),
  bakery_private.public_variant(uuid),bakery_private.public_option_group(uuid),bakery_private.public_promotion(uuid),
  bakery_private.public_class(uuid),bakery_private.public_testimonial(uuid) to anon,authenticated;
-- Pure payload validator is required by the CMS CHECK, never a Data API RPC.
grant execute on function bakery_private.valid_cms(jsonb,text,boolean) to authenticated;

do $$
declare tbl text;
begin
  foreach tbl in array array['branches','business_hours','categories','products','product_categories',
    'product_variants','product_images','branch_variant_offers','option_groups','option_choices','bundle_fixed_components',
    'dietary_tags','variant_dietary_tags','allergens','variant_allergens','promotions','promotion_branches',
    'promotion_categories','promotion_products','promotion_variants','class_programs','class_sessions','testimonials','faqs','site_content'] loop
    execute format('grant insert,update,delete on public.%I to authenticated',tbl);
    if tbl not in ('variant_dietary_tags','variant_allergens','testimonials','site_content') then
      execute format('grant select on public.%I to anon,authenticated',tbl);
    end if;
    execute format('create policy owner_manage on public.%I for all to authenticated using ((select bakery_private.is_owner())) with check ((select bakery_private.is_owner()))',tbl);
  end loop;
end;
$$;
-- A table-wide SELECT grant would override these column restrictions. No SELECT *.
grant select(variant_id,dietary_tag_id,verification_status,verified_at,created_at,updated_at) on public.variant_dietary_tags to anon,authenticated;
grant select(variant_id,allergen_id,presence,verified_at,created_at,updated_at) on public.variant_allergens to anon,authenticated;
grant select(id,display_name,quote,rating,source_label,source_url,status,sort_order,created_at,updated_at) on public.testimonials to anon,authenticated;
grant select(key,content_json,status,created_at,updated_at) on public.site_content to anon,authenticated;
grant select on public.admin_profiles to authenticated;
create policy profile_read on public.admin_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select bakery_private.is_owner()));

create policy public_read on public.branches for select to anon,authenticated using (is_active);
create policy public_read on public.business_hours for select to anon,authenticated
  using (exists(select 1 from public.branches b where b.id = branch_id and b.is_active));
create policy public_read on public.categories for select to anon,authenticated using (bakery_private.public_category(id));
create policy public_read on public.products for select to anon,authenticated using (bakery_private.public_product(id));
create policy public_read on public.product_variants for select to anon,authenticated using (bakery_private.public_variant(id));
create policy public_read on public.product_categories for select to anon,authenticated
  using (bakery_private.public_product(product_id) and bakery_private.public_category(category_id));
create policy public_read on public.product_images for select to anon,authenticated
  using (is_approved and storage_bucket = 'product-images' and alt_text is not null
    and bakery_private.public_product(product_id) and (variant_id is null or bakery_private.public_variant(variant_id)));
create policy public_read on public.branch_variant_offers for select to anon,authenticated
  using (is_listed and bakery_private.public_variant(variant_id)
    and exists(select 1 from public.branches b where b.id = branch_id and b.is_active));
create policy public_read on public.option_groups for select to anon,authenticated using (bakery_private.public_variant(bundle_variant_id));
create policy public_read on public.option_choices for select to anon,authenticated
  using (is_active and bakery_private.public_option_group(group_id)
    and (component_variant_id is null or bakery_private.public_variant(component_variant_id)));
create policy public_read on public.bundle_fixed_components for select to anon,authenticated
  using (bakery_private.public_variant(bundle_variant_id) and bakery_private.public_variant(component_variant_id));
create policy public_read on public.variant_dietary_tags for select to anon,authenticated
  using (verification_status = 'verified' and verified_at is not null and bakery_private.public_variant(variant_id));
create policy public_read on public.variant_allergens for select to anon,authenticated
  using (verified_at is not null and bakery_private.public_variant(variant_id));
create policy public_read on public.dietary_tags for select to anon,authenticated using (
  exists(select 1 from public.variant_dietary_tags t where t.dietary_tag_id = id
    and t.verification_status = 'verified' and bakery_private.public_variant(t.variant_id)));
create policy public_read on public.allergens for select to anon,authenticated using (
  exists(select 1 from public.variant_allergens a where a.allergen_id = id
    and a.verified_at is not null and bakery_private.public_variant(a.variant_id)));
create policy public_read on public.promotions for select to anon,authenticated using (bakery_private.public_promotion(id));
create policy public_read on public.promotion_branches for select to anon,authenticated
  using (bakery_private.public_promotion(promotion_id) and exists(select 1 from public.branches b where b.id = branch_id and b.is_active));
create policy public_read on public.promotion_categories for select to anon,authenticated
  using (bakery_private.public_promotion(promotion_id) and bakery_private.public_category(category_id));
create policy public_read on public.promotion_products for select to anon,authenticated
  using (bakery_private.public_promotion(promotion_id) and bakery_private.public_product(product_id));
create policy public_read on public.promotion_variants for select to anon,authenticated
  using (bakery_private.public_promotion(promotion_id) and bakery_private.public_variant(variant_id));
create policy public_read on public.class_programs for select to anon,authenticated using (bakery_private.public_class(id));
create policy public_read on public.class_sessions for select to anon,authenticated
  using (bakery_private.public_class(program_id) and exists(select 1 from public.branches b where b.id = branch_id and b.is_active));
create policy public_read on public.testimonials for select to anon,authenticated using (bakery_private.public_testimonial(id));
create policy public_read on public.faqs for select to anon,authenticated using (status = 'published');
create policy public_read on public.site_content for select to anon,authenticated using (status = 'published');

create policy staff_read on public.branch_variant_offers for select to authenticated
  using (bakery_private.can_manage_branch(branch_id) and bakery_private.manageable_variant(variant_id));
create policy staff_insert on public.branch_variant_offers for insert to authenticated
  with check (bakery_private.can_manage_branch(branch_id) and bakery_private.manageable_variant(variant_id) and price_override_idr is null);
create policy staff_update on public.branch_variant_offers for update to authenticated
  using (bakery_private.can_manage_branch(branch_id) and bakery_private.manageable_variant(variant_id))
  with check (bakery_private.can_manage_branch(branch_id) and bakery_private.manageable_variant(variant_id));
create policy staff_read on public.class_sessions for select to authenticated
  using (bakery_private.can_manage_branch(branch_id) and bakery_private.public_class(program_id));
create policy staff_insert on public.class_sessions for insert to authenticated
  with check (bakery_private.can_manage_branch(branch_id) and bakery_private.public_class(program_id) and price_override_idr is null);
create policy staff_update on public.class_sessions for update to authenticated
  using (bakery_private.can_manage_branch(branch_id) and bakery_private.public_class(program_id))
  with check (bakery_private.can_manage_branch(branch_id) and bakery_private.public_class(program_id));

create function bakery_private.enforce_staff_fields() returns trigger
language plpgsql set search_path = '' as $$
declare editable text[];
begin
  if current_user in ('postgres','supabase_admin','service_role') or bakery_private.is_owner() then return new; end if;
  if not bakery_private.can_manage_branch(new.branch_id) then
    raise exception using errcode = '42501', message = 'branch_write_denied'; end if;
  if tg_table_name = 'branch_variant_offers' then
    editable := array['is_listed','availability_status','stock_quantity'];
    if not bakery_private.manageable_variant(new.variant_id) then
      raise exception using errcode = '42501', message = 'staff_requires_public_sku'; end if;
  else
    editable := array['starts_at','ends_at','registration_deadline_at','capacity','seats_left','status','is_registration_open'];
    if not bakery_private.public_class(new.program_id) then
      raise exception using errcode = '42501', message = 'staff_requires_public_program'; end if;
  end if;
  if tg_op = 'INSERT' then
    if new.price_override_idr is not null or new.created_at <> transaction_timestamp() or new.updated_at <> transaction_timestamp() then
      raise exception using errcode = '42501', message = 'staff_insert_fields_denied'; end if;
  elsif (to_jsonb(new) - editable) is distinct from (to_jsonb(old) - editable) then
    raise exception using errcode = '42501', message = 'staff_update_fields_denied';
  end if;
  return new;
end;
$$;
revoke all on function bakery_private.enforce_staff_fields() from public,anon,authenticated;
create trigger bakery_offer_fields before insert or update on public.branch_variant_offers
  for each row execute function bakery_private.enforce_staff_fields();
create trigger bakery_session_fields before insert or update on public.class_sessions
  for each row execute function bakery_private.enforce_staff_fields();

-- Public read RPC is INVOKER: actual table grants and RLS remain in effect.
create function public.read_active_branches()
returns table(id uuid,code text,name text,city text,whatsapp_number varchar,allow_pickup boolean,allow_delivery boolean)
language sql stable security invoker set search_path = '' as $$
  select b.id,b.code,b.name::text,b.city::text,b.whatsapp_number,b.allow_pickup,b.allow_delivery
  from public.branches b where b.is_active order by b.sort_order,b.name,b.id;
$$;
revoke all on function public.read_active_branches() from public,anon,authenticated;
grant execute on function public.read_active_branches() to anon,authenticated;

-- Private evidence is never directly selectable by the shared authenticated role.
-- Fixed signatures/projections, owner guard checked afresh, no arbitrary table/SQL input.
create function public.read_owner_testimonial_evidence(testimonial_uuid uuid)
returns table(id uuid,consent_reference text,consent_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not bakery_private.is_owner() then raise exception using errcode='42501',message='owner_required'; end if;
  return query select t.id,t.consent_reference::text,t.consent_at from public.testimonials t where t.id = testimonial_uuid;
end;
$$;
create function public.read_owner_variant_evidence(variant_uuid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not bakery_private.is_owner() then raise exception using errcode='42501',message='owner_required'; end if;
  return jsonb_build_object(
    'dietary',coalesce((select jsonb_agg(jsonb_build_object('dietary_tag_id',t.dietary_tag_id,'note',t.note) order by t.dietary_tag_id)
      from public.variant_dietary_tags t where t.variant_id = variant_uuid),'[]'::jsonb),
    'allergens',coalesce((select jsonb_agg(jsonb_build_object('allergen_id',a.allergen_id,'source_note',a.source_note) order by a.allergen_id)
      from public.variant_allergens a where a.variant_id = variant_uuid),'[]'::jsonb));
end;
$$;
create function public.read_owner_content_audit(content_key text)
returns table(key text,updated_by uuid)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not bakery_private.is_owner() then raise exception using errcode='42501',message='owner_required'; end if;
  return query select c.key,c.updated_by from public.site_content c where c.key = content_key;
end;
$$;
revoke all on function public.read_owner_testimonial_evidence(uuid),public.read_owner_variant_evidence(uuid),public.read_owner_content_audit(text) from public,anon,authenticated;
grant execute on function public.read_owner_testimonial_evidence(uuid),public.read_owner_variant_evidence(uuid),public.read_owner_content_audit(text) to authenticated;

-- Public bucket is an explicit publication boundary: only reviewed assets belong here.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('media-drafts','media-drafts',false,5242880,array['image/jpeg','image/png','image/webp','image/avif']),
  ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']),
  ('class-images','class-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']),
  ('brand-assets','brand-assets',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']);
-- Storage owns these managed tables; retain service privileges, limit API roles.
-- Supabase-managed grants owned by supabase_storage_admin cannot be revoked by
-- migration role postgres. RLS below is the mandatory Storage write boundary.
-- Revoke grants owned by this migration role; do not escalate managed ownership.
revoke all on storage.buckets from public,anon,authenticated;
grant select on storage.buckets to authenticated;
create policy bakery_owner_buckets on storage.buckets for select to authenticated
  using ((select bakery_private.is_owner()) and id in ('media-drafts','product-images','class-images','brand-assets'));
revoke all on storage.objects from public,anon,authenticated;
grant select,insert,update,delete on storage.objects to authenticated;
create function bakery_private.owner_media_path(bucket text,object_name text) returns boolean
language sql stable security invoker set search_path = '' as $$
  select bakery_private.is_owner() and (
    (bucket = 'media-drafts' and object_name ~ ('^' || (select auth.uid())::text || '/drafts/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|avif)$'))
    or (bucket in ('product-images','class-images','brand-assets') and
      object_name ~ '^approved/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|avif)$'));
$$;
revoke all on function bakery_private.owner_media_path(text,text) from public,anon,authenticated;
grant execute on function bakery_private.owner_media_path(text,text) to authenticated;
create policy bakery_owner_read on storage.objects for select to authenticated
  using ((select bakery_private.is_owner()) and bucket_id in ('media-drafts','product-images','class-images','brand-assets'));
create policy bakery_owner_upload on storage.objects for insert to authenticated
  with check (bakery_private.owner_media_path(bucket_id,name));
create policy bakery_owner_update on storage.objects for update to authenticated
  using ((select bakery_private.is_owner()) and bucket_id in ('media-drafts','product-images','class-images','brand-assets'))
  with check (bakery_private.owner_media_path(bucket_id,name));
create policy bakery_owner_delete on storage.objects for delete to authenticated
  using ((select bakery_private.is_owner()) and bucket_id in ('media-drafts','product-images','class-images','brand-assets'));

notify pgrst,'reload schema';
commit;
