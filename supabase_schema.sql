-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create product_variants table
create table if not exists public.product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  color text, -- e.g., "Red", "Blue"
  size text, -- e.g., "8", "9", "M", "L"
  size_type text, -- e.g., "UK", "US", "cm"
  stock_quantity integer default 0,
  images text[], -- Array of image URLs specific to this variant
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add cost_price to products if it doesn't exist
alter table public.products add column if not exists cost_price numeric;

-- Enable RLS
alter table public.product_variants enable row level security;

-- Policies for product_variants
create policy "Public variants are viewable by everyone."
  on public.product_variants for select
  using ( true );

create policy "Authenticated users can insert variants."
  on public.product_variants for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update variants."
  on public.product_variants for update
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can delete variants."
  on public.product_variants for delete
  using ( auth.role() = 'authenticated' );

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
