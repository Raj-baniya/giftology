# Order Creation Fix

## Issue
The "Place Order" button is not working due to database schema mismatches.

## Fixes Applied

1. **Column Name Mismatch**: Changed `total` to `total_amount` in `services/store.ts`
2. **Status Case Sensitivity**: Changed `'Processing'` to `'processing'` to match database constraint

## Database Schema (from SUPABASE_SCHEMA.sql)

The `orders` table expects:
- `total_amount` (not `total`)
- `status` must be one of: 'pending', 'processing', 'shipped', 'delivered', 'cancelled' (lowercase)
- `payment_method` must be one of: 'upi', 'cod', 'card'
- `shipping_address` as JSONB
- `user_id` can be NULL for guest checkout

## Next Steps

Please open your browser console (F12) and try placing an order again. Share the exact error message you see so I can fix the remaining database issues.
