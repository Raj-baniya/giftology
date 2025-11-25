# Fix "Could not find market_price column"

## The Issue
You are getting an error when adding a product because the `market_price` column is missing from your database table `products`.

## The Fix
You need to add this column to your database.

1.  **Open** `c:\copy-of-Giftology-main\ADD_MARKET_PRICE.sql`.
2.  **Copy** the SQL code.
3.  **Go to** [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/ldzlynxzmrgwvqieaevx/sql).
4.  **Paste and Run** the script.

## After Running the Script
1.  **Refresh** your Admin Dashboard.
2.  Try adding the product again.
3.  It will work successfully!
