begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- All rows are synthetic DEMO fixtures; transaction rollback leaves no catalog.
create function pg_temp.id(label text) returns uuid language sql immutable as $$select md5('F02-DEMO-' || label)::uuid$$;
create function pg_temp.validate(statement text) returns void language plpgsql as $$
begin
  execute statement;
  set constraints all immediate;
  set constraints all deferred;
end;
$$;

select is((select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'),26,'exactly 26 MVP tables, no phase-2 tables');
select is((select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity),26,'all MVP tables have RLS enabled');
select ok(not exists(select 1 from pg_policies where schemaname = 'public'),'no runtime policies before F03');
select ok(not exists(select 1 from information_schema.role_table_grants where table_schema = 'public'
  and grantee in ('anon','authenticated')),'no inherited Supabase table grants before F03');
select has_column('public','option_groups','quantity_per_selection','quantity per selection is a real column');
select has_column('public','class_sessions','seats_left','seats are real admin-managed data');

insert into branches(id,code,name,city,whatsapp_number) values(pg_temp.id('branch'),'surabaya','DEMO branch','DEMO city','62000000000');
insert into categories(id,name,slug,status) values(pg_temp.id('category'),'DEMO category','demo-category','published');
insert into products(id,name,slug,product_type) select pg_temp.id(x),'DEMO '||x,'demo-'||x,'simple'
  from unnest(array['cheese','choco','pandan','vanilla']) x;
insert into product_variants(id,product_id,sku,name,base_price_idr,status,is_default)
  select pg_temp.id(x||'-sku'),pg_temp.id(x),'DEMO-'||upper(x),'DEMO slice',1000,'active',true
  from unnest(array['cheese','choco','pandan','vanilla']) x;
insert into product_categories(product_id,category_id,is_primary)
  select id,pg_temp.id('category'),true from products;
insert into product_images(product_id,storage_path,alt_text,storage_bucket,is_approved,is_primary)
  select id,'demo/'||slug||'.webp','DEMO photo','product-images',true,true from products;
insert into branch_variant_offers(branch_id,variant_id,is_listed) select pg_temp.id('branch'),id,true from product_variants;
update products set needs_owner_review = false,status = 'published';
set constraints all immediate;
set constraints all deferred;
select is((select count(*)::integer from products where status = 'published'),4,'complete DEMO component aggregates publish in one transaction');

select throws_ok($$insert into product_variants(product_id,sku,name,base_price_idr) values(pg_temp.id('cheese'),'DEMO-ZERO','DEMO',0)$$,'23514',null,'zero price rejected');
select throws_ok($$update product_variants set base_price_idr = -1 where id = pg_temp.id('cheese-sku')$$,'23514',null,'negative price rejected');
select throws_ok($$update product_variants set base_price_idr = 1000000001 where id = pg_temp.id('cheese-sku')$$,'23514',null,'unit price above technical cap rejected');
select throws_ok($$insert into product_variants(product_id,sku,name,base_price_idr) values(pg_temp.id('missing'),'DEMO-MISSING','DEMO',1)$$,'23503',null,'invalid parent FK rejected');
select throws_ok($$insert into product_variants(product_id,sku,name,base_price_idr,is_default) values(pg_temp.id('cheese'),'DEMO-DEFAULT','DEMO',1,true)$$,'23505',null,'second default variant rejected');
select throws_ok($$update product_variants set max_quantity_per_order = 100 where id = pg_temp.id('cheese-sku')$$,'23514',null,'quantity cap enforced');
select throws_ok($$update product_variants set sku = 'DEMO-RENAMED' where id = pg_temp.id('cheese-sku')$$,'23514','identity_is_immutable','SKU cannot change with display edit');
select lives_ok($$update products set name = 'DEMO renamed' where id = pg_temp.id('cheese')$$,'display name can change');
select is((select slug::text from products where id = pg_temp.id('cheese')),'demo-cheese','display edit preserves slug');
select throws_ok($$update products set slug = 'demo-changed' where id = pg_temp.id('cheese')$$,'23514','identity_is_immutable','permalink mutation rejected');
select throws_ok($$insert into categories(name,slug) values('DEMO','Not URL Safe')$$,'23514',null,'invalid slug rejected');
select throws_ok($$insert into product_images(product_id,variant_id,storage_path) values(pg_temp.id('cheese'),pg_temp.id('choco-sku'),'demo/image.webp')$$,'23503',null,'cross-product variant image rejected');
select throws_ok($$insert into product_images(product_id,storage_path,is_primary) values(pg_temp.id('cheese'),'demo/second.webp',true)$$,'23505',null,'second primary image rejected');
select throws_ok($$insert into product_images(product_id,storage_path) values(pg_temp.id('cheese'),'../private.webp')$$,'23514',null,'storage traversal rejected');
select throws_ok($$insert into product_images(product_id,storage_path,alt_text,is_approved) values(pg_temp.id('cheese'),'demo/private.webp','DEMO',true)$$,'23514',null,'private draft media cannot be approved');
insert into categories(id,name,slug) values(pg_temp.id('category-2'),'DEMO second','demo-second');
select throws_ok($$insert into product_categories(product_id,category_id,is_primary) values(pg_temp.id('cheese'),pg_temp.id('category-2'),true)$$,'23505',null,'second primary category rejected');
select throws_ok($$select pg_temp.validate('update categories set parent_id = id')$$,'23514',null,'self category rejected');
select throws_ok($$select pg_temp.validate('update categories set parent_id = case when id = pg_temp.id(''category'') then pg_temp.id(''category-2'') else pg_temp.id(''category'') end')$$,'23514','category_cycle','multi-level category cycle rejected');
select throws_ok($$select pg_temp.validate('update categories set status = ''draft'' where id = pg_temp.id(''category'')')$$,'23514','product_not_publish_ready','unpublishing last category invalidates public product');
select throws_ok($$update branch_variant_offers set stock_quantity = 0,availability_status = 'available'$$,'23514',null,'available plus tracked zero stock rejected');
select lives_ok($$update branch_variant_offers set stock_quantity = 0,availability_status = 'sold_out' where variant_id = pg_temp.id('cheese-sku')$$,'sold-out listing remains publishable');
select throws_ok($$select pg_temp.validate('delete from branch_variant_offers where variant_id = pg_temp.id(''cheese-sku'')')$$,'23514','product_not_publish_ready','removing only offer from published product rejected');
select throws_ok($$select pg_temp.validate('update products set needs_owner_review = true where id = pg_temp.id(''cheese'')')$$,'23514','product_not_publish_ready','public product cannot regain pending review');
select throws_ok($$select pg_temp.validate('update product_images set is_approved = false where product_id = pg_temp.id(''cheese'')')$$,'23514','product_not_publish_ready','last approved image cannot disappear while published');
select throws_ok($$delete from branches where id = pg_temp.id('branch')$$,'23503',null,'business FK restricts branch deletion');
select ok((select updated_at > created_at from products where id = pg_temp.id('cheese')),'updated_at changes automatically');

insert into business_hours(branch_id,day_of_week) values(pg_temp.id('branch'),1);
select lives_ok($$insert into business_hours(branch_id,day_of_week,is_closed) values(pg_temp.id('branch'),2,true)$$,'unknown hours and explicit closed day accepted');
select throws_ok($$insert into business_hours(branch_id,day_of_week,opens_at,closes_at) values(pg_temp.id('branch'),3,'18:00','08:00')$$,'23514',null,'overnight/reversed hours rejected');
select throws_ok($$insert into business_hours(branch_id,day_of_week,opens_at) values(pg_temp.id('branch'),3,'08:00')$$,'23514',null,'partial hours rejected');
select throws_ok($$insert into business_hours(branch_id,day_of_week) values(pg_temp.id('branch'),7)$$,'23514',null,'invalid weekday rejected');
select throws_ok($$insert into business_hours(branch_id,day_of_week) values(pg_temp.id('branch'),1)$$,'23505',null,'one hours interval per branch/day');
insert into auth.users(id) values(pg_temp.id('admin-owner')), (pg_temp.id('admin-staff'));
select throws_ok($$insert into admin_profiles(user_id,display_name,role,branch_id) values(pg_temp.id('admin-owner'),'DEMO owner','owner',pg_temp.id('branch'))$$,'23514',null,'owner profile must have null branch');
select throws_ok($$insert into admin_profiles(user_id,display_name,role) values(pg_temp.id('admin-staff'),'DEMO staff','branch_admin')$$,'23514',null,'staff profile must have a branch');
select throws_ok($$insert into admin_profiles(user_id,display_name,role) values(pg_temp.id('missing-admin'),'DEMO missing','owner')$$,'23503',null,'profile requires real Auth identity');
select lives_ok($$insert into admin_profiles(user_id,display_name,role,branch_id) values(pg_temp.id('admin-staff'),'DEMO staff','branch_admin',pg_temp.id('branch'))$$,'branch-scoped synthetic profile accepted');

-- Bundle config is allowed to be incomplete as a draft, never verified/public.
insert into products(id,name,slug,product_type) values(pg_temp.id('mix'),'DEMO Mix','demo-mix','bundle');
insert into product_variants(id,product_id,sku,name,base_price_idr,status,bundle_recipe,bundle_units_total)
  values(pg_temp.id('mix-sku'),pg_temp.id('mix'),'DEMO-MIX','DEMO pack',10000,'active','chiffon_mix',12);
select throws_ok($$select pg_temp.validate('update product_variants set bundle_rules_verified = true where id = pg_temp.id(''mix-sku'')')$$,'23514','invalid_chiffon_recipe','incomplete bundle cannot be verified');
select throws_ok($$select pg_temp.validate('update product_variants set bundle_units_total = 11 where id = pg_temp.id(''mix-sku'')')$$,'23514','variant_bundle_shape','Chiffon must contain 12 slices');
insert into bundle_fixed_components(bundle_variant_id,component_variant_id,component_slot,quantity)
  values(pg_temp.id('mix-sku'),pg_temp.id('cheese-sku'),'cheese',3),(pg_temp.id('mix-sku'),pg_temp.id('choco-sku'),'choco',3);
insert into option_groups(id,bundle_variant_id,name,min_select,max_select,quantity_per_selection)
  values(pg_temp.id('group-c'),pg_temp.id('mix-sku'),'DEMO C',1,1,3),(pg_temp.id('group-d'),pg_temp.id('mix-sku'),'DEMO D',1,1,3);
insert into option_choices(id,group_id,label,component_variant_id)
  values(pg_temp.id('choice-c'),pg_temp.id('group-c'),'DEMO Pandan',pg_temp.id('pandan-sku')),
  (pg_temp.id('choice-d'),pg_temp.id('group-d'),'DEMO Vanilla',pg_temp.id('vanilla-sku'));
select lives_ok($$select pg_temp.validate('update product_variants set bundle_rules_verified = true where id = pg_temp.id(''mix-sku'')')$$,'complete 2x3 fixed plus 2x3 selectable recipe verifies');
select throws_ok($$select pg_temp.validate('update option_choices set price_delta_idr = 1000000000 where id = pg_temp.id(''choice-c'')')$$,'23514','configured_unit_price_exceeds_cap','base plus selectable deltas obeys unit cap');
select throws_ok($$select pg_temp.validate('update option_groups set quantity_per_selection = 2 where id = pg_temp.id(''group-c'')')$$,'23514','invalid_chiffon_recipe','incorrect selectable slice quantity rejected');
select throws_ok($$select pg_temp.validate('update bundle_fixed_components set quantity = 2 where component_slot = ''cheese''')$$,'23514','invalid_chiffon_recipe','incorrect fixed quantity rejected');
select throws_ok($$select pg_temp.validate('update option_choices set component_variant_id = pg_temp.id(''cheese-sku'') where id = pg_temp.id(''choice-c'')')$$,'23514','invalid_chiffon_recipe','choice cannot duplicate fixed flavour');
select throws_ok($$select pg_temp.validate('update option_choices set component_variant_id = pg_temp.id(''pandan-sku'') where id = pg_temp.id(''choice-d'')')$$,'23514','invalid_chiffon_recipe','recipe needs two distinct selectable flavours');
select throws_ok($$select pg_temp.validate('update option_choices set component_variant_id = null where id = pg_temp.id(''choice-c'')')$$,'23514','invalid_bundle_component','Chiffon choice must reference a real SKU');
select throws_ok($$select pg_temp.validate('update option_choices set component_variant_id = pg_temp.id(''mix-sku'') where id = pg_temp.id(''choice-c'')')$$,'23514','invalid_bundle_component','recursive/self component rejected');
select throws_ok($$select pg_temp.validate('update option_choices set is_active = false where id = pg_temp.id(''choice-c'')')$$,'23514','invalid_chiffon_recipe','required group must have an active choice');
insert into dietary_tags(id,slug,name) values(pg_temp.id('gf'),'gluten-free','DEMO GF');
select throws_ok($$insert into variant_dietary_tags(variant_id,dietary_tag_id,verification_status) values(pg_temp.id('mix-sku'),pg_temp.id('gf'),'verified')$$,'23514',null,'verified claim requires timestamp');
select throws_ok($$select pg_temp.validate('insert into variant_dietary_tags(variant_id,dietary_tag_id,verification_status,verified_at) values(pg_temp.id(''mix-sku''),pg_temp.id(''gf''),''verified'',now())')$$,'23514','bundle_component_gf_unverified','GF bundle rejects unverified components');
insert into variant_dietary_tags(variant_id,dietary_tag_id,verification_status,verified_at)
  select pg_temp.id(x||'-sku'),pg_temp.id('gf'),'verified',now() from unnest(array['cheese','choco','pandan','vanilla','mix']) x;
set constraints all immediate;
set constraints all deferred;
select is((select count(*)::integer from variant_dietary_tags where verification_status = 'verified'),5,'GF recipe accepts individually verified DEMO components');
insert into product_categories(product_id,category_id) values(pg_temp.id('mix'),pg_temp.id('category'));
insert into product_images(product_id,storage_path,alt_text,storage_bucket,is_approved)
  values(pg_temp.id('mix'),'demo/mix.webp','DEMO Mix','product-images',true);
insert into branch_variant_offers(branch_id,variant_id,is_listed) values(pg_temp.id('branch'),pg_temp.id('mix-sku'),true);
select lives_ok($$select pg_temp.validate('update products set needs_owner_review = false,status = ''published'' where id = pg_temp.id(''mix'')')$$,'complete bundle publishes');
select throws_ok($$select pg_temp.validate('update products set status = ''draft'' where id = pg_temp.id(''pandan'')')$$,'23514','bundle_component_not_offered','bundle component parent must remain public');
select throws_ok($$select pg_temp.validate('update variant_dietary_tags set verification_status = ''pending'',verified_at = null where variant_id = pg_temp.id(''pandan-sku'')')$$,'23514','bundle_component_gf_unverified','revoking component GF invalidates GF bundle');

insert into promotions(id,title,slug,discount_type,discount_value,scope,starts_at,ends_at)
 values(pg_temp.id('promo'),'DEMO promo','demo-promo','percentage',10,'product','2026-01-01T00:00:00Z','2027-01-01T00:00:00Z');
select throws_ok($$update promotions set discount_value = 101$$,'23514',null,'percentage above 100 rejected');
select throws_ok($$update promotions set discount_type = 'fixed',discount_value = 1.5$$,'23514',null,'fractional fixed Rupiah rejected');
select throws_ok($$update promotions set max_discount_idr = -1$$,'23514',null,'negative promo cap rejected');
select throws_ok($$update promotions set min_spend_idr = 1000000000001$$,'23514',null,'cart monetary bound enforced');
select throws_ok($$update promotions set ends_at = starts_at$$,'23514',null,'empty promo time interval rejected');
select throws_ok($$update promotions set is_stackable = true$$,'23514',null,'stackable promotion rejected in MVP');
select throws_ok($$select pg_temp.validate('update promotions set status = ''published''')$$,'23514','promotion_target_mismatch','target required before promotion publication');
select lives_ok($$update promotions set discount_type = 'fixed',discount_value = 1000000000$$,'maximum technical fixed discount fits numeric precision');
insert into promotion_products values(pg_temp.id('promo'),pg_temp.id('cheese'),now(),now());
select lives_ok($$select pg_temp.validate('update promotions set status = ''published'',is_enabled = true')$$,'scoped promo with correct published target accepted');
select throws_ok($$select pg_temp.validate('delete from promotion_products')$$,'23514','promotion_target_mismatch','cannot remove last published target');
select throws_ok($$select pg_temp.validate('insert into promotion_categories(promotion_id,category_id) values(pg_temp.id(''promo''),pg_temp.id(''category''))')$$,'23514','promotion_target_mismatch','unrelated target pivot rejected');

insert into class_programs(id,title,slug,base_price_idr) values(pg_temp.id('class'),'DEMO class','demo-class',1000);
select throws_ok($$update class_programs set status = 'published'$$,'23514',null,'class needs review/copy/approved cover before publish');
select throws_ok($$update class_programs set included_items = '[1]'$$,'23514',null,'class included items must be strings');
select throws_ok($$update class_programs set age_min = 12,age_max = 5$$,'23514',null,'reversed class age range rejected');
insert into class_sessions(id,program_id,branch_id,starts_at,ends_at,capacity,seats_left)
  values(pg_temp.id('session'),pg_temp.id('class'),pg_temp.id('branch'),'2027-01-01T03:00:00Z','2027-01-01T04:00:00Z',10,10);
select throws_ok($$update class_sessions set capacity = 0$$,'23514',null,'zero capacity rejected');
select throws_ok($$update class_sessions set seats_left = 11$$,'23514',null,'seats cannot exceed capacity');
select throws_ok($$update class_sessions set seats_left = -1$$,'23514',null,'negative seats rejected');
select throws_ok($$update class_sessions set ends_at = starts_at$$,'23514',null,'invalid session interval rejected');
select throws_ok($$update class_sessions set registration_deadline_at = ends_at$$,'23514',null,'deadline cannot follow start');
select throws_ok($$select pg_temp.validate('update class_sessions set is_registration_open = true')$$,'23514','class_not_registration_ready','draft program cannot open registration');
update class_programs set description = 'DEMO class description',cover_image_path = 'demo/class.webp',
  cover_storage_bucket = 'class-images',cover_alt_text = 'DEMO class',cover_is_approved = true,
  needs_owner_review = false,status = 'published';
select lives_ok($$select pg_temp.validate('update class_sessions set is_registration_open = true')$$,'reviewed class can open its session');
select throws_ok($$update class_sessions set seats_left = 0$$,'23514',null,'zero seats cannot remain open');
select lives_ok($$update class_sessions set is_registration_open = false,status = 'full',seats_left = 0$$,'full closed session accepted');

select throws_ok($$insert into testimonials(display_name,quote,status) values('DEMO','DEMO quote','published')$$,'23514',null,'testimony requires actual consent metadata');
select throws_ok($$insert into testimonials(display_name,quote,rating) values('DEMO','DEMO quote',6)$$,'23514',null,'invalid rating rejected');
select throws_ok($$insert into site_content(key,content_json) values('unknown.key','{}')$$,'23514',null,'CMS key allowlist enforced');
select throws_ok($$insert into site_content(key,content_json) values('footer.note','{"html":"<script>demo</script>"}')$$,'23514',null,'CMS unknown/HTML payload rejected');
select throws_ok($$insert into site_content(key,content_json,status) values('home.hero','{}','published')$$,'23514',null,'CMS publication requires per-key fields');
select throws_ok($$insert into site_content(key,content_json,status) values('home.hero','{"headline":"DEMO","subcopy":"DEMO","image_path":"demo/hero.webp","image_alt":"DEMO","media_approved":false}','published')$$,'23514',null,'CMS published media needs approval');
select lives_ok($$insert into site_content(key,content_json,status) values('footer.note','{"text":"DEMO note"}','published')$$,'typed plain-text CMS accepted');
select lives_ok($$insert into site_content(key,content_json) values('home.hero','{}')$$,'incomplete CMS draft accepted');
select throws_ok($$insert into site_content(key,content_json) values('about.values','{"items":[1]}')$$,'23514',null,'CMS values require strings');
select throws_ok($$insert into site_content(key,content_json) values('business.contacts','{"email":"DEMO","instagram_url":"https://example.com/"}')$$,'23514',null,'CMS contact URL/email shape enforced');
select throws_ok($$insert into site_content(key,content_json,status) values('community.instagram','{"url":"https://www.instagram.com/demo/","items":[{"image_path":"demo/image.webp","alt":"DEMO","href":"https://www.instagram.com/p/demo/","media_approved":false}]}','published')$$,'23514',null,'community image publication needs approval');

set constraints all immediate;
select * from finish();
rollback;
