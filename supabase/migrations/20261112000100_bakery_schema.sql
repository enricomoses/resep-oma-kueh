-- F02: schema only. No seed, runtime policies, public RPC, or business data.
begin;
create schema if not exists bakery_private;
revoke all on schema bakery_private from public, anon, authenticated;

create domain bakery_private.label as text check (length(trim(value)) between 1 and 200);
create domain bakery_private.body as text check (length(value) <= 10000);
create domain bakery_private.slug as text check (length(value) between 1 and 120 and value ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
create domain bakery_private.unit_idr as bigint check (value between 1 and 1000000000);
create domain bakery_private.nonnegative_idr as bigint check (value between 0 and 1000000000000);
create domain bakery_private.media_path as text check (
  length(value) between 1 and 500 and value !~ '(^/|://|\\|[[:cntrl:]])'
  and value !~ '(^|/)\.\.?(/|$)'
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('surabaya','bintaro')),
  name bakery_private.label not null, city bakery_private.label not null,
  address bakery_private.body, maps_url text check (length(maps_url) <= 2000 and maps_url ~ '^https://'),
  whatsapp_number varchar(16) not null check (whatsapp_number ~ '^[1-9][0-9]{7,15}$'),
  description bakery_private.body,
  allow_pickup boolean not null default false, allow_delivery boolean not null default false,
  sort_order integer not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.branches enable row level security;
create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches on delete restrict,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time, closes_at time, is_closed boolean not null default false, note bakery_private.body,
  unique (branch_id, day_of_week),
  check ((opens_at is null and closes_at is null) or
    (not is_closed and opens_at is not null and closes_at is not null and closes_at > opens_at)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.business_hours enable row level security;
create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  display_name bakery_private.label not null,
  role text not null check (role in ('owner','branch_admin')),
  branch_id uuid references public.branches on delete restrict,
  is_active boolean not null default true,
  check ((role = 'owner' and branch_id is null) or (role = 'branch_admin' and branch_id is not null)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.admin_profiles enable row level security;
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories on delete restrict,
  name bakery_private.label not null, slug bakery_private.slug not null unique,
  description bakery_private.body, cover_image_path bakery_private.media_path,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  check (parent_id <> id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name bakery_private.label not null, slug bakery_private.slug not null unique,
  short_description text check (length(short_description) <= 500), description bakery_private.body,
  product_type text not null check (product_type in ('simple','variants','bundle')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_featured boolean not null default false, is_best_seller boolean not null default false,
  is_new boolean not null default false,
  storage_instructions bakery_private.body, ingredients_info bakery_private.body,
  needs_owner_review boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create table public.product_categories (
  product_id uuid not null references public.products on delete restrict,
  category_id uuid not null references public.categories on delete restrict,
  is_primary boolean not null default false, primary key(product_id,category_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.product_categories enable row level security;
create unique index product_one_primary_category on public.product_categories(product_id) where is_primary;
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete restrict,
  sku text not null unique check (length(sku) between 1 and 80 and sku ~ '^[A-Z0-9]+([_-][A-Z0-9]+)*$'),
  name bakery_private.label not null, size_label bakery_private.label,
  base_price_idr bakery_private.unit_idr not null,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  sort_order integer not null default 0,
  max_quantity_per_order integer not null default 99 check (max_quantity_per_order between 1 and 99),
  is_default boolean not null default false,
  bundle_units_total integer check (bundle_units_total > 0),
  bundle_recipe text check (bundle_recipe = 'chiffon_mix'),
  bundle_rules_verified boolean not null default false,
  unique(id,product_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.product_variants enable row level security;
create unique index product_one_default_variant on public.product_variants(product_id) where is_default;
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete restrict,
  variant_id uuid,
  foreign key (variant_id,product_id) references public.product_variants(id,product_id) on delete restrict,
  storage_path bakery_private.media_path not null, alt_text bakery_private.label,
  storage_bucket text not null default 'media-drafts' check (storage_bucket in ('media-drafts','product-images')),
  is_approved boolean not null default false,
  check (not is_approved or (storage_bucket = 'product-images' and alt_text is not null)),
  sort_order integer not null default 0, is_primary boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.product_images enable row level security;
create unique index product_one_primary_image on public.product_images(product_id) where is_primary;
create table public.branch_variant_offers (
  branch_id uuid not null references public.branches on delete restrict,
  variant_id uuid not null references public.product_variants on delete restrict,
  is_listed boolean not null default false,
  availability_status text not null default 'unconfirmed' check (availability_status in ('available','sold_out','unconfirmed')),
  stock_quantity integer check (stock_quantity >= 0), price_override_idr bakery_private.unit_idr,
  check (stock_quantity is distinct from 0 or availability_status = 'sold_out'),
  primary key(branch_id,variant_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.branch_variant_offers enable row level security;
create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  bundle_variant_id uuid not null references public.product_variants on delete restrict,
  name bakery_private.label not null,
  min_select integer not null check (min_select between 0 and 99),
  max_select integer not null check (max_select between min_select and 99),
  quantity_per_selection integer not null default 1 check (quantity_per_selection between 1 and 99),
  sort_order integer not null default 0, is_required boolean not null default true,
  check (not is_required or min_select > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.option_groups enable row level security;
create table public.option_choices (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.option_groups on delete restrict,
  label bakery_private.label not null,
  component_variant_id uuid references public.product_variants on delete restrict,
  price_delta_idr bigint not null default 0 check (price_delta_idr between 0 and 1000000000),
  is_active boolean not null default true, sort_order integer not null default 0,
  unique(group_id,component_variant_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.option_choices enable row level security;
create table public.bundle_fixed_components (
  id uuid primary key default gen_random_uuid(),
  bundle_variant_id uuid not null references public.product_variants on delete restrict,
  component_variant_id uuid not null references public.product_variants on delete restrict,
  component_slot text not null check (component_slot in ('cheese','choco')),
  quantity integer not null check (quantity between 1 and 99), sort_order integer not null default 0,
  check (bundle_variant_id <> component_variant_id),
  unique(bundle_variant_id,component_variant_id), unique(bundle_variant_id,component_slot),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.bundle_fixed_components enable row level security;
create table public.dietary_tags (
  id uuid primary key default gen_random_uuid(), slug bakery_private.slug not null unique,
  name bakery_private.label not null, description bakery_private.body,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.dietary_tags enable row level security;
create table public.variant_dietary_tags (
  variant_id uuid not null references public.product_variants on delete restrict,
  dietary_tag_id uuid not null references public.dietary_tags on delete restrict,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified')),
  verified_at timestamptz, note bakery_private.body,
  check ((verification_status = 'verified') = (verified_at is not null)),
  primary key(variant_id,dietary_tag_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.variant_dietary_tags enable row level security;
create table public.allergens (
  id uuid primary key default gen_random_uuid(), slug bakery_private.slug not null unique,
  name bakery_private.label not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.allergens enable row level security;
create table public.variant_allergens (
  variant_id uuid not null references public.product_variants on delete restrict,
  allergen_id uuid not null references public.allergens on delete restrict,
  presence text not null check (presence in ('contains','may_contain','not_declared')),
  source_note bakery_private.body, verified_at timestamptz,
  primary key(variant_id,allergen_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.variant_allergens enable row level security;
create table public.promotions (
  id uuid primary key default gen_random_uuid(), title bakery_private.label not null,
  slug bakery_private.slug not null unique, description bakery_private.body,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0 and
    ((discount_type = 'percentage' and discount_value <= 100) or
     (discount_type = 'fixed' and discount_value = trunc(discount_value) and discount_value <= 1000000000))),
  max_discount_idr bakery_private.nonnegative_idr,
  min_spend_idr bakery_private.nonnegative_idr not null default 0,
  scope text not null check (scope in ('all','category','product','variant')),
  starts_at timestamptz not null, ends_at timestamptz not null,
  check (isfinite(starts_at) and isfinite(ends_at) and ends_at > starts_at),
  priority integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_enabled boolean not null default false,
  is_stackable boolean not null default false check (not is_stackable),
  banner_image_path bakery_private.media_path,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.promotions enable row level security;
create table public.promotion_branches (
  promotion_id uuid not null references public.promotions on delete restrict,
  branch_id uuid not null references public.branches on delete restrict,
  primary key(promotion_id,branch_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.promotion_branches enable row level security;
create table public.promotion_categories (
  promotion_id uuid not null references public.promotions on delete restrict,
  category_id uuid not null references public.categories on delete restrict,
  primary key(promotion_id,category_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.promotion_categories enable row level security;
create table public.promotion_products (
  promotion_id uuid not null references public.promotions on delete restrict,
  product_id uuid not null references public.products on delete restrict,
  primary key(promotion_id,product_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.promotion_products enable row level security;
create table public.promotion_variants (
  promotion_id uuid not null references public.promotions on delete restrict,
  variant_id uuid not null references public.product_variants on delete restrict,
  primary key(promotion_id,variant_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.promotion_variants enable row level security;
create table public.class_programs (
  id uuid primary key default gen_random_uuid(), title bakery_private.label not null,
  slug bakery_private.slug not null unique,
  short_description text check (length(short_description) <= 500), description bakery_private.body,
  base_price_idr bakery_private.unit_idr not null,
  age_min smallint check (age_min between 0 and 120), age_max smallint check (age_max between 0 and 120),
  check (age_min <= age_max), duration_minutes integer check (duration_minutes > 0),
  cover_image_path bakery_private.media_path,
  cover_storage_bucket text not null default 'media-drafts' check (cover_storage_bucket in ('media-drafts','class-images')),
  cover_is_approved boolean not null default false, cover_alt_text bakery_private.label,
  needs_owner_review boolean not null default true,
  included_items jsonb not null default '[]' check (jsonb_typeof(included_items) = 'array'
    and jsonb_array_length(included_items) <= 50
    and not jsonb_path_exists(included_items, '$[*] ? (@.type() != "string")')
    and length(included_items::text) <= 10000),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  check (not cover_is_approved or (cover_storage_bucket = 'class-images' and cover_alt_text is not null and cover_image_path is not null)),
  check (status <> 'published' or (not needs_owner_review and length(trim(description)) > 0
    and description is not null and cover_is_approved)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.class_programs enable row level security;
create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.class_programs on delete restrict,
  branch_id uuid not null references public.branches on delete restrict,
  starts_at timestamptz not null, ends_at timestamptz not null, registration_deadline_at timestamptz,
  check (isfinite(starts_at) and isfinite(ends_at) and ends_at > starts_at),
  check (registration_deadline_at is null or (isfinite(registration_deadline_at) and registration_deadline_at <= starts_at)),
  capacity integer not null check (capacity > 0), seats_left integer check (seats_left between 0 and capacity),
  price_override_idr bakery_private.unit_idr,
  status text not null default 'scheduled' check (status in ('scheduled','full','cancelled','completed')),
  is_registration_open boolean not null default false,
  check (not is_registration_open or (status = 'scheduled' and (seats_left is null or seats_left > 0))),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.class_sessions enable row level security;
create table public.testimonials (
  id uuid primary key default gen_random_uuid(), display_name bakery_private.label not null,
  quote bakery_private.body not null check (length(trim(quote)) > 0),
  rating smallint check (rating between 1 and 5), source_label bakery_private.label,
  source_url text check (length(source_url) <= 2000 and source_url ~ '^https://'),
  consent_reference bakery_private.body, consent_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  check (status <> 'published' or (consent_at is not null and consent_reference is not null and length(trim(consent_reference)) > 0)),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.testimonials enable row level security;
create table public.faqs (
  id uuid primary key default gen_random_uuid(), category bakery_private.label not null,
  question bakery_private.label not null, answer bakery_private.body not null check (length(trim(answer)) > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.faqs enable row level security;
create table public.site_content (
  key text primary key check (key in ('business.contacts','home.hero','home.story','home.class_promo',
    'home.custom_business','about.story','about.values','footer.note','legal.privacy','legal.ordering_policy','community.instagram')),
  content_json jsonb not null check (jsonb_typeof(content_json) = 'object' and octet_length(content_json::text) <= 32000),
  status text not null default 'draft' check (status in ('draft','published')),
  updated_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;

-- Reverse FK and deterministic public/list lookup indexes; leading PKs cover forward joins.
create index admin_profiles_branch_idx on public.admin_profiles(branch_id);
create index categories_parent_idx on public.categories(parent_id);
create index categories_status_sort_idx on public.categories(status,sort_order,name,id);
create index products_status_sort_idx on public.products(status,sort_order,name,id);
create index products_featured_idx on public.products(sort_order,id) where status = 'published' and is_featured;
create index product_categories_category_idx on public.product_categories(category_id,product_id);
create index variants_product_status_idx on public.product_variants(product_id,status,sort_order,id);
create index product_images_variant_idx on public.product_images(variant_id,product_id);
create index product_images_sort_idx on public.product_images(product_id,sort_order,id);
create index offers_variant_idx on public.branch_variant_offers(variant_id,branch_id);
create index offers_listing_idx on public.branch_variant_offers(branch_id,is_listed,availability_status,variant_id);
create index option_groups_bundle_idx on public.option_groups(bundle_variant_id,sort_order,id);
create index option_choices_component_idx on public.option_choices(component_variant_id);
create index fixed_components_component_idx on public.bundle_fixed_components(component_variant_id);
create index variant_dietary_tag_idx on public.variant_dietary_tags(dietary_tag_id,variant_id);
create index variant_allergen_idx on public.variant_allergens(allergen_id,variant_id);
create index promotions_window_idx on public.promotions(starts_at,ends_at,priority,id) where status = 'published' and is_enabled;
create index promotion_branches_target_idx on public.promotion_branches(branch_id,promotion_id);
create index promotion_categories_target_idx on public.promotion_categories(category_id,promotion_id);
create index promotion_products_target_idx on public.promotion_products(product_id,promotion_id);
create index promotion_variants_target_idx on public.promotion_variants(variant_id,promotion_id);
create index sessions_upcoming_idx on public.class_sessions(branch_id,status,starts_at,id);
create index sessions_global_upcoming_idx on public.class_sessions(starts_at,branch_id,status,id);
create index sessions_program_idx on public.class_sessions(program_id,starts_at,id);
create index testimonials_status_sort_idx on public.testimonials(status,sort_order,id);
create index faqs_status_sort_idx on public.faqs(status,sort_order,id);
create index site_content_updated_by_idx on public.site_content(updated_by);

-- Supabase default privileges must not accidentally expose this schema before F03.
revoke all on all tables in schema public from public, anon, authenticated;
commit;
