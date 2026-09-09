begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'owner', 'driver')),
  workplace_id uuid,
  van_id uuid,
  created_at timestamptz not null default now()
);

create table public.vans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.workplaces (
  id uuid primary key default gen_random_uuid(),
  van_id uuid not null references public.vans(id),
  name text not null,
  invite_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_workplace_id_fkey foreign key (workplace_id) references public.workplaces(id) on delete set null,
  add constraint profiles_van_id_fkey foreign key (van_id) references public.vans(id) on delete set null;

alter table public.profiles enable row level security;
alter table public.vans enable row level security;
alter table public.workplaces enable row level security;

-- Membership and role assignment stay manual; clients can only edit their name.
revoke all on table public.profiles, public.vans, public.workplaces from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

create policy profiles_read_self on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_self on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No client access to vans/workplaces until tenant rules are designed.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''), 'customer');
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Also cover accounts created before this migration was applied.
insert into public.profiles (id, display_name, role)
select id, coalesce(raw_user_meta_data ->> 'display_name', ''), 'customer'
from auth.users
on conflict (id) do nothing;

commit;
