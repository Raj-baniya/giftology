# RLS Policy Fix for Guest Checkout

## The Issue
The error `new row violates row-level security policy for table "orders"` (Code 42501) occurs because the existing RLS policy logic is flawed for guest users (where `auth.uid()` is null).

**Current Policy:**
```sql
(auth.uid() = user_id or user_id is null)
```
When `auth.uid()` is NULL (guest) and `user_id` is NULL (guest order), the expression `auth.uid() = user_id` evaluates to `NULL`, not `TRUE`. In SQL, `NULL = NULL` is `NULL`.

## The Fix
We need to run the SQL script `FIX_RLS_GUEST.sql` in the Supabase SQL Editor. This script updates the policies to explicitly handle the NULL case correctly.

**New Policy:**
```sql
((auth.uid() = user_id) OR (user_id IS NULL))
```
This ensures that if `user_id` is explicitly NULL (which we send for guest orders), the policy passes.

## Action Required
1. Copy the content of `FIX_RLS_GUEST.sql`.
2. Go to your Supabase Dashboard -> SQL Editor.
3. Paste and run the script.
4. Retry the checkout process.
