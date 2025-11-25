# Fix "Failed to update order status"

## The Issue
The Admin Dashboard shows "Failed to update order status" because there is **no RLS policy** that allows anyone to `UPDATE` rows in the `orders` table. The existing policies only cover `SELECT` and `INSERT`.

## The Fix
We need to add a policy that explicitly allows Admins to update orders.

1.  **Open** `c:\copy-of-Giftology-main\FIX_ORDER_UPDATE_POLICY.sql`.
2.  **Copy** the SQL code.
3.  **Go to** [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/ldzlynxzmrgwvqieaevx/sql).
4.  **Paste and Run** the script.

## After Running the Script
1.  **Refresh** the Admin Dashboard.
2.  Try changing an order status again.
3.  It should work successfully.
