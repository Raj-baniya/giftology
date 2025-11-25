-- Add market_price column to products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'market_price') THEN
        ALTER TABLE public.products ADD COLUMN market_price decimal(10, 2) CHECK (market_price >= 0);
    END IF;
END $$;
