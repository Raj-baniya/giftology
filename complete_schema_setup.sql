-- ==========================================
-- Giftology Database Reconstruction Script
-- ==========================================

-- 1. CLEANUP (Drop existing tables to start fresh)
-- cascade drops dependent tables
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.reviews cascade;
drop table if exists public.product_variants cascade;
drop table if exists public.play_likes cascade;
drop table if exists public.play_comments cascade;
drop table if exists public.play_videos cascade;
drop table if exists public.products cascade;
drop table if exists public.subcategories cascade;
drop table if exists public.categories cascade;
drop table if exists public.profiles cascade;
drop table if exists public.settings cascade;

-- 2. CREATE EXTENSIONS
create extension if not exists "uuid-ossp";

-- 3. CREATE TABLES

-- Profiles (Extends Supabase Auth)
create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    email text,
    full_name text,
    avatar_url text,
    role text default 'user',
    phone text,
    reward_points integer default 500, -- Default 500 points for everyone
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories
-- Using TEXT id to match '1', '2', etc. from mockData
create table public.categories (
    id text primary key, 
    name text not null,
    slug text not null unique,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subcategories
create table public.subcategories (
    id uuid default uuid_generate_v4() primary key,
    category_id text references public.categories(id) on delete cascade not null,
    name text not null,
    slug text not null,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products
create table public.products (
    id text primary key, -- Text ID to match '1', '2' etc.
    name text not null,
    slug text, -- can be derived from name
    description text,
    price numeric not null,
    market_price numeric,
    cost_price numeric, -- Admin only
    sale_price numeric,
    stock_quantity integer default 100,
    image_url text,
    images text[],
    category_id text references public.categories(id) on delete set null,
    subcategory_id uuid references public.subcategories(id) on delete set null,
    is_featured boolean default false,
    trending boolean default false,
    is_active boolean default true,
    rating numeric default 0,
    review_count integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product Variants
create table public.product_variants (
    id uuid default uuid_generate_v4() primary key,
    product_id text references public.products(id) on delete cascade not null,
    color text,
    size text,
    size_type text,
    stock_quantity integer default 0,
    images text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews
create table public.reviews (
    id uuid default uuid_generate_v4() primary key,
    product_id text references public.products(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete set null,
    user_name text not null,
    rating integer check (rating >= 1 and rating <= 5) not null,
    comment text,
    media_urls text[],
    is_approved boolean default true, -- Auto-approve for now
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders
create table public.orders (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete set null,
    readable_id serial, -- Auto-incrementing simple ID
    customer_name text,
    customer_email text,
    customer_phone text,
    total_amount numeric not null,
    status text default 'processing', -- processing, shipped, delivered, cancelled
    shipping_address jsonb,
    contact_info jsonb,
    payment_method text,
    payment_status text default 'pending',
    delivery_speed text default 'standard',
    gift_wrapping text default 'none',
    guest_info jsonb,
    delivery_date timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Items
create table public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id text references public.products(id) on delete set null,
    quantity integer not null,
    unit_price numeric not null,
    selected_size text,
    selected_color text,
    selected_variant jsonb, -- Store full snapshot
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Play (Videos)
create table public.play_videos (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete set null, -- Uploader
    video_url text not null,
    thumbnail_url text,
    caption text,
    likes_count integer default 0,
    shares_count integer default 0,
    comments_count integer default 0,
    is_approved boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.play_comments (
    id uuid default uuid_generate_v4() primary key,
    video_id uuid references public.play_videos(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.play_likes (
    id uuid default uuid_generate_v4() primary key,
    video_id uuid references public.play_videos(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(video_id, user_id)
);

-- Settings (Global Config)
create table public.settings (
    key text primary key,
    value text,
    description text
);

-- 4. ENABLE RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.play_videos enable row level security;
alter table public.play_comments enable row level security;
alter table public.play_likes enable row level security;
alter table public.settings enable row level security;

-- 5. RLS POLICIES (PERMISSIVE for Public Read)

-- Profiles
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Categories & Subcategories
create policy "Public can view categories" on public.categories for select using (true);
create policy "Public can view subcategories" on public.subcategories for select using (true);

-- Products
create policy "Public can view products" on public.products for select using (true);
create policy "Public can view variants" on public.product_variants for select using (true);

-- Reviews
create policy "Public can view reviews" on public.reviews for select using (true);
create policy "Auth users can insert reviews" on public.reviews for insert with check (auth.role() = 'authenticated');

-- Orders (Private)
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);
-- Allow public insert for Guest Checkout (optional, risky without auth, but needed for guest checkout)
create policy "Anyone can create orders" on public.orders for insert with check (true);

create policy "Users can view own order items" on public.order_items for select using (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "Anyone can create order items" on public.order_items for insert with check (true);


-- Play Videos
create policy "Public can view videos" on public.play_videos for select using (true);
create policy "Auth users can upload videos" on public.play_videos for insert with check (auth.role() = 'authenticated');

-- Play Comments & Likes
create policy "Public can view comments" on public.play_comments for select using (true);
create policy "Auth users can comment" on public.play_comments for insert with check (auth.role() = 'authenticated');
create policy "Public can view likes" on public.play_likes for select using (true);
create policy "Auth users can like" on public.play_likes for insert with check (auth.role() = 'authenticated');
create policy "Auth users can unlike" on public.play_likes for delete using (auth.uid() = user_id);

-- Settings
create policy "Public can view settings" on public.settings for select using (true);

-- 6. SEED DATA

-- Categories
INSERT INTO public.categories (id, name, slug, image_url) VALUES
('1', 'For Him', 'for-him', 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=800&q=80'),
('2', 'For Her', 'for-her', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'),
('3', 'Anniversary', 'anniversary', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80'),
('4', 'Birthdays', 'birthdays', 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=800&q=80'),
('5', 'For Kids', 'for-kids', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80'),
('6', 'Home Decor', 'for-home', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'),
('7', 'Wedding', 'wedding', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'),
('8', 'Diwali', 'diwali', 'https://blog.astrolive.app/wp-content/uploads/2025/09/Diwali-2025-Date-Significance-How-To-Celebrate-Safely.webp'),
('9', 'Holi', 'holi', 'https://images.unsplash.com/photo-1615966650071-855b15f29ad1?auto=format&fit=crop&w=800&q=80'),
('10', 'Halloween', 'halloween', 'https://images.unsplash.com/photo-1508361001413-7a9dca21d08a?auto=format&fit=crop&w=800&q=80'),
('11', 'Christmas', 'christmas', 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=800&q=80'),
('12', 'Eid', 'eid', 'https://i.pinimg.com/736x/b1/90/bc/b190bc762bb23a8721c1f2646c215863.jpg'),
('13', 'Corporate Gifts', 'corporate-gifts', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'),
('14', 'Baby Shower', 'baby-shower', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80'),
('15', 'Housewarming', 'housewarming', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'),
('16', 'Graduation', 'graduation', 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80'),
('17', 'Retirement', 'retirement', 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=800&q=80'),
('18', 'Valentine''s Day', 'valentines-day', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80'),
('19', 'Mother''s Day', 'mothers-day', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'),
('20', 'Father''s Day', 'fathers-day', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80');

-- Subcategories
INSERT INTO public.subcategories (category_id, name, slug, image_url) VALUES
('1', 'Watches', 'watches', 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=300&q=80'),
('1', 'Wallets', 'wallets', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=300&q=80'),
('1', 'Shoes', 'shoes-1', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('1', 'Grooming', 'grooming', 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=300&q=80'),
('1', 'Gadgets', 'gadgets', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80'),
('2', 'Jewelry', 'jewelry', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=300&q=80'),
('2', 'Handbags', 'handbags', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80'),
('2', 'Shoes', 'shoes-2', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('2', 'Perfumes', 'perfumes', 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80'),
('2', 'Skincare', 'skincare', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80'),
('2', 'Dresses', 'dresses', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=300&q=80'),
('3', 'Photo Frames', 'photo-frames', 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=300&q=80'),
('3', 'Couple Gifts', 'couple-gifts', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=300&q=80'),
('3', 'Home Decor', 'home-decor', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80'),
('3', 'Shoes', 'shoes-3', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('3', 'Flowers', 'flowers', 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=300&q=80'),
('4', 'Cakes', 'cakes', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80'),
('4', 'Chocolates', 'chocolates', 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=300&q=80'),
('4', 'Personalized', 'personalized', 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=300&q=80'),
('4', 'Shoes', 'shoes-4', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('4', 'Hampers', 'hampers', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80'),
('5', 'Toys', 'toys', 'https://images.unsplash.com/photo-1566576912902-48fdb1458fbc?auto=format&fit=crop&w=300&q=80'),
('5', 'School Supplies', 'school-supplies', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=300&q=80'),
('5', 'Clothes', 'clothes', 'https://images.unsplash.com/photo-1519278409-1f56fdda7e01?auto=format&fit=crop&w=300&q=80'),
('5', 'Shoes', 'shoes-5', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('5', 'Games', 'games', 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=300&q=80'),
('6', 'Wall Art', 'wall-art', 'https://images.unsplash.com/photo-1580130732478-7f14bc97e720?auto=format&fit=crop&w=300&q=80'),
('6', 'Lamps', 'lamps', 'https://images.unsplash.com/photo-1507473888900-52e1adad5420?auto=format&fit=crop&w=300&q=80'),
('6', 'Vases', 'vases', 'https://images.unsplash.com/photo-1581783342308-f792ca11df53?auto=format&fit=crop&w=300&q=80'),
('6', 'Shoes', 'shoes-6', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('6', 'Cushions', 'cushions', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=300&q=80'),
('7', 'Dinner Sets', 'dinner-sets', 'https://images.unsplash.com/photo-1603199835269-52d52f8bb693?auto=format&fit=crop&w=300&q=80'),
('7', 'Bedding', 'bedding', 'https://images.unsplash.com/photo-1522771753035-0a15395376be?auto=format&fit=crop&w=300&q=80'),
('7', 'Appliances', 'appliances', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80'),
('7', 'Shoes', 'shoes-7', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('7', 'Gift Cards', 'gift-cards', 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=300&q=80'),
('8', 'Sweets', 'sweets', 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?auto=format&fit=crop&w=300&q=80'),
('8', 'Diyas', 'diyas', 'https://images.unsplash.com/photo-1604323990536-e5452b025963?auto=format&fit=crop&w=300&q=80'),
('8', 'Dry Fruits', 'dry-fruits', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80'),
('8', 'Shoes', 'shoes-8', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('8', 'Decor', 'decor', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80'),
('9', 'Colors', 'colors', 'https://images.unsplash.com/photo-1615966650071-855b15f29ad1?auto=format&fit=crop&w=300&q=80'),
('9', 'Sweets', 'sweets', 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?auto=format&fit=crop&w=300&q=80'),
('9', 'Water Guns', 'water-guns', 'https://images.unsplash.com/photo-1615461239088-142289679653?auto=format&fit=crop&w=300&q=80'),
('9', 'T-shirts', 't-shirts', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80'),
('9', 'Shoes', 'shoes-9', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('10', 'Costumes', 'costumes', 'https://images.unsplash.com/photo-1542596594-649edbc13630?auto=format&fit=crop&w=300&q=80'),
('10', 'Masks', 'masks', 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&w=300&q=80'),
('10', 'Decor', 'decor', 'https://images.unsplash.com/photo-1508361001413-7a9dca21d08a?auto=format&fit=crop&w=300&q=80'),
('10', 'Shoes', 'shoes-10', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('10', 'Candy', 'candy', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=300&q=80'),
('11', 'Trees', 'trees', 'https://images.unsplash.com/photo-1544084944-152696a63f72?auto=format&fit=crop&w=300&q=80'),
('11', 'Ornaments', 'ornaments', 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=300&q=80'),
('11', 'Cakes', 'cakes', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80'),
('11', 'Shoes', 'shoes-11', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('11', 'Santa Hats', 'santa-hats', 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=300&q=80'),
('12', 'Dates', 'dates', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=300&q=80'),
('12', 'Clothes', 'clothes', 'https://images.unsplash.com/photo-1519278409-1f56fdda7e01?auto=format&fit=crop&w=300&q=80'),
('12', 'Prayer Mats', 'prayer-mats', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=300&q=80'),
('12', 'Shoes', 'shoes-12', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('12', 'Perfumes', 'perfumes', 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80'),
('13', 'Diaries', 'diaries', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80'),
('13', 'Pens', 'pens', 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=300&q=80'),
('13', 'Desk Organizers', 'desk-organizers', 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80'),
('13', 'Shoes', 'shoes-13', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('13', 'Hampers', 'hampers', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80'),
('14', 'Diapers', 'diapers', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=300&q=80'),
('14', 'Baby Clothes', 'baby-clothes', 'https://images.unsplash.com/photo-1522771753035-0a15395376be?auto=format&fit=crop&w=300&q=80'),
('14', 'Toys', 'toys', 'https://images.unsplash.com/photo-1566576912902-48fdb1458fbc?auto=format&fit=crop&w=300&q=80'),
('14', 'Shoes', 'shoes-14', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('14', 'Care Kits', 'care-kits', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80'),
('15', 'Kitchenware', 'kitchenware', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80'),
('15', 'Decor', 'decor', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80'),
('15', 'Plants', 'plants', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=300&q=80'),
('15', 'Shoes', 'shoes-15', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('15', 'Idols', 'idols', 'https://images.unsplash.com/photo-1567591414240-e13630607698?auto=format&fit=crop&w=300&q=80'),
('16', 'Pens', 'pens', 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=300&q=80'),
('16', 'Notebooks', 'notebooks', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80'),
('16', 'Electronics', 'electronics', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80'),
('16', 'Shoes', 'shoes-16', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('16', 'Bags', 'bags', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80'),
('17', 'Watches', 'watches', 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=300&q=80'),
('17', 'Books', 'books', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80'),
('17', 'Travel Gear', 'travel-gear', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80'),
('17', 'Shoes', 'shoes-17', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('17', 'Relaxing Kits', 'relaxing-kits', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80'),
('18', 'Roses', 'roses', 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=300&q=80'),
('18', 'Chocolates', 'chocolates', 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=300&q=80'),
('18', 'Teddy Bears', 'teddy-bears', 'https://images.unsplash.com/photo-1559454403-b8fb87521bc7?auto=format&fit=crop&w=300&q=80'),
('18', 'Shoes', 'shoes-18', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('18', 'Jewelry', 'jewelry', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=300&q=80'),
('19', 'Flowers', 'flowers', 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=300&q=80'),
('19', 'Cards', 'cards', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80'),
('19', 'Spa Kits', 'spa-kits', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80'),
('19', 'Shoes', 'shoes-19', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('19', 'Jewelry', 'jewelry', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=300&q=80'),
('20', 'Ties', 'ties', 'https://images.unsplash.com/photo-1589756823695-278bc923f962?auto=format&fit=crop&w=300&q=80'),
('20', 'Mugs', 'mugs', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=300&q=80'),
('20', 'Tools', 'tools', 'https://images.unsplash.com/photo-1581783342308-f792ca11df53?auto=format&fit=crop&w=300&q=80'),
('20', 'Shoes', 'shoes-20', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'),
('20', 'Gadgets', 'gadgets', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80');

-- Products
INSERT INTO public.products (id, name, slug, price, category_id, description, image_url, images, trending, is_featured, stock_quantity) VALUES
('1', 'Custom Engraved Watch', 'custom-engraved-watch', 2499, '1', 'A timeless piece with a personal touch.', 'https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 50),
('2', 'Monogrammed Leather Tote', 'monogrammed-leather-tote', 3999, '2', 'Elegant and spacious for everyday use.', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 30),
('3', 'Anniversary Photo Frame', 'anniversary-photo-frame', 1299, '3', 'Capture your best moments together.', 'https://images.pexels.com/photos/1040900/pexels-photo-1040900.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/1040900/pexels-photo-1040900.jpeg?auto=compress&cs=tinysrgb&w=600'], false, false, 100),
('4', 'Personalized Mug Set', 'personalized-mug-set', 899, '4', 'Start the morning with a smile.', 'https://images.pexels.com/photos/1320998/pexels-photo-1320998.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/1320998/pexels-photo-1320998.jpeg?auto=compress&cs=tinysrgb&w=600'], false, false, 200),
('5', 'Wooden Toy Train', 'wooden-toy-train', 1499, '5', 'Classic wooden toy for imaginative play.', 'https://images.pexels.com/photos/3663060/pexels-photo-3663060.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/3663060/pexels-photo-3663060.jpeg?auto=compress&cs=tinysrgb&w=600'], false, false, 45),
('6', 'Modern Ceramic Vase', 'modern-ceramic-vase', 2100, '6', 'Minimalist design to elevate any room.', 'https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 20),
('8', 'Crystal Wine Glasses', 'crystal-wine-glasses', 3200, '7', 'Elegant glassware for the perfect toast.', 'https://images.pexels.com/photos/313700/pexels-photo-313700.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/313700/pexels-photo-313700.jpeg?auto=compress&cs=tinysrgb&w=600'], false, false, 60),
('9', 'Handpainted Clay Diyas (Set of 6)', 'handpainted-clay-diyas', 499, '8', 'Traditional handcrafted diyas to light up your festival.', 'https://images.pexels.com/photos/6759530/pexels-photo-6759530.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/6759530/pexels-photo-6759530.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 500),
('10', 'Organic Gulal Hamper', 'organic-gulal-hamper', 899, '9', 'Safe and skin-friendly organic colors for a vibrant Holi.', 'https://images.pexels.com/photos/1109447/pexels-photo-1109447.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/1109447/pexels-photo-1109447.jpeg?auto=compress&cs=tinysrgb&w=600'], false, true, 150),
('11', 'Spooky Ceramic Pumpkin', 'spooky-ceramic-pumpkin', 1299, '10', 'Perfect decor for a spooky Halloween night.', 'https://images.pexels.com/photos/619418/pexels-photo-619418.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/619418/pexels-photo-619418.jpeg?auto=compress&cs=tinysrgb&w=600'], false, false, 40),
('12', 'Personalized Santa Sack', 'personalized-santa-sack', 1499, '11', 'A large sack for all the gifts from Santa.', 'https://images.pexels.com/photos/3303615/pexels-photo-3303615.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/3303615/pexels-photo-3303615.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 80),
('13', 'Premium Date & Nut Box', 'premium-date-and-nut-box', 1999, '12', 'Exquisite selection of dates and nuts for Eid.', 'https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/2233416/pexels-photo-2233416.jpeg?auto=compress&cs=tinysrgb&w=600'], false, true, 75),
('14', 'Golden Reindeer', 'golden-reindeer', 1200, '11', 'Festive decor piece.', 'https://images.pexels.com/photos/1662369/pexels-photo-1662369.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/1662369/pexels-photo-1662369.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 40),
('15', 'Winter Scarf Set', 'winter-scarf-set', 1800, '5', 'Warm and cozy.', 'https://images.pexels.com/photos/4505269/pexels-photo-4505269.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/4505269/pexels-photo-4505269.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 60),
('16', 'Candle Gift Set', 'candle-gift-set', 2200, '3', 'Scented candles for relaxation.', 'https://images.pexels.com/photos/9969188/pexels-photo-9969188.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/9969188/pexels-photo-9969188.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 75),
('17', 'Leather Weekender', 'leather-weekender', 6500, '17', 'Perfect for short trips.', 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 20),
('18', 'Bluetooth Speaker', 'bluetooth-speaker', 3500, '16', 'Portable sound system.', 'https://images.pexels.com/photos/1279365/pexels-photo-1279365.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/1279365/pexels-photo-1279365.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 45),
('19', 'Smart Fitness Watch', 'smart-fitness-watch', 4999, '1', 'Track your health in style.', 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 30),
('20', 'Classic Aviators', 'classic-aviators', 1299, '2', 'Timeless style.', 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 100),
('21', 'Designer Belt', 'designer-belt', 1599, '20', 'Premium leather belt.', 'https://images.pexels.com/photos/1046594/pexels-photo-1046594.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/1046594/pexels-photo-1046594.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 50),
('22', 'Silver Necklace', 'silver-necklace', 3200, '2', 'Elegant silver chain.', 'https://images.pexels.com/photos/1342937/pexels-photo-1342937.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/1342937/pexels-photo-1342937.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 25),
('23', 'Gaming Headset', 'gaming-headset', 4500, '5', 'Immersive audio experience.', 'https://images.pexels.com/photos/3394663/pexels-photo-3394663.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/3394663/pexels-photo-3394663.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 40),
('24', 'Yoga Mat', 'yoga-mat', 899, '17', 'Non-slip mat for fitness.', 'https://images.pexels.com/photos/4056529/pexels-photo-4056529.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/4056529/pexels-photo-4056529.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 60),
('25', 'Desk Plant', 'desk-plant', 499, '15', 'Succulent for your workspace.', 'https://images.pexels.com/photos/3653856/pexels-photo-3653856.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/3653856/pexels-photo-3653856.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 80),
('26', 'Insulated Water Bottle', 'insulated-water-bottle', 799, '17', 'Keeps drinks cold or hot.', 'https://images.pexels.com/photos/1346152/pexels-photo-1346152.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/1346152/pexels-photo-1346152.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 120),
('27', 'Plush Teddy', 'plush-teddy', 1100, '18', 'Soft and cuddly.', 'https://images.pexels.com/photos/5697255/pexels-photo-5697255.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/5697255/pexels-photo-5697255.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 40),
('28', 'Fountain Pen', 'fountain-pen', 2500, '16', 'Classic writing instrument.', 'https://images.pexels.com/photos/461223/pexels-photo-461223.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/461223/pexels-photo-461223.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 15),
('29', 'Leather Notebook', 'leather-notebook', 1200, '13', 'Premium paper for notes.', 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 35),
('30', 'Travel Pillow', 'travel-pillow', 599, '17', 'Comfort on the go.', 'https://images.pexels.com/photos/11145152/pexels-photo-11145152.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/11145152/pexels-photo-11145152.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 90),
('31', 'Essential Oil Diffuser', 'essential-oil-diffuser', 1800, '6', 'Aromatherapy at home.', 'https://images.pexels.com/photos/3471391/pexels-photo-3471391.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/3471391/pexels-photo-3471391.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 25),
('32', 'Gourmet Chocolate Box', 'gourmet-chocolate-box', 1400, '4', 'Assorted truffles.', 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 100),
('33', 'Bath Bomb Set', 'bath-bomb-set', 650, '19', 'Fizzy fun bath time.', 'https://images.pexels.com/photos/6620942/pexels-photo-6620942.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/6620942/pexels-photo-6620942.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 70),
('34', 'Silk Eye Mask', 'silk-eye-mask', 450, '19', 'Luxury sleep aid.', 'https://images.pexels.com/photos/3771691/pexels-photo-3771691.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/3771691/pexels-photo-3771691.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 85),
('35', 'Manicure Set', 'manicure-set', 899, '20', 'Complete nail care.', 'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 45),
('36', 'Tool Kit', 'tool-kit', 2100, '20', 'Household essentials.', 'https://images.pexels.com/photos/175039/pexels-photo-175039.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['https://images.pexels.com/photos/175039/pexels-photo-175039.jpeg?auto=compress&cs=tinysrgb&w=600'], true, true, 30);

-- Play Videos (Seeding some demo videos)
INSERT INTO public.play_videos (video_url, thumbnail_url, caption, likes_count, comments_count) VALUES
('https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4', 'https://images.pexels.com/photos/3303615/pexels-photo-3303615.jpeg?auto=compress&cs=tinysrgb&w=600', 'Unboxing the coolest Christmas gifts! 🎁 #christmas #giftology', 124, 12),
('https://assets.mixkit.co/videos/preview/mixkit-friends-with-colored-smoke-bombs-4556-large.mp4', 'https://images.pexels.com/photos/1109447/pexels-photo-1109447.jpeg?auto=compress&cs=tinysrgb&w=600', 'Holi 2025 prep is ON! 🌈 Get your organic colors now.', 856, 45),
('https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-lights-4375-large.mp4', 'https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=600', 'Decorate with us! ✨ #homedecor #vibes', 342, 8);

-- Settings
INSERT INTO public.settings (key, value) VALUES
('current_theme', 'christmas');

-- 7. ROBUST SIGNUP AUTOMATION (TRIGGER)
-- This ensures every new user gets a profile with 500 points automatically.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, reward_points, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), -- Fallback to email if name missing
    new.email,
    500, -- GUARANTEED 500 POINTS
    'user'
  );
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    RETURN new;
  WHEN OTHERS THEN
    RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant permissions for profile management
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- End of Script
