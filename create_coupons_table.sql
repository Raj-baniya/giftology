-- Create Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active coupons (needed for validation at checkout)
CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true);

-- Allow admins to manage coupons
-- (Using the same logic as other admin tables)
CREATE POLICY "Admins can manage coupons" ON public.coupons
    FOR ALL USING (
        auth.jwt() ->> 'email' IN ('rajbaniya81083@gmail.com', 'giftology.in01@gmail.com', 'giftology.in02@gmail.com', 'giftology.in14@gmail.com')
    );
