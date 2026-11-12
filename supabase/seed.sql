-- LOCAL DATA ONLY. Historical draft + SYNTHETIC DEMO, never production.
-- SEED_REFERENCE_DATE = 2026-11-11T00:00:00+07:00. No moving clock.
-- Re-run inserts missing rows only; never overwrite owner edits.
begin;
insert into bakery_private.seed_state (dataset_kind,seed_version,reference_date) values
  ('local-demo','f04-v1','2026-11-11T00:00:00+07:00')
on conflict do nothing;

insert into public.branches (id,code,name,city,whatsapp_number,address,maps_url) values
  ('f0400000-0000-4000-8000-000000000001','surabaya','Surabaya','Surabaya','6281703384308','Rungkut Asri Tengah V No. 22, Surabaya',null),
  ('f0400000-0000-4000-8000-000000000002','bintaro','Bintaro','Bintaro','6285119785194',null,null)
on conflict do nothing;

insert into public.categories (id,name,slug,status,description,sort_order) values
  ('f0400000-0000-4000-8000-000000000100','Chiffon Series','chiffon-series','draft','Referensi historis; menunggu review owner.',0),
  ('f0400000-0000-4000-8000-000000000200','DEMO — Chiffon Series','demo-chiffon-series','published','Data sintetis lokal, bukan katalog pemesanan aktif.',0),
  ('f0400000-0000-4000-8000-000000000101','Gluten-Free Series','gluten-free-series','draft','Referensi historis; menunggu review owner.',1),
  ('f0400000-0000-4000-8000-000000000201','DEMO — Gluten-Free Series','demo-gluten-free-series','published','Data sintetis lokal, bukan katalog pemesanan aktif.',1),
  ('f0400000-0000-4000-8000-000000000102','ROK N ROLL Series','rok-n-roll-series','draft','Referensi historis; menunggu review owner.',2),
  ('f0400000-0000-4000-8000-000000000202','DEMO — ROK N ROLL Series','demo-rok-n-roll-series','published','Data sintetis lokal, bukan katalog pemesanan aktif.',2),
  ('f0400000-0000-4000-8000-000000000103','Sekotak Chiffon','sekotak-chiffon','draft','Referensi historis; menunggu review owner.',3),
  ('f0400000-0000-4000-8000-000000000203','DEMO — Sekotak Chiffon','demo-sekotak-chiffon','published','Data sintetis lokal, bukan katalog pemesanan aktif.',3),
  ('f0400000-0000-4000-8000-000000000104','Chiffon Slice Mix','chiffon-slice-mix','draft','Referensi historis; menunggu review owner.',4),
  ('f0400000-0000-4000-8000-000000000204','DEMO — Chiffon Slice Mix','demo-chiffon-slice-mix','published','Data sintetis lokal, bukan katalog pemesanan aktif.',4),
  ('f0400000-0000-4000-8000-000000000105','Shokupan','shokupan','draft','Referensi historis; menunggu review owner.',5),
  ('f0400000-0000-4000-8000-000000000205','DEMO — Shokupan','demo-shokupan','published','Data sintetis lokal, bukan katalog pemesanan aktif.',5),
  ('f0400000-0000-4000-8000-000000000106','Bakpao','bakpao','draft','Referensi historis; menunggu review owner.',6),
  ('f0400000-0000-4000-8000-000000000206','DEMO — Bakpao','demo-bakpao','published','Data sintetis lokal, bukan katalog pemesanan aktif.',6),
  ('f0400000-0000-4000-8000-000000000107','Roti Isi','roti-isi','draft','Referensi historis; menunggu review owner.',7),
  ('f0400000-0000-4000-8000-000000000207','DEMO — Roti Isi','demo-roti-isi','published','Data sintetis lokal, bukan katalog pemesanan aktif.',7),
  ('f0400000-0000-4000-8000-000000000108','Bagel Series','bagel-series','draft','Referensi historis; menunggu review owner.',8),
  ('f0400000-0000-4000-8000-000000000208','DEMO — Bagel Series','demo-bagel-series','published','Data sintetis lokal, bukan katalog pemesanan aktif.',8),
  ('f0400000-0000-4000-8000-000000000109','Salt Bread','salt-bread','draft','Referensi historis; menunggu review owner.',9),
  ('f0400000-0000-4000-8000-000000000209','DEMO — Salt Bread','demo-salt-bread','published','Data sintetis lokal, bukan katalog pemesanan aktif.',9),
  ('f0400000-0000-4000-8000-000000000110','Rustic Bread & Donut','rustic-bread-donut','draft','Referensi historis; menunggu review owner.',10),
  ('f0400000-0000-4000-8000-000000000210','DEMO — Rustic Bread & Donut','demo-rustic-bread-donut','published','Data sintetis lokal, bukan katalog pemesanan aktif.',10),
  ('f0400000-0000-4000-8000-000000000111','Pie & Canape','pie-canape','draft','Referensi historis; menunggu review owner.',11),
  ('f0400000-0000-4000-8000-000000000211','DEMO — Pie & Canape','demo-pie-canape','published','Data sintetis lokal, bukan katalog pemesanan aktif.',11),
  ('f0400000-0000-4000-8000-000000000112','Traditional & Other','traditional-and-other','draft','Referensi historis; menunggu review owner.',12),
  ('f0400000-0000-4000-8000-000000000212','DEMO — Traditional & Other','demo-traditional-and-other','published','Data sintetis lokal, bukan katalog pemesanan aktif.',12)
