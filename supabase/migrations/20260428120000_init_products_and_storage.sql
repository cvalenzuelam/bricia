-- Catálogo: misma forma que Product (src/data/products.ts)
create table if not exists public.products (
  id text primary key,
  name text not null,
  subtitle text not null,
  price integer not null constraint products_price_nonneg check (price >= 0),
  description text not null,
  image text not null,
  category text not null,
  stock integer not null constraint products_stock_nonneg check (stock >= 0),
  dimensions text,
  material text,
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);

alter table public.products enable row level security;

comment on table public.products is 'Catálogo Bricia; escritura solo vía servidor con SUPABASE_SERVICE_ROLE_KEY.';

-- Storage de imágenes CMS (alternativa a Vercel Blob)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms',
  'cms',
  true,
  26214400,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública de objetos en bucket cms (URLs /storage/v1/object/public/...)
drop policy if exists "cms_objects_public_select" on storage.objects;
create policy "cms_objects_public_select"
on storage.objects for select
to public
using (bucket_id = 'cms');
