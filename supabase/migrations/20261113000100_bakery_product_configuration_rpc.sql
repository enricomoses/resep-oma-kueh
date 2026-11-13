begin;

-- Enforce written owner evidence on verified dietary claims (compatible with F04 seed notes).
alter table public.variant_dietary_tags
  add constraint dietary_verified_requires_evidence
  check (verification_status <> 'verified' or length(trim(coalesce(note, ''))) >= 3);

-- Transactional aggregate save for F17 Product Configuration Editor.
-- Runs as SECURITY INVOKER so table grants, column permissions, RLS, and
-- deferrable bakery_integrity triggers remain fully active under the owner session.
create or replace function public.save_product_configuration(
  p_product_id uuid,
  p_expected_updated_at timestamptz,
  p_payload jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_existing_variant public.product_variants%rowtype;
  v_core jsonb;
  v_cat jsonb;
  v_var jsonb;
  v_img jsonb;
  v_fixed jsonb;
  v_group jsonb;
  v_choice jsonb;
  v_diet jsonb;
  v_allergen jsonb;
  v_keep_variant_ids uuid[] := array[]::uuid[];
  v_keep_image_ids uuid[] := array[]::uuid[];
  v_variant_id uuid;
  v_group_id uuid;
  v_variant_status text;
  v_product_type text;
  v_product_status text;
  v_new_updated_at timestamptz;
  v_orphan_variant_id uuid;
begin
  if not bakery_private.is_owner() then
    raise exception using errcode = '42501', message = 'owner_required';
  end if;

  if p_product_id is null or p_expected_updated_at is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_configuration_payload';
  end if;

  if p_payload ? 'price_idr' or p_payload ? 'priceIdr' or p_payload ? 'basePriceIdr' then
    raise exception using errcode = '23514', message = 'price_not_on_product';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'product_not_found';
  end if;

  if v_product.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40900', message = 'stale_conflict';
  end if;

  v_core := p_payload->'product';
  if jsonb_typeof(v_core) <> 'object' then
    raise exception using errcode = '22023', message = 'missing_product_core';
  end if;

  if v_core ? 'price_idr' or v_core ? 'priceIdr' or v_core ? 'basePriceIdr' then
    raise exception using errcode = '23514', message = 'price_not_on_product';
  end if;

  if v_core ? 'slug' and (v_core->>'slug') is distinct from v_product.slug then
    raise exception using errcode = '23514', message = 'identity_is_immutable';
  end if;

  v_product_type := coalesce(v_core->>'productType', v_product.product_type);
  v_product_status := coalesce(v_core->>'status', v_product.status);

  update public.products
  set
    name = coalesce(nullif(trim(v_core->>'name'), ''), v_product.name),
    short_description = case when v_core ? 'shortDescription' then nullif(trim(v_core->>'shortDescription'), '') else v_product.short_description end,
    description = case when v_core ? 'description' then nullif(trim(v_core->>'description'), '') else v_product.description end,
    ingredients_info = case when v_core ? 'ingredientsInfo' then nullif(trim(v_core->>'ingredientsInfo'), '') else v_product.ingredients_info end,
    storage_instructions = case when v_core ? 'storageInstructions' then nullif(trim(v_core->>'storageInstructions'), '') else v_product.storage_instructions end,
    product_type = v_product_type,
    status = v_product_status,
    is_featured = coalesce((v_core->>'isFeatured')::boolean, v_product.is_featured),
    is_best_seller = coalesce((v_core->>'isBestSeller')::boolean, v_product.is_best_seller),
    is_new = coalesce((v_core->>'isNew')::boolean, v_product.is_new),
    needs_owner_review = coalesce((v_core->>'needsOwnerReview')::boolean, v_product.needs_owner_review),
    sort_order = coalesce((v_core->>'sortOrder')::integer, v_product.sort_order)
  where id = p_product_id;

  -- Reconcile categories safely without transient partial-index collisions.
  if jsonb_typeof(p_payload->'categories') <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_categories_array';
  end if;

  delete from public.product_categories where product_id = p_product_id;

  for v_cat in select * from jsonb_array_elements(p_payload->'categories') loop
    insert into public.product_categories (product_id, category_id, is_primary)
    values (
      p_product_id,
      (v_cat->>'categoryId')::uuid,
      coalesce((v_cat->>'isPrimary')::boolean, false)
    );
  end loop;

  -- Clear default flag first so switching defaults never trips partial unique index.
  update public.product_variants
  set is_default = false
  where product_id = p_product_id;

  if jsonb_typeof(p_payload->'variants') <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_variants_array';
  end if;

  -- Pass 1: Clear child option/bundle/dietary/allergen mappings for existing variants of this product.
  delete from public.option_choices oc
  using public.option_groups og, public.product_variants pv
  where oc.group_id = og.id
    and og.bundle_variant_id = pv.id
    and pv.product_id = p_product_id;

  delete from public.option_groups og
  using public.product_variants pv
  where og.bundle_variant_id = pv.id
    and pv.product_id = p_product_id;

  delete from public.bundle_fixed_components bfc
  using public.product_variants pv
  where bfc.bundle_variant_id = pv.id
    and pv.product_id = p_product_id;

  delete from public.variant_dietary_tags vdt
  using public.product_variants pv
  where vdt.variant_id = pv.id
    and pv.product_id = p_product_id;

  delete from public.variant_allergens va
  using public.product_variants pv
  where va.variant_id = pv.id
    and pv.product_id = p_product_id;

  -- Pass 2: Upsert variants while preserving immutable SKUs.
  for v_var in select * from jsonb_array_elements(p_payload->'variants') loop
    v_variant_id := nullif(v_var->>'id', '')::uuid;
    v_variant_status := coalesce(v_var->>'status', 'draft');

    if v_variant_id is not null then
      select * into v_existing_variant
      from public.product_variants
      where id = v_variant_id and product_id = p_product_id;
    end if;

    if v_variant_id is not null and found then
      if (v_var->>'sku') is distinct from v_existing_variant.sku then
        raise exception using errcode = '23514', message = 'identity_is_immutable';
      end if;

      if v_variant_status = 'archived' and exists (
        select 1
        from public.bundle_fixed_components f
        join public.product_variants bv on bv.id = f.bundle_variant_id
        join public.products bp on bp.id = bv.product_id
        where f.component_variant_id = v_variant_id
          and bp.id <> p_product_id
          and bp.status <> 'archived'
          and bv.status <> 'archived'
        union all
        select 1
        from public.option_choices oc
        join public.option_groups og on og.id = oc.group_id
        join public.product_variants bv on bv.id = og.bundle_variant_id
        join public.products bp on bp.id = bv.product_id
        where oc.component_variant_id = v_variant_id
          and oc.is_active
          and bp.id <> p_product_id
          and bp.status <> 'archived'
          and bv.status <> 'archived'
      ) then
        raise exception using errcode = '23514', message = 'variant_referenced_by_bundle';
      end if;

      update public.product_variants
      set
        name = trim(v_var->>'name'),
        size_label = nullif(trim(v_var->>'sizeLabel'), ''),
        base_price_idr = (v_var->>'basePriceIdr')::bigint,
        status = v_variant_status,
        sort_order = coalesce((v_var->>'sortOrder')::integer, 0),
        max_quantity_per_order = coalesce((v_var->>'maxQuantityPerOrder')::integer, 99),
        is_default = case when v_variant_status = 'archived' then false else coalesce((v_var->>'isDefault')::boolean, false) end,
        bundle_units_total = case when v_product_type = 'bundle' then nullif(v_var->>'bundleUnitsTotal', '')::integer else null end,
        bundle_recipe = case when v_product_type = 'bundle' then nullif(v_var->>'bundleRecipe', '') else null end,
        bundle_rules_verified = case when v_product_type = 'bundle' then coalesce((v_var->>'bundleRulesVerified')::boolean, false) else false end
      where id = v_variant_id and product_id = p_product_id;
    else
      v_variant_id := coalesce(v_variant_id, gen_random_uuid());
      insert into public.product_variants (
        id,
        product_id,
        sku,
        name,
        size_label,
        base_price_idr,
        status,
        sort_order,
        max_quantity_per_order,
        is_default,
        bundle_units_total,
        bundle_recipe,
        bundle_rules_verified
      ) values (
        v_variant_id,
        p_product_id,
        trim(v_var->>'sku'),
        trim(v_var->>'name'),
        nullif(trim(v_var->>'sizeLabel'), ''),
        (v_var->>'basePriceIdr')::bigint,
        v_variant_status,
        coalesce((v_var->>'sortOrder')::integer, 0),
        coalesce((v_var->>'maxQuantityPerOrder')::integer, 99),
        case when v_variant_status = 'archived' then false else coalesce((v_var->>'isDefault')::boolean, false) end,
        case when v_product_type = 'bundle' then nullif(v_var->>'bundleUnitsTotal', '')::integer else null end,
        case when v_product_type = 'bundle' then nullif(v_var->>'bundleRecipe', '') else null end,
        case when v_product_type = 'bundle' then coalesce((v_var->>'bundleRulesVerified')::boolean, false) else false end
      );
    end if;

    v_keep_variant_ids := array_append(v_keep_variant_ids, v_variant_id);

    -- Pass 3: Reconstruct bundle components, option groups/choices, dietary tags, and allergens for this variant.
    if v_product_type = 'bundle' then
      if jsonb_typeof(v_var->'fixedComponents') = 'array' then
        for v_fixed in select * from jsonb_array_elements(v_var->'fixedComponents') loop
          insert into public.bundle_fixed_components (
            id,
            bundle_variant_id,
            component_variant_id,
            component_slot,
            quantity,
            sort_order
          ) values (
            coalesce(nullif(v_fixed->>'id', '')::uuid, gen_random_uuid()),
            v_variant_id,
            (v_fixed->>'componentVariantId')::uuid,
            trim(v_fixed->>'componentSlot'),
            (v_fixed->>'quantity')::integer,
            coalesce((v_fixed->>'sortOrder')::integer, 0)
          );
        end loop;
      end if;

      if jsonb_typeof(v_var->'optionGroups') = 'array' then
        for v_group in select * from jsonb_array_elements(v_var->'optionGroups') loop
          v_group_id := coalesce(nullif(v_group->>'id', '')::uuid, gen_random_uuid());
          insert into public.option_groups (
            id,
            bundle_variant_id,
            name,
            min_select,
            max_select,
            quantity_per_selection,
            sort_order,
            is_required
          ) values (
            v_group_id,
            v_variant_id,
            trim(v_group->>'name'),
            coalesce((v_group->>'minSelect')::integer, 1),
            coalesce((v_group->>'maxSelect')::integer, 1),
            coalesce((v_group->>'quantityPerSelection')::integer, 3),
            coalesce((v_group->>'sortOrder')::integer, 0),
            coalesce((v_group->>'isRequired')::boolean, true)
          );

          if jsonb_typeof(v_group->'choices') = 'array' then
            for v_choice in select * from jsonb_array_elements(v_group->'choices') loop
              insert into public.option_choices (
                id,
                group_id,
                label,
                component_variant_id,
                price_delta_idr,
                is_active,
                sort_order
              ) values (
                coalesce(nullif(v_choice->>'id', '')::uuid, gen_random_uuid()),
                v_group_id,
                trim(v_choice->>'label'),
                nullif(v_choice->>'componentVariantId', '')::uuid,
                coalesce((v_choice->>'priceDeltaIdr')::bigint, 0),
                coalesce((v_choice->>'isActive')::boolean, true),
                coalesce((v_choice->>'sortOrder')::integer, 0)
              );
            end loop;
          end if;
        end loop;
      end if;
    end if;

    if jsonb_typeof(v_var->'dietaryTags') = 'array' then
      for v_diet in select * from jsonb_array_elements(v_var->'dietaryTags') loop
        insert into public.variant_dietary_tags (
          variant_id,
          dietary_tag_id,
          verification_status,
          verified_at,
          note
        ) values (
          v_variant_id,
          (v_diet->>'dietaryTagId')::uuid,
          coalesce(v_diet->>'verificationStatus', 'pending'),
          case
            when coalesce(v_diet->>'verificationStatus', 'pending') = 'verified'
              then coalesce(nullif(v_diet->>'verifiedAt', '')::timestamptz, now())
            else null
          end,
          nullif(trim(v_diet->>'note'), '')
        );
      end loop;
    end if;

    if jsonb_typeof(v_var->'allergens') = 'array' then
      for v_allergen in select * from jsonb_array_elements(v_var->'allergens') loop
        insert into public.variant_allergens (
          variant_id,
          allergen_id,
          presence,
          source_note,
          verified_at
        ) values (
          v_variant_id,
          (v_allergen->>'allergenId')::uuid,
          trim(v_allergen->>'presence'),
          nullif(trim(v_allergen->>'sourceNote'), ''),
          coalesce(nullif(v_allergen->>'verifiedAt', '')::timestamptz, null)
        );
      end loop;
    end if;
  end loop;

  -- Soft archive enforcement: prevent silent removal of persisted referenced variants.
  for v_orphan_variant_id in
    select pv.id
    from public.product_variants pv
    where pv.product_id = p_product_id
      and not (pv.id = any(v_keep_variant_ids))
  loop
    if exists (select 1 from public.branch_variant_offers where variant_id = v_orphan_variant_id)
       or exists (select 1 from public.bundle_fixed_components where component_variant_id = v_orphan_variant_id)
       or exists (select 1 from public.option_choices where component_variant_id = v_orphan_variant_id)
       or exists (select 1 from public.promotion_variants where variant_id = v_orphan_variant_id)
       or exists (select 1 from public.product_images where variant_id = v_orphan_variant_id)
    then
      raise exception using errcode = '23514', message = 'variant_archive_required';
    end if;

    delete from public.product_variants where id = v_orphan_variant_id and product_id = p_product_id;
  end loop;

  -- Reconcile product_images safely without transient primary-image index collision.
  if jsonb_typeof(p_payload->'images') <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_images_array';
  end if;

  update public.product_images
  set is_primary = false
  where product_id = p_product_id;

  for v_img in select * from jsonb_array_elements(p_payload->'images') loop
    v_variant_id := coalesce(nullif(v_img->>'id', '')::uuid, gen_random_uuid());
    if exists (select 1 from public.product_images where id = v_variant_id and product_id = p_product_id) then
      update public.product_images
      set
        variant_id = nullif(v_img->>'variantId', '')::uuid,
        storage_bucket = coalesce(v_img->>'storageBucket', 'media-drafts'),
        storage_path = trim(v_img->>'storagePath'),
        alt_text = nullif(trim(v_img->>'altText'), ''),
        is_approved = coalesce((v_img->>'isApproved')::boolean, false),
        is_primary = coalesce((v_img->>'isPrimary')::boolean, false),
        sort_order = coalesce((v_img->>'sortOrder')::integer, 0)
      where id = v_variant_id and product_id = p_product_id;
    else
      insert into public.product_images (
        id,
        product_id,
        variant_id,
        storage_bucket,
        storage_path,
        alt_text,
        is_approved,
        is_primary,
        sort_order
      ) values (
        v_variant_id,
        p_product_id,
        nullif(v_img->>'variantId', '')::uuid,
        coalesce(v_img->>'storageBucket', 'media-drafts'),
        trim(v_img->>'storagePath'),
        nullif(trim(v_img->>'altText'), ''),
        coalesce((v_img->>'isApproved')::boolean, false),
        coalesce((v_img->>'isPrimary')::boolean, false),
        coalesce((v_img->>'sortOrder')::integer, 0)
      );
    end if;
    v_keep_image_ids := array_append(v_keep_image_ids, v_variant_id);
  end loop;

  delete from public.product_images
  where product_id = p_product_id
    and not (id = any(v_keep_image_ids));

  -- Evaluate all deferred cross-table bakery_integrity constraints inside this transaction.
  set constraints all immediate;

  update public.products
  set updated_at = now()
  where id = p_product_id
  returning updated_at into v_new_updated_at;

  return jsonb_build_object(
    'productId', p_product_id,
    'updatedAt', v_new_updated_at
  );
end;
$$;

revoke all on function public.save_product_configuration(uuid, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.save_product_configuration(uuid, timestamptz, jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