on conflict do nothing;

insert into public.products (id,name,slug,product_type,status,needs_owner_review,description,is_featured) values
  ('f0400000-0000-4000-8000-000000000300','Coffee Chiffon','reference-chiffon-series','variants','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000301','Gluten-Free Chiffon Pandan','reference-gluten-free-series','variants','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000302','Choco Berry ROK N ROLL','reference-rok-n-roll-series','variants','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000303','Sekotak Chiffon Black Forest','reference-sekotak-chiffon','simple','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000304','Chiffon Mix','reference-chiffon-slice-mix','bundle','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000305','Basic Shokupan','reference-shokupan','simple','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000306','Bakpao Kacang Merah','reference-bakpao','simple','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000307','Roti Isi Cheese','reference-roti-isi','simple','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000308','Bagel Original','reference-bagel-series','simple','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000309','Salt Bread Original','reference-salt-bread','simple','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000310','Vegan Rustic Whole Wheat Bun','reference-rustic-bread-donut','simple','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000311','Mini Fruit Pie','reference-pie-canape','simple','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000312','Putu Ayu','reference-traditional-and-other','simple','draft',true,'Referensi menu historis, bukan ketersediaan/harga terkini.',false),
  ('f0400000-0000-4000-8000-000000000400','DEMO — Coffee Chiffon','demo-coffee','variants','published',false,'SYNTHETIC DEMO lokal. Harga, komposisi dan klaim diet hanya fixture pengujian.',true),
  ('f0400000-0000-4000-8000-000000000401','DEMO — Choco Berry ROK N ROLL','demo-rok','variants','published',false,'SYNTHETIC DEMO lokal. Harga, komposisi dan klaim diet hanya fixture pengujian.',true),
  ('f0400000-0000-4000-8000-000000000402','DEMO — Chiffon Mix','demo-mix','bundle','published',false,'SYNTHETIC DEMO lokal. Harga, komposisi dan klaim diet hanya fixture pengujian.',true),
  ('f0400000-0000-4000-8000-000000000403','DEMO — Cheese component','demo-cheese','variants','published',false,'SYNTHETIC DEMO lokal. Harga, komposisi dan klaim diet hanya fixture pengujian.',false),
  ('f0400000-0000-4000-8000-000000000404','DEMO — Choco component','demo-choco','variants','published',false,'SYNTHETIC DEMO lokal. Harga, komposisi dan klaim diet hanya fixture pengujian.',false),
  ('f0400000-0000-4000-8000-000000000405','DEMO — Pandan component','demo-pandan','variants','published',false,'SYNTHETIC DEMO lokal. Harga, komposisi dan klaim diet hanya fixture pengujian.',false),
  ('f0400000-0000-4000-8000-000000000406','DEMO — Vanilla component','demo-vanilla','variants','published',false,'SYNTHETIC DEMO lokal. Harga, komposisi dan klaim diet hanya fixture pengujian.',false),
  ('f0400000-0000-4000-8000-000000000407','DEMO — Roti Isi Cheese','demo-roti','simple','published',false,'SYNTHETIC DEMO lokal. Harga, komposisi dan klaim diet hanya fixture pengujian.',false)
