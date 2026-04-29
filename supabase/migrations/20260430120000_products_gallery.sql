-- Imágenes adicionales en ficha de producto (hasta 3 URLs; la principal sigue en `image`)
alter table public.products
  add column if not exists gallery text[] not null default '{}'::text[];

comment on column public.products.gallery is 'URLs de fotos extra (máx. 3 en app); principal en `image`.';
