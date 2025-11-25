-- Allow Admins to UPDATE orders (e.g., change status)
create policy "Admins can update orders" 
on public.orders for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Allow Users to UPDATE their own orders (e.g., cancel order) - Optional but good to have
create policy "Users can update their own orders" 
on public.orders for update using (
  auth.uid() = user_id
);