on conflict do nothing;

insert into public.product_categories (product_id,category_id,is_primary) values
  ((select id from public.products where slug='reference-chiffon-series'),(select id from public.categories where slug='chiffon-series'),true),
  ((select id from public.products where slug='reference-gluten-free-series'),(select id from public.categories where slug='gluten-free-series'),true),
  ((select id from public.products where slug='reference-rok-n-roll-series'),(select id from public.categories where slug='rok-n-roll-series'),true),
  ((select id from public.products where slug='reference-sekotak-chiffon'),(select id from public.categories where slug='sekotak-chiffon'),true),
  ((select id from public.products where slug='reference-chiffon-slice-mix'),(select id from public.categories where slug='chiffon-slice-mix'),true),
  ((select id from public.products where slug='reference-shokupan'),(select id from public.categories where slug='shokupan'),true),
  ((select id from public.products where slug='reference-bakpao'),(select id from public.categories where slug='bakpao'),true),
  ((select id from public.products where slug='reference-roti-isi'),(select id from public.categories where slug='roti-isi'),true),
  ((select id from public.products where slug='reference-bagel-series'),(select id from public.categories where slug='bagel-series'),true),
  ((select id from public.products where slug='reference-salt-bread'),(select id from public.categories where slug='salt-bread'),true),
  ((select id from public.products where slug='reference-rustic-bread-donut'),(select id from public.categories where slug='rustic-bread-donut'),true),
  ((select id from public.products where slug='reference-pie-canape'),(select id from public.categories where slug='pie-canape'),true),
  ((select id from public.products where slug='reference-traditional-and-other'),(select id from public.categories where slug='traditional-and-other'),true),
  ((select id from public.products where slug='demo-coffee'),(select id from public.categories where slug='demo-chiffon-series'),true),
  ((select id from public.products where slug='demo-rok'),(select id from public.categories where slug='demo-rok-n-roll-series'),true),
  ((select id from public.products where slug='demo-mix'),(select id from public.categories where slug='demo-chiffon-slice-mix'),true),
  ((select id from public.products where slug='demo-cheese'),(select id from public.categories where slug='demo-chiffon-series'),true),
  ((select id from public.products where slug='demo-choco'),(select id from public.categories where slug='demo-chiffon-series'),true),
  ((select id from public.products where slug='demo-pandan'),(select id from public.categories where slug='demo-chiffon-series'),true),
  ((select id from public.products where slug='demo-vanilla'),(select id from public.categories where slug='demo-chiffon-series'),true),
  ((select id from public.products where slug='demo-roti'),(select id from public.categories where slug='demo-roti-isi'),true)
on conflict do nothing;

insert into public.product_variants (id,product_id,sku,name,base_price_idr,status,is_default,bundle_recipe,bundle_units_total) values
  ('f0400000-0000-4000-8000-000000000500',(select id from public.products where slug='reference-chiffon-series'),'REF-F04-0','Slice',15000,'draft',true,null,null),
  ('f0400000-0000-4000-8000-000000000501',(select id from public.products where slug='reference-chiffon-series'),'REF-F04-1','Mini 14 cm',70000,'draft',false,null,null),
  ('f0400000-0000-4000-8000-000000000502',(select id from public.products where slug='reference-chiffon-series'),'REF-F04-2','Whole 20 cm',140000,'draft',false,null,null),
  ('f0400000-0000-4000-8000-000000000503',(select id from public.products where slug='reference-rok-n-roll-series'),'REF-F04-3','Slice',25000,'draft',true,null,null),
  ('f0400000-0000-4000-8000-000000000504',(select id from public.products where slug='reference-rok-n-roll-series'),'REF-F04-4','Whole',130000,'draft',false,null,null),
  ('f0400000-0000-4000-8000-000000000505',(select id from public.products where slug='reference-chiffon-slice-mix'),'REF-F04-5','Regular pack 12 slices',180000,'draft',true,'chiffon_mix',12),
  ('f0400000-0000-4000-8000-000000000506',(select id from public.products where slug='reference-chiffon-slice-mix'),'REF-F04-6','GF pack 12 slices',190000,'draft',false,'chiffon_mix',12),
  ('f0400000-0000-4000-8000-000000000507',(select id from public.products where slug='reference-roti-isi'),'REF-F04-7','Piece',10000,'draft',true,null,null),
  ('f0400000-0000-4000-8000-000000000508',(select id from public.products where slug='reference-sekotak-chiffon'),'REF-F04-8','Box',30000,'draft',true,null,null)
