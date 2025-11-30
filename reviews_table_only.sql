-- Create reviews table
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null, -- Optional link to auth user
  user_name text not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  media_urls text[], -- Array of image/video URLs
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for reviews
alter table public.reviews enable row level security;

-- Policies for reviews
create policy "Public can view approved reviews."
  on public.reviews for select
  using ( is_approved = true );

create policy "Authenticated users (Admin) can view all reviews."
  on public.reviews for select
  using ( auth.role() = 'authenticated' );

create policy "Anyone can insert reviews."
  on public.reviews for insert
  with check ( true );

create policy "Authenticated users (Admin) can update reviews."
  on public.reviews for update
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users (Admin) can delete reviews."
  on public.reviews for delete
  using ( auth.role() = 'authenticated' );
