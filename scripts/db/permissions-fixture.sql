-- LOCAL SYNTHETIC DEMO only. Auth UUID placeholders come from GoTrue admin createUser.
begin;
insert into public.branches(id,code,name,city,whatsapp_number) values
 ('f0300000-0000-4000-8000-000000000001','surabaya','DEMO Surabaya','DEMO','62000000000'),
 ('f0300000-0000-4000-8000-000000000002','bintaro','DEMO Bintaro','DEMO','62000000001');
insert into public.admin_profiles(user_id,display_name,role,branch_id) values
 ('$OWNER_UUID$','DEMO owner','owner',null),
 ('$SURABAYA_UUID$','DEMO staff S','branch_admin','f0300000-0000-4000-8000-000000000001'),
 ('$BINTARO_UUID$','DEMO staff B','branch_admin','f0300000-0000-4000-8000-000000000002');
insert into public.business_hours(id,branch_id,day_of_week) values
 ('f0300000-0000-4000-8000-000000000003','f0300000-0000-4000-8000-000000000001',1);
insert into public.categories(id,name,slug,status) values
 ('f0300000-0000-4000-8000-000000000010','DEMO public category','demo-f03-category','published'),
 ('f0300000-0000-4000-8000-000000000011','DEMO draft category','demo-f03-draft','draft');
insert into public.products(id,name,slug,product_type) values
 ('f0300000-0000-4000-8000-000000000020','DEMO Cheese','demo-f03-cheese','simple'),
 ('f0300000-0000-4000-8000-000000000021','DEMO Choco','demo-f03-choco','simple'),
 ('f0300000-0000-4000-8000-000000000022','DEMO Pandan','demo-f03-pandan','simple'),
 ('f0300000-0000-4000-8000-000000000023','DEMO Vanilla','demo-f03-vanilla','simple'),
 ('f0300000-0000-4000-8000-000000000024','DEMO Mix draft','demo-f03-mix','bundle'),
 ('f0300000-0000-4000-8000-000000000025','DEMO draft','demo-f03-hidden','simple'),
 ('f0300000-0000-4000-8000-000000000026','DEMO archive','demo-f03-archive','simple');