on conflict do nothing;

insert into public.product_variants (id,product_id,sku,name,base_price_idr,status,is_default,bundle_recipe,bundle_units_total,bundle_rules_verified) values
  ('f0400000-0000-4000-8000-000000000600',(select id from public.products where slug='demo-coffee'),'DEMO-F04-0','DEMO — Slice',15000,'active',true,null,null,false),
  ('f0400000-0000-4000-8000-000000000601',(select id from public.products where slug='demo-coffee'),'DEMO-F04-1','DEMO — Mini 14 cm',70000,'active',false,null,null,false),
  ('f0400000-0000-4000-8000-000000000602',(select id from public.products where slug='demo-coffee'),'DEMO-F04-2','DEMO — Whole 20 cm',140000,'active',false,null,null,false),
  ('f0400000-0000-4000-8000-000000000603',(select id from public.products where slug='demo-rok'),'DEMO-F04-3','DEMO — Slice',25000,'active',true,null,null,false),
  ('f0400000-0000-4000-8000-000000000604',(select id from public.products where slug='demo-rok'),'DEMO-F04-4','DEMO — Whole',130000,'active',false,null,null,false),
  ('f0400000-0000-4000-8000-000000000605',(select id from public.products where slug='demo-mix'),'DEMO-F04-5','DEMO — Regular pack 12 slices',180000,'active',true,'chiffon_mix',12,true),
  ('f0400000-0000-4000-8000-000000000606',(select id from public.products where slug='demo-mix'),'DEMO-F04-6','DEMO — GF pack 12 slices',190000,'active',false,'chiffon_mix',12,true),
  ('f0400000-0000-4000-8000-000000000607',(select id from public.products where slug='demo-cheese'),'DEMO-F04-7','DEMO — Regular slice',17000,'active',true,null,null,false),
  ('f0400000-0000-4000-8000-000000000608',(select id from public.products where slug='demo-cheese'),'DEMO-F04-8','DEMO — GF DEMO slice',20000,'active',false,null,null,false),
  ('f0400000-0000-4000-8000-000000000609',(select id from public.products where slug='demo-choco'),'DEMO-F04-9','DEMO — Regular slice',19000,'active',true,null,null,false),
  ('f0400000-0000-4000-8000-000000000610',(select id from public.products where slug='demo-choco'),'DEMO-F04-10','DEMO — GF DEMO slice',22000,'active',false,null,null,false),
  ('f0400000-0000-4000-8000-000000000611',(select id from public.products where slug='demo-pandan'),'DEMO-F04-11','DEMO — Regular slice',16000,'active',true,null,null,false),
  ('f0400000-0000-4000-8000-000000000612',(select id from public.products where slug='demo-pandan'),'DEMO-F04-12','DEMO — GF DEMO slice',21000,'active',false,null,null,false),
  ('f0400000-0000-4000-8000-000000000613',(select id from public.products where slug='demo-vanilla'),'DEMO-F04-13','DEMO — Regular slice',16000,'active',true,null,null,false),
  ('f0400000-0000-4000-8000-000000000614',(select id from public.products where slug='demo-vanilla'),'DEMO-F04-14','DEMO — GF DEMO slice',21000,'active',false,null,null,false),
  ('f0400000-0000-4000-8000-000000000615',(select id from public.products where slug='demo-roti'),'DEMO-F04-15','DEMO — Piece',10000,'active',true,null,null,false)
on conflict do nothing;

