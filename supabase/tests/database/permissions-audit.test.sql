begin;
set search_path = public,extensions;
select no_plan();
-- Catalog audit only. Real JWT authorization assertions run in the REST/SQL harness.
select is((select count(distinct tablename)::integer from pg_policies where schemaname = 'public'),26,'all 26 tables have explicit policies');
select ok(not has_table_privilege('anon','public.admin_profiles','select'),'anon cannot read admin profiles');
select ok(not has_table_privilege('authenticated','public.admin_profiles','insert,update,delete'),'no runtime role writes');
select ok(not has_column_privilege('anon','public.testimonials','consent_reference','select'),'anon consent evidence column denied');
select ok(not has_column_privilege('authenticated','public.testimonials','consent_reference','select'),'shared authenticated role cannot bypass owner evidence RPC');
select ok(not has_column_privilege('anon','public.variant_dietary_tags','note','select'),'diet note column denied');
select ok(not has_column_privilege('anon','public.variant_allergens','source_note','select'),'allergen source column denied');
select ok(not has_column_privilege('anon','public.site_content','updated_by','select'),'CMS actor column denied');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'bakery_private' and p.prosecdef and not coalesce(p.proconfig @> array['search_path=""'],false)),
  'all private definers have fixed empty search_path');
select ok(not has_function_privilege('anon','bakery_private.validate_integrity()','execute'),'anon cannot invoke integrity definer');
select ok(not has_function_privilege('authenticated','bakery_private.lock_integrity()','execute'),'authenticated cannot invoke lock definer');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('anon',p.oid,'execute')),1,'exactly one anon public RPC');
select ok(has_function_privilege('anon','public.read_active_branches()','execute'),'anon read RPC allowlisted');
select ok(not (select prosecdef from pg_proc where oid = 'public.read_active_branches()'::regprocedure),'public read RPC is invoker');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef and not coalesce(p.proconfig @> array['search_path=""'],false)),'owner RPC definers also fix empty search_path');
select is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.provolatile='s' and has_function_privilege('authenticated',p.oid,'execute')),4,'authenticated RPC allowlist contains four stable read functions');
select is((select count(*)::integer from pg_policies where schemaname='public' and policyname='staff_update'
  and qual is not null and with_check is not null),2,'both staff update policies constrain old and new row');
select ok(not has_function_privilege('anon','public.read_owner_testimonial_evidence(uuid)','execute'),'owner RPC not executable by anon');
select is((select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('v','m')),0,'no bypassing projection views');
select ok(not has_schema_privilege('anon','public','create'),'anon cannot create RPC/table');
select ok(not has_schema_privilege('authenticated','public','create'),'authenticated cannot create RPC/table');
select ok(not (select public from storage.buckets where id = 'media-drafts'),'draft bucket is private');
select is((select count(*)::integer from storage.buckets where id in ('product-images','class-images','brand-assets') and public),3,'three approved public buckets');
select ok(not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and roles && array['anon','public']::name[] and cmd in ('ALL','INSERT','UPDATE','DELETE')),'no anon Storage mutation policies despite managed grants');
select ok(not exists(select 1 from pg_policies where schemaname='storage' and tablename='buckets'
  and roles && array['anon','authenticated','public']::name[] and cmd in ('ALL','INSERT','UPDATE','DELETE')),'no runtime bucket mutation policies despite managed grants');
select is((select count(*)::integer from storage.buckets where id in ('media-drafts','product-images','class-images','brand-assets')
  and file_size_limit = 5242880 and not 'image/svg+xml' = any(allowed_mime_types)),4,'all buckets bound bytes and MIME');
select is((select count(*)::integer from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='storage' and c.relname in ('objects','buckets') and c.relrowsecurity),2,'Storage objects and buckets have RLS enabled');
select * from finish();
rollback;
