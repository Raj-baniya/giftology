-- 1. Ensure the user is an Admin
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
  'giftology.in01@gmail.com', 
  'giftology.in02@gmail.com', 
  'giftology.in14@gmail.com',
  'rajbaniya81083@gmail.com'
);

-- 2. Drop existing UPDATE policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- 3. Re-create the Admin Update Policy
CREATE POLICY "Admins can update orders" 
ON public.orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 4. Verify (Optional - just to see output)
SELECT email, role FROM public.profiles WHERE role = 'admin';
