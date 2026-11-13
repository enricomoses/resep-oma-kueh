begin;

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
          or jsonb_typeof(v->'href') <> 'string' or (v->>'href') !~ '^https://www\.instagram\.com/[^[:space:]<>"'']+$'
          or jsonb_typeof(v->'media_approved') <> 'boolean'
          or (published and v->'media_approved' <> 'true'::jsonb)) then return false; end if;
      end if;
    else
      if jsonb_typeof(item.value) <> 'string' or length(trim(item.value #>> '{}')) not between 1 and 10000 then return false; end if;
      if item.key in ('instagram_url','url') and (item.value #>> '{}') !~ '^https://www\.instagram\.com/[a-zA-Z0-9_.]+/$' then return false; end if;
      if item.key = 'email' and (item.value #>> '{}') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return false; end if;
    end if;
  end loop;
  -- Plain text/structured media only; reject markup tags, unsafe URI schemes, and unapproved public image paths.
  if payload::text ~* '(javascript:|vbscript:|data:text/html|<[/!A-Za-z])' then return false; end if;
  if payload ? 'image_path' and (
    (payload->>'image_path') ~ '(^/|://|\\|(^|/)\.\.?(/|$))'
    or length(payload->>'image_path') > 500
    or not payload ? 'image_alt'
    or length(payload->>'image_alt') > 200
    or (published and (payload->>'image_path') !~ '^approved/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|avif)$')
  ) then return false; end if;
  if published and payload ? 'image_path' and payload->'media_approved' is distinct from 'true'::jsonb then return false; end if;
  if content_key = 'community.instagram' and exists(
    select 1 from jsonb_array_elements(coalesce(payload->'items','[]')) v
    where (v->>'image_path') ~ '(^/|://|\\|(^|/)\.\.?(/|$))'
      or (published and (v->>'image_path') !~ '^approved/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|avif)$')
  ) then return false; end if;
  return true;
end;
$$;

alter table public.testimonials
  drop constraint if exists testimonials_source_url_safe_check,
  drop constraint if exists testimonials_plain_text_check;

alter table public.testimonials
  add constraint testimonials_source_url_safe_check check (
    source_url is null
    or (
      length(source_url) <= 2000
      and source_url ~ '^https://[^[:space:]<>"'']+$'
    )
  ),
  add constraint testimonials_plain_text_check check (
    display_name !~* '(javascript:|vbscript:|data:text/html|<[/!A-Za-z])'
    and quote !~* '(javascript:|vbscript:|data:text/html|<[/!A-Za-z])'
    and coalesce(source_label, '') !~* '(javascript:|vbscript:|data:text/html|<[/!A-Za-z])'
  );

alter table public.faqs
  drop constraint if exists faqs_plain_text_check;

alter table public.faqs
  add constraint faqs_plain_text_check check (
    category !~* '(javascript:|vbscript:|data:text/html|<[/!A-Za-z])'
    and question !~* '(javascript:|vbscript:|data:text/html|<[/!A-Za-z])'
    and answer !~* '(javascript:|vbscript:|data:text/html|<[/!A-Za-z])'
  );

commit;
