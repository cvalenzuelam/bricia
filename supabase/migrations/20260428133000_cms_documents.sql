-- Documentos CMS como JSON único por clave (sustituto de archivos JSON en Vercel Blob)
create table if not exists public.cms_documents (
  doc_key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists cms_documents_updated_idx on public.cms_documents (updated_at desc);

alter table public.cms_documents enable row level security;

comment on table public.cms_documents is
  'Pares clave/documento para hero, contacto, recetas, la mesa, pedidos (JSON). Solo servidor con service role.';
