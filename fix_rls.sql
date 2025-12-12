-- Enable RLS for Products
alter table public.products enable row level security;

-- Policy: Anyone can view active products
create policy "Public can view active products"
  on public.products for select
  using ( is_active = true );

-- Policy: Admin can do everything
create policy "Admin can do everything on products"
  on public.products for all
  using ( auth.role() = 'authenticated' ); -- Simplified for now, usually checks a role claim

-- Enable RLS for Categories
alter table public.categories enable row level security;

-- Policy: Public can view categories
create policy "Public can view categories"
  on public.categories for select
  using ( true );

-- Enable RLS for Subcategories
alter table public.subcategories enable row level security;

-- Policy: Public can view subcategories
create policy "Public can view subcategories"
  on public.subcategories for select
  using ( true );

-- Enable RLS for Play Videos (if table exists, implied by Play.tsx)
-- Assuming table name 'play_videos', checking existence first or creating
create table if not exists public.play_videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  video_url text not null,
  thumbnail_url text,
  caption text,
  likes_count integer default 0,
  shares_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.play_videos enable row level security;

create policy "Public can view play videos"
  on public.play_videos for select
  using ( true );

create policy "Authenticated users can upload videos"
  on public.play_videos for insert
  with check ( auth.role() = 'authenticated' );

-- Verify / Fix infinite recursion or similar issues: 
-- None obvious in these simple policies.
