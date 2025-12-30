-- ==========================================
-- Atomic Stock Decrement Functions
-- ==========================================

-- 1. Function to decrement main product stock
CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_id text, p_qty int)
RETURNS void AS $$
BEGIN
    UPDATE public.products
    SET stock_quantity = GREATEST(0, stock_quantity - p_qty)
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to decrement variant stock
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_id text, v_size text, v_color text, p_qty int)
RETURNS void AS $$
BEGIN
    UPDATE public.product_variants
    SET stock_quantity = GREATEST(0, stock_quantity - p_qty)
    WHERE product_id = p_id 
    AND (size = v_size OR (size IS NULL AND v_size IS NULL))
    AND (color = v_color OR (color IS NULL AND v_color IS NULL));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