insert into public.product_images (id,product_id,storage_path,storage_bucket,alt_text,is_approved,is_primary) values
  ('f0400000-0000-4000-8000-000000000700',(select id from public.products where slug='demo-coffee'),'approved/f0400000-0000-4000-8000-000000000990.png','product-images','DEMO — ilustrasi placeholder, bukan foto produk komersial',true,true),
  ('f0400000-0000-4000-8000-000000000701',(select id from public.products where slug='demo-rok'),'approved/f0400000-0000-4000-8000-000000000990.png','product-images','DEMO — ilustrasi placeholder, bukan foto produk komersial',true,true),
  ('f0400000-0000-4000-8000-000000000702',(select id from public.products where slug='demo-mix'),'approved/f0400000-0000-4000-8000-000000000990.png','product-images','DEMO — ilustrasi placeholder, bukan foto produk komersial',true,true),
  ('f0400000-0000-4000-8000-000000000703',(select id from public.products where slug='demo-cheese'),'approved/f0400000-0000-4000-8000-000000000990.png','product-images','DEMO — ilustrasi placeholder, bukan foto produk komersial',true,true),
  ('f0400000-0000-4000-8000-000000000704',(select id from public.products where slug='demo-choco'),'approved/f0400000-0000-4000-8000-000000000990.png','product-images','DEMO — ilustrasi placeholder, bukan foto produk komersial',true,true),
  ('f0400000-0000-4000-8000-000000000705',(select id from public.products where slug='demo-pandan'),'approved/f0400000-0000-4000-8000-000000000990.png','product-images','DEMO — ilustrasi placeholder, bukan foto produk komersial',true,true),
  ('f0400000-0000-4000-8000-000000000706',(select id from public.products where slug='demo-vanilla'),'approved/f0400000-0000-4000-8000-000000000990.png','product-images','DEMO — ilustrasi placeholder, bukan foto produk komersial',true,true),
  ('f0400000-0000-4000-8000-000000000707',(select id from public.products where slug='demo-roti'),'approved/f0400000-0000-4000-8000-000000000990.png','product-images','DEMO — ilustrasi placeholder, bukan foto produk komersial',true,true)
on conflict do nothing;

insert into public.branch_variant_offers (branch_id,variant_id,is_listed,availability_status,stock_quantity,price_override_idr) values
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-0'),true,'sold_out',0,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-0'),true,'unconfirmed',null,16000),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-1'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-1'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-2'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-2'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-3'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-3'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-4'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-4'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-5'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-5'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-6'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-6'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-7'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-7'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-8'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-8'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-9'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-9'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-10'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-10'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-11'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-11'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-12'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-12'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-13'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-13'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-14'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-14'),true,'available',null,null),
  ((select id from public.branches where code='surabaya'),(select id from public.product_variants where sku='DEMO-F04-15'),true,'available',null,null),
  ((select id from public.branches where code='bintaro'),(select id from public.product_variants where sku='DEMO-F04-15'),true,'available',null,null)
on conflict do nothing;

insert into public.option_groups (id,bundle_variant_id,name,min_select,max_select,quantity_per_selection,is_required,sort_order) values
  ('f0400000-0000-4000-8000-000000000800',(select id from public.product_variants where sku='DEMO-F04-5'),'DEMO C — Regular',1,1,3,true,0),
  ('f0400000-0000-4000-8000-000000000801',(select id from public.product_variants where sku='DEMO-F04-5'),'DEMO D — Regular',1,1,3,true,1),
  ('f0400000-0000-4000-8000-000000000802',(select id from public.product_variants where sku='DEMO-F04-6'),'DEMO C — GF',1,1,3,true,0),
  ('f0400000-0000-4000-8000-000000000803',(select id from public.product_variants where sku='DEMO-F04-6'),'DEMO D — GF',1,1,3,true,1)
on conflict do nothing;

insert into public.option_choices (id,group_id,label,component_variant_id) values
  ('f0400000-0000-4000-8000-000000000810','f0400000-0000-4000-8000-000000000800','DEMO — Pandan',(select id from public.product_variants where sku='DEMO-F04-11')),
  ('f0400000-0000-4000-8000-000000000811','f0400000-0000-4000-8000-000000000801','DEMO — Vanilla',(select id from public.product_variants where sku='DEMO-F04-13')),
  ('f0400000-0000-4000-8000-000000000812','f0400000-0000-4000-8000-000000000802','DEMO — Pandan',(select id from public.product_variants where sku='DEMO-F04-12')),
  ('f0400000-0000-4000-8000-000000000813','f0400000-0000-4000-8000-000000000803','DEMO — Vanilla',(select id from public.product_variants where sku='DEMO-F04-14'))
