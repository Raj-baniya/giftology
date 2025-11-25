-- 1. Create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the trigger (if it doesn't exist)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Backfill missing profiles for existing users
insert into public.profiles (id, email, full_name, role)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name',
  'user'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
