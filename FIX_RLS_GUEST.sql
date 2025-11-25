-- Fix RLS policy for guest checkout
-- The issue is that "auth.uid() = user_id" fails when auth.uid() is null and user_id is null (null = null is null, not true)
-- We need to explicitly handle the case where both are null or just allow inserts where user_id is null

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

CREATE POLICY "Users can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR (user_id IS NULL)
);

-- Also fix order items policy just in case
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

CREATE POLICY "Users can create order items" 
ON public.order_items FOR INSERT 
WITH CHECK (
  exists (
    select 1 from public.orders 
    where id = order_items.order_id 
    and (
      (user_id = auth.uid()) OR (user_id IS NULL)
    )
  )
);