on conflict do nothing;

insert into public.bundle_fixed_components (id,bundle_variant_id,component_variant_id,component_slot,quantity) values
  ('f0400000-0000-4000-8000-000000000820',(select id from public.product_variants where sku='DEMO-F04-5'),(select id from public.product_variants where sku='DEMO-F04-7'),'cheese',3),
  ('f0400000-0000-4000-8000-000000000821',(select id from public.product_variants where sku='DEMO-F04-5'),(select id from public.product_variants where sku='DEMO-F04-9'),'choco',3),
  ('f0400000-0000-4000-8000-000000000822',(select id from public.product_variants where sku='DEMO-F04-6'),(select id from public.product_variants where sku='DEMO-F04-8'),'cheese',3),
  ('f0400000-0000-4000-8000-000000000823',(select id from public.product_variants where sku='DEMO-F04-6'),(select id from public.product_variants where sku='DEMO-F04-10'),'choco',3)
on conflict do nothing;

insert into public.dietary_tags (id,slug,name,description) values
  ('f0400000-0000-4000-8000-000000000900','gluten-free','gluten-free','Taxonomy; assignment needs per-SKU verification. DEMO assignments are synthetic.'),
  ('f0400000-0000-4000-8000-000000000901','vegan','vegan','Taxonomy; assignment needs per-SKU verification. DEMO assignments are synthetic.'),
  ('f0400000-0000-4000-8000-000000000902','egg-free','egg-free','Taxonomy; assignment needs per-SKU verification. DEMO assignments are synthetic.'),
  ('f0400000-0000-4000-8000-000000000903','dairy-free','dairy-free','Taxonomy; assignment needs per-SKU verification. DEMO assignments are synthetic.')
on conflict do nothing;

insert into public.allergens (id,slug,name) values
  ('f0400000-0000-4000-8000-000000000910','milk','milk'),
  ('f0400000-0000-4000-8000-000000000911','egg','egg'),
  ('f0400000-0000-4000-8000-000000000912','wheat','wheat'),
  ('f0400000-0000-4000-8000-000000000913','peanut','peanut'),
  ('f0400000-0000-4000-8000-000000000914','tree-nut','tree-nut'),
  ('f0400000-0000-4000-8000-000000000915','soy','soy')
on conflict do nothing;

insert into public.variant_dietary_tags (variant_id,dietary_tag_id,verification_status,verified_at,note) values
  ((select id from public.product_variants where sku='DEMO-F04-6'),(select id from public.dietary_tags where slug='gluten-free'),'verified','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO verification, not owner approval of actual ingredients.'),
  ((select id from public.product_variants where sku='DEMO-F04-8'),(select id from public.dietary_tags where slug='gluten-free'),'verified','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO verification, not owner approval of actual ingredients.'),
  ((select id from public.product_variants where sku='DEMO-F04-10'),(select id from public.dietary_tags where slug='gluten-free'),'verified','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO verification, not owner approval of actual ingredients.'),
  ((select id from public.product_variants where sku='DEMO-F04-12'),(select id from public.dietary_tags where slug='gluten-free'),'verified','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO verification, not owner approval of actual ingredients.'),
  ((select id from public.product_variants where sku='DEMO-F04-14'),(select id from public.dietary_tags where slug='gluten-free'),'verified','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO verification, not owner approval of actual ingredients.')
on conflict do nothing;