insert into public.product_variants(id,product_id,sku,name,base_price_idr,status,is_default)
 select ('f0300000-0000-4000-8000-'||lpad((n+10)::text,12,'0'))::uuid,
 ('f0300000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'DEMO-F03-'||n,'DEMO slice',1000,'active',true
 from generate_series(20,26) n;
update public.product_variants set bundle_recipe='chiffon_mix',bundle_units_total=12
 where id='f0300000-0000-4000-8000-000000000034';
update public.products set product_type='variants' where id='f0300000-0000-4000-8000-000000000023';
insert into public.product_variants(id,product_id,sku,name,base_price_idr,status) values
 ('f0300000-0000-4000-8000-000000000037','f0300000-0000-4000-8000-000000000023','DEMO-F03-UNLISTED','DEMO unlisted SKU',1000,'active'),
 ('f0300000-0000-4000-8000-000000000038','f0300000-0000-4000-8000-000000000023','DEMO-F03-DRAFT-SKU','DEMO draft SKU',1000,'draft');
insert into public.product_categories(product_id,category_id,is_primary)
 select id,'f0300000-0000-4000-8000-000000000010',true from public.products where id::text like 'f0300000-%';
insert into public.product_categories(product_id,category_id)
 values('f0300000-0000-4000-8000-000000000020','f0300000-0000-4000-8000-000000000011');
insert into public.product_images(id,product_id,storage_path,alt_text,storage_bucket,is_approved,is_primary)
 select ('f0300000-0000-4000-8000-'||lpad((n+20)::text,12,'0'))::uuid,
 ('f0300000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'demo/f03-'||n||'.png','DEMO photo','product-images',true,true
 from generate_series(20,26) n;
insert into public.product_images(id,product_id,storage_path)
 values('f0300000-0000-4000-8000-000000000047','f0300000-0000-4000-8000-000000000020','demo/unapproved.png');
insert into public.product_images(id,product_id,variant_id,storage_path,alt_text,storage_bucket,is_approved) values
 ('f0300000-0000-4000-8000-000000000048','f0300000-0000-4000-8000-000000000023','f0300000-0000-4000-8000-000000000037','demo/unlisted-sku.png','DEMO','product-images',true),
 ('f0300000-0000-4000-8000-000000000049','f0300000-0000-4000-8000-000000000023','f0300000-0000-4000-8000-000000000038','demo/draft-sku.png','DEMO','product-images',true);
insert into public.branch_variant_offers(branch_id,variant_id,is_listed)
 select 'f0300000-0000-4000-8000-000000000001',id,true from public.product_variants where id::text like 'f0300000-%'
 and id<>'f0300000-0000-4000-8000-000000000037';
update public.branch_variant_offers set price_override_idr=1500 where variant_id='f0300000-0000-4000-8000-000000000030';
insert into public.branch_variant_offers(branch_id,variant_id,is_listed,price_override_idr) values
 ('f0300000-0000-4000-8000-000000000002','f0300000-0000-4000-8000-000000000030',true,2000),
 ('f0300000-0000-4000-8000-000000000002','f0300000-0000-4000-8000-000000000032',false,null);
insert into public.bundle_fixed_components(id,bundle_variant_id,component_variant_id,component_slot,quantity) values
 ('f0300000-0000-4000-8000-000000000050','f0300000-0000-4000-8000-000000000034','f0300000-0000-4000-8000-000000000030','cheese',3),
 ('f0300000-0000-4000-8000-000000000051','f0300000-0000-4000-8000-000000000034','f0300000-0000-4000-8000-000000000031','choco',3);
insert into public.option_groups(id,bundle_variant_id,name,min_select,max_select,quantity_per_selection) values
 ('f0300000-0000-4000-8000-000000000052','f0300000-0000-4000-8000-000000000034','DEMO C',1,1,3),
 ('f0300000-0000-4000-8000-000000000053','f0300000-0000-4000-8000-000000000034','DEMO D',1,1,3);
insert into public.option_choices(id,group_id,label,component_variant_id) values
 ('f0300000-0000-4000-8000-000000000054','f0300000-0000-4000-8000-000000000052','DEMO Pandan','f0300000-0000-4000-8000-000000000032'),
 ('f0300000-0000-4000-8000-000000000055','f0300000-0000-4000-8000-000000000053','DEMO Vanilla','f0300000-0000-4000-8000-000000000033');
update public.product_variants set bundle_rules_verified=true where id='f0300000-0000-4000-8000-000000000034';
insert into public.dietary_tags(id,slug,name) values('f0300000-0000-4000-8000-000000000060','gluten-free','DEMO GF');
insert into public.allergens(id,slug,name) values('f0300000-0000-4000-8000-000000000061','milk','DEMO milk');
insert into public.variant_dietary_tags(variant_id,dietary_tag_id,verification_status,verified_at,note) values
 ('f0300000-0000-4000-8000-000000000030','f0300000-0000-4000-8000-000000000060','verified',now(),'DEMO private dietary evidence'),
 ('f0300000-0000-4000-8000-000000000031','f0300000-0000-4000-8000-000000000060','pending',null,'DEMO pending'),
 ('f0300000-0000-4000-8000-000000000035','f0300000-0000-4000-8000-000000000060','verified',now(),'DEMO hidden'),
 ('f0300000-0000-4000-8000-000000000037','f0300000-0000-4000-8000-000000000060','verified',now(),'DEMO unoffered'),
 ('f0300000-0000-4000-8000-000000000038','f0300000-0000-4000-8000-000000000060','verified',now(),'DEMO draft SKU');
insert into public.variant_allergens(variant_id,allergen_id,presence,verified_at,source_note) values
 ('f0300000-0000-4000-8000-000000000030','f0300000-0000-4000-8000-000000000061','contains',now(),'DEMO private source'),
 ('f0300000-0000-4000-8000-000000000031','f0300000-0000-4000-8000-000000000061','not_declared',null,'DEMO unverified'),
 ('f0300000-0000-4000-8000-000000000035','f0300000-0000-4000-8000-000000000061','contains',now(),'DEMO hidden'),
 ('f0300000-0000-4000-8000-000000000037','f0300000-0000-4000-8000-000000000061','contains',now(),'DEMO unoffered'),
 ('f0300000-0000-4000-8000-000000000038','f0300000-0000-4000-8000-000000000061','contains',now(),'DEMO draft SKU');
update public.products set needs_owner_review=false,status=case when id='f0300000-0000-4000-8000-000000000026' then 'archived' else 'published' end
 where id::text like 'f0300000-%' and id not in ('f0300000-0000-4000-8000-000000000024','f0300000-0000-4000-8000-000000000025');
insert into public.promotions(id,title,slug,discount_type,discount_value,scope,starts_at,ends_at,status,is_enabled) values
 ('f0300000-0000-4000-8000-000000000070','DEMO current','demo-f03-current','percentage',10,'all',now()-interval '1 day',now()+interval '1 day','published',true),
 ('f0300000-0000-4000-8000-000000000071','DEMO expired','demo-f03-expired','percentage',10,'all',now()-interval '2 day',now()-interval '1 day','published',true),
 ('f0300000-0000-4000-8000-000000000072','DEMO future','demo-f03-future','percentage',10,'all',now()+interval '1 day',now()+interval '2 day','published',true),
 ('f0300000-0000-4000-8000-000000000073','DEMO draft','demo-f03-promo-draft','percentage',10,'all',now()-interval '1 day',now()+interval '1 day','draft',true),
 ('f0300000-0000-4000-8000-000000000074','DEMO product','demo-f03-target-product','fixed',100,'product',now()-interval '1 day',now()+interval '1 day','published',true),
 ('f0300000-0000-4000-8000-000000000075','DEMO category','demo-f03-target-category','fixed',100,'category',now()-interval '1 day',now()+interval '1 day','published',true),
 ('f0300000-0000-4000-8000-000000000076','DEMO variant','demo-f03-target-variant','fixed',100,'variant',now()-interval '1 day',now()+interval '1 day','published',true);
insert into public.promotion_products(promotion_id,product_id) values
 ('f0300000-0000-4000-8000-000000000074','f0300000-0000-4000-8000-000000000020'),
 ('f0300000-0000-4000-8000-000000000074','f0300000-0000-4000-8000-000000000025');
insert into public.promotion_categories(promotion_id,category_id) values
 ('f0300000-0000-4000-8000-000000000075','f0300000-0000-4000-8000-000000000010'),
 ('f0300000-0000-4000-8000-000000000075','f0300000-0000-4000-8000-000000000011');
insert into public.promotion_variants(promotion_id,variant_id) values
 ('f0300000-0000-4000-8000-000000000076','f0300000-0000-4000-8000-000000000030'),
 ('f0300000-0000-4000-8000-000000000076','f0300000-0000-4000-8000-000000000035'),
 ('f0300000-0000-4000-8000-000000000076','f0300000-0000-4000-8000-000000000037');
insert into public.promotion_branches(promotion_id,branch_id) values
 ('f0300000-0000-4000-8000-000000000070','f0300000-0000-4000-8000-000000000001'),
 ('f0300000-0000-4000-8000-000000000071','f0300000-0000-4000-8000-000000000001');
insert into public.class_programs(id,title,slug,base_price_idr,status,needs_owner_review,description,cover_image_path,cover_storage_bucket,cover_is_approved,cover_alt_text) values
 ('f0300000-0000-4000-8000-000000000080','DEMO class','demo-f03-class',1000,'published',false,'DEMO copy','demo/class.png','class-images',true,'DEMO cover'),
 ('f0300000-0000-4000-8000-000000000081','DEMO draft class','demo-f03-class-draft',1000,'draft',true,null,null,'media-drafts',false,null);
insert into public.class_sessions(id,program_id,branch_id,starts_at,ends_at,capacity,seats_left) values
 ('f0300000-0000-4000-8000-000000000082','f0300000-0000-4000-8000-000000000080','f0300000-0000-4000-8000-000000000001',now()+interval '1 day',now()+interval '25 hours',10,10),
 ('f0300000-0000-4000-8000-000000000083','f0300000-0000-4000-8000-000000000080','f0300000-0000-4000-8000-000000000002',now()+interval '1 day',now()+interval '25 hours',10,10),
 ('f0300000-0000-4000-8000-000000000084','f0300000-0000-4000-8000-000000000081','f0300000-0000-4000-8000-000000000001',now()+interval '1 day',now()+interval '25 hours',10,10);
insert into public.testimonials(id,display_name,quote,status,consent_reference,consent_at) values
 ('f0300000-0000-4000-8000-000000000090','DEMO anonymous','DEMO quote','published','DEMO private consent',now()),
 ('f0300000-0000-4000-8000-000000000091','DEMO draft','DEMO draft','draft',null,null);
insert into public.faqs(id,category,question,answer,status) values
 ('f0300000-0000-4000-8000-000000000092','DEMO','DEMO question','DEMO answer','published'),
 ('f0300000-0000-4000-8000-000000000093','DEMO','DEMO draft','DEMO draft','draft');
insert into public.site_content(key,content_json,status,updated_by) values
 ('footer.note','{"text":"DEMO F03 note"}','published','$OWNER_UUID$'),
 ('home.story','{"title":"DEMO F03 draft","body":"DEMO draft"}','draft','$OWNER_UUID$');
commit;
