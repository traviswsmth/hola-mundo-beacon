-- Ejecuta esto en Supabase Dashboard > SQL Editor > New Query
-- Crea la tabla de logs para hola-mundo-beacon

create table if not exists logs (
  id bigint generated always as identity primary key,
  message text not null,
  endpoint text,
  ip text,
  user_agent text,
  timestamp timestamptz default now() not null
);

-- Habilitar RLS (Row Level Security) - requerido en Supabase
alter table logs enable row level security;

-- Políticas permisivas para demo (permite insert/select con anon key)
-- En producción, usa service_role key en el backend y restringe anon
drop policy if exists "allow insert" on logs;
create policy "allow insert" on logs for insert with check (true);

drop policy if exists "allow select" on logs;
create policy "allow select" on logs for select using (true);

-- Índices para consultas rápidas
create index if not exists idx_logs_timestamp on logs (timestamp desc);

-- Verificar
-- select * from logs order by timestamp desc limit 5;
