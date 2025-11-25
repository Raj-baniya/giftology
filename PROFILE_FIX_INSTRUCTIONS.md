# Fix Missing User Profiles

## The Issue
Orders are not showing up in the account because they are being created as "Guest Orders" (user_id: null). This is happening because the system falls back to guest checkout when it fails to link the order to your user account.

The link fails because your user exists in **Auth** but is missing from the **public.profiles** table.

## The Fix
We need to ensure every user has a corresponding profile.

1.  **Open** `c:\copy-of-Giftology-main\FIX_USER_PROFILES.sql`.
2.  **Copy** the SQL code.
3.  **Go to** [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/ldzlynxzmrgwvqieaevx/sql).
4.  **Paste and Run** the script.

## What this does
1.  **Backfills** missing profiles for all existing users (including yours).
2.  **Sets up a Trigger** to automatically create profiles for all future users.

## After Running the Script
1.  **Refresh** your application.
2.  **Place a NEW Order**.
3.  This new order will be correctly linked to your account and **will appear** in the "Your Orders" section.

*Note: The previous order you placed was saved as a guest order and cannot be easily linked to your account now.*