insert into public.variant_allergens (variant_id,allergen_id,presence,verified_at,source_note) values
  ((select id from public.product_variants where sku='DEMO-F04-7'),(select id from public.allergens where slug='milk'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-7'),(select id from public.allergens where slug='egg'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-8'),(select id from public.allergens where slug='milk'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-8'),(select id from public.allergens where slug='egg'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-9'),(select id from public.allergens where slug='milk'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-9'),(select id from public.allergens where slug='egg'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-10'),(select id from public.allergens where slug='milk'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-10'),(select id from public.allergens where slug='egg'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-11'),(select id from public.allergens where slug='milk'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-11'),(select id from public.allergens where slug='egg'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-12'),(select id from public.allergens where slug='milk'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-12'),(select id from public.allergens where slug='egg'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-13'),(select id from public.allergens where slug='milk'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-13'),(select id from public.allergens where slug='egg'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-14'),(select id from public.allergens where slug='milk'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-14'),(select id from public.allergens where slug='egg'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-15'),(select id from public.allergens where slug='milk'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.'),
  ((select id from public.product_variants where sku='DEMO-F04-15'),(select id from public.allergens where slug='egg'),'contains','2026-11-11T00:00:00+07:00','SYNTHETIC DEMO only; not actual ingredient evidence.')
on conflict do nothing;

insert into public.promotions (id,title,slug,discount_type,discount_value,scope,starts_at,ends_at,status,is_enabled,max_discount_idr) values
  ('f0400000-0000-4000-8000-000000000930','DEMO — expired','demo-expired','percentage',10,'category','2026-10-28T00:00:00+07:00','2026-11-04T00:00:00+07:00','published',true,10000),
  ('f0400000-0000-4000-8000-000000000931','DEMO — current at reference clock','demo-current','fixed',2000,'product','2026-11-10T00:00:00+07:00','2026-11-18T00:00:00+07:00','published',true,5000),
  ('f0400000-0000-4000-8000-000000000932','DEMO — future','demo-future','percentage',15,'variant','2026-12-11T00:00:00+07:00','2026-12-18T00:00:00+07:00','published',true,20000)
on conflict do nothing;

insert into public.promotion_categories (promotion_id,category_id) values
  ('f0400000-0000-4000-8000-000000000930',(select id from public.categories where slug='demo-chiffon-series'))
on conflict do nothing;

insert into public.promotion_products (promotion_id,product_id) values
  ('f0400000-0000-4000-8000-000000000931',(select id from public.products where slug='demo-coffee'))
on conflict do nothing;

insert into public.promotion_variants (promotion_id,variant_id) values
  ('f0400000-0000-4000-8000-000000000932',(select id from public.product_variants where sku='DEMO-F04-3'))
on conflict do nothing;

insert into public.promotion_branches (promotion_id,branch_id) values
  ('f0400000-0000-4000-8000-000000000931',(select id from public.branches where code='bintaro'))
on conflict do nothing;

insert into public.class_programs (id,title,slug,base_price_idr,description,included_items,cover_image_path,cover_storage_bucket,cover_is_approved,cover_alt_text,needs_owner_review,status) values
  ('f0400000-0000-4000-8000-000000000940','DEMO — Fruit Tartlet','demo-class-0',100000,'SYNTHETIC DEMO class; price, seats and dates are not a business schedule.','["DEMO learning materials"]','approved/f0400000-0000-4000-8000-000000000990.png','class-images',true,'DEMO — ilustrasi placeholder',false,'published'),
  ('f0400000-0000-4000-8000-000000000941','DEMO — Cookies','demo-class-1',100000,'SYNTHETIC DEMO class; price, seats and dates are not a business schedule.','["DEMO learning materials"]','approved/f0400000-0000-4000-8000-000000000990.png','class-images',true,'DEMO — ilustrasi placeholder',false,'published')
on conflict do nothing;

insert into public.class_sessions (id,program_id,branch_id,starts_at,ends_at,registration_deadline_at,capacity,seats_left,status,is_registration_open) values
  ('f0400000-0000-4000-8000-000000000950','f0400000-0000-4000-8000-000000000940',(select id from public.branches where code='surabaya'),'2026-10-28T10:00:00+07:00','2026-10-28T12:00:00+07:00',null,12,0,'completed',false),
  ('f0400000-0000-4000-8000-000000000951','f0400000-0000-4000-8000-000000000940',(select id from public.branches where code='surabaya'),'2026-12-11T10:00:00+07:00','2026-12-11T12:00:00+07:00','2026-12-10T10:00:00+07:00',12,8,'scheduled',true),
  ('f0400000-0000-4000-8000-000000000952','f0400000-0000-4000-8000-000000000941',(select id from public.branches where code='bintaro'),'2026-12-12T10:00:00+07:00','2026-12-12T12:00:00+07:00',null,10,0,'full',false)
on conflict do nothing;

insert into public.faqs (id,category,question,answer,status) values
  ('f0400000-0000-4000-8000-000000000960','Pemesanan','Bagaimana pemesanan dikonfirmasi?','Pesanan, stok, ongkir dan total akhir dikonfirmasi admin melalui WhatsApp.','draft'),
  ('f0400000-0000-4000-8000-000000000961','Penyimpanan','Bagaimana cara menyimpan produk?','Tanyakan petunjuk penyimpanan untuk produk yang dipilih kepada admin.','draft'),
  ('f0400000-0000-4000-8000-000000000962','DEMO','DEMO — Apakah data ini dapat dipakai memesan?','Tidak. Ini data sintetis lokal, bukan katalog pemesanan aktif.','published')
on conflict do nothing;

insert into public.testimonials (id,display_name,quote,source_label,rating,consent_reference,consent_at,status) values
  ('f0400000-0000-4000-8000-000000000970','Pelanggan Resep Oma','Fruit pie-nya enak, crunchy pie crust-nya. Vla-nya pas, tidak kemanisan.','Referensi historis — menunggu izin',null,null,null,'draft'),
  ('f0400000-0000-4000-8000-000000000971','Pelanggan Resep Oma','Hands down the best chiffon cake ever.','Referensi historis — menunggu izin',null,null,null,'draft'),
  ('f0400000-0000-4000-8000-000000000972','Pelanggan Resep Oma','Kreatif, kemasannya rapi.','Referensi historis — menunggu izin',null,null,null,'draft'),
  ('f0400000-0000-4000-8000-000000000973','Pelanggan Resep Oma','Enak, benar-benar empuk. Dimakan polosan saja sudah enak.','Referensi historis — menunggu izin',null,null,null,'draft')
on conflict do nothing;

insert into public.site_content (key,content_json,status) values
  ('business.contacts','{"email":"resepoma.kueh2@gmail.com","instagram_url":"https://www.instagram.com/resepoma.kueh/"}','published'),
  ('home.hero','{"headline":"A Little Taste of Home, in Every Bite.","subcopy":"Resep klasik penuh kehangatan."}','draft'),
  ('home.story','{"title":"DEMO — Resep Oma Kueh","body":"Data demo — bukan katalog pemesanan aktif. Produk, harga, klaim diet, promo dan kelas sintetis untuk pengujian lokal.","image_path":"approved/f0400000-0000-4000-8000-000000000990.png","image_alt":"DEMO placeholder","media_approved":true}','published'),
  ('home.class_promo','{"title":"DEMO — Baking Class","body":"Jadwal dan harga di dataset ini sintetis; tanyakan jadwal nyata kepada admin."}','published'),
  ('home.custom_business','{"title":"Made for Your Business","body":"Tim dapat berdiskusi mengenai custom cake dan bread untuk kebutuhan bisnis melalui WhatsApp cabang pilihan."}','draft'),
  ('about.story','{"title":"Resep Oma Kueh","body":"Artisan cake and bread dari Surabaya, terinspirasi resep keluarga dan hangatnya rumah. Naskah awal untuk review owner."}','draft'),
  ('about.values','{"items":["Authenticity","Craftsmanship","Warmth","Quality","Tradition"]}','draft'),
  ('footer.note','{"text":"Data demo — bukan katalog pemesanan aktif."}','published'),
  ('legal.privacy','{"title":"Draft privasi","body":"Cart berada di browser; checkout diproses sementara di server dan pengguna membuka WhatsApp. Review owner diperlukan sebelum publikasi."}','draft'),
  ('legal.ordering_policy','{"title":"Draft kebijakan pemesanan","body":"Pesanan, stok, ongkir, pembayaran dan total akhir dikonfirmasi admin melalui WhatsApp."}','draft'),
  ('community.instagram','{"url":"https://www.instagram.com/resepoma.kueh/","items":[]}','draft')
on conflict do nothing;

commit;
