-- Client portal: projects, requests, budgets, usage tracking
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_budget_cents integer not null default 500,  -- תקציב חודשי בסנטים (דולר)
  auto_approve boolean not null default false,        -- הרצה אוטומטית בלי אישור שלך
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'client' check (role in ('admin','client')),
  client_id uuid references clients on delete set null,
  full_name text
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  project_id uuid not null references projects on delete cascade,
  created_by uuid not null references auth.users,
  title text not null,
  body text not null,
  status text not null default 'pending'
    check (status in ('pending','running','done','rejected','failed')),
  result text,
  error text,
  cost_cents numeric(10,4) not null default 0,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on requests (client_id, created_at desc);

create table usage_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients on delete cascade,
  request_id uuid references requests on delete set null,
  model text not null,
  input_tokens integer not null,
  output_tokens integer not null,
  cost_cents numeric(10,4) not null,
  created_at timestamptz not null default now()
);
create index on usage_log (client_id, created_at);

-- helpers
create function is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create function my_client_id() returns uuid language sql stable security definer set search_path = public as
$$ select client_id from profiles where id = auth.uid() $$;

-- הוצאה החודש (UTC) ללקוח; לקוח רואה רק את שלו
create function month_spend_cents(p_client uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select case when is_admin() or p_client = my_client_id() then
    coalesce((select sum(cost_cents) from usage_log
              where client_id = p_client
                and created_at >= date_trunc('month', now())), 0)
  else 0 end
$$;

-- פרופיל אוטומטי בהרשמה (תמיד client; אדמין נקבע ידנית)
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table clients enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table requests enable row level security;
alter table usage_log enable row level security;

create policy clients_read on clients for select using (is_admin() or id = my_client_id());
create policy clients_admin on clients for all using (is_admin()) with check (is_admin());

create policy profiles_read on profiles for select using (is_admin() or id = auth.uid());
create policy profiles_admin on profiles for all using (is_admin()) with check (is_admin());

create policy projects_read on projects for select using (is_admin() or client_id = my_client_id());
create policy projects_insert on projects for insert with check (client_id = my_client_id());
create policy projects_admin on projects for all using (is_admin()) with check (is_admin());

create policy requests_read on requests for select using (is_admin() or client_id = my_client_id());
create policy requests_insert on requests for insert with check (
  client_id = my_client_id() and created_by = auth.uid() and status = 'pending'
  and result is null and cost_cents = 0
  and exists (select 1 from projects p where p.id = project_id and p.client_id = my_client_id())
);
create policy requests_admin on requests for all using (is_admin()) with check (is_admin());

create policy usage_read on usage_log for select using (is_admin() or client_id = my_client_id());
-- אין policy לכתיבה ל-usage_log: רק service role (השרת) כותב.

-- לשימוש השרת (service role) בלבד: הוצאה חודשית בלי תלות ב-auth.uid()
create function admin_month_spend(p_client uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(cost_cents), 0) from usage_log
  where client_id = p_client and created_at >= date_trunc('month', now())
$$;
revoke execute on function admin_month_spend(uuid) from public, anon, authenticated;
