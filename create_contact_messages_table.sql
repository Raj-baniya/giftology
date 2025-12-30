-- Create contact_messages table for storing inquiries from the home page contact form
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    message text,
    source text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert messages
CREATE POLICY "Enable insert for all users" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- Only allow admins to view messages
CREATE POLICY "Enable read for admins only" ON public.contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
