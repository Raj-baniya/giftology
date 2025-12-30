-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read settings
CREATE POLICY "Allow public read access" ON public.settings
    FOR SELECT USING (true);

-- Create policy to allow admins to update settings
-- Note: You might need to adjust this depending on your auth setup
-- For now, allowing authenticated users to update for simplicity, or restricted to specific emails
CREATE POLICY "Allow authenticated update" ON public.settings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert default theme if not present
INSERT INTO public.settings (key, value)
VALUES ('current_theme', 'christmas')
ON CONFLICT (key) DO NOTHING;
