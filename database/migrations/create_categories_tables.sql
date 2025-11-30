-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Categories are viewable by everyone" 
  ON categories FOR SELECT 
  USING (true);

CREATE POLICY "Categories are insertable by authenticated users" 
  ON categories FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Categories are updatable by authenticated users" 
  ON categories FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Categories are deletable by authenticated users" 
  ON categories FOR DELETE 
  USING (auth.role() = 'authenticated');

-- RLS Policies for subcategories
CREATE POLICY "Subcategories are viewable by everyone" 
  ON subcategories FOR SELECT 
  USING (true);

CREATE POLICY "Subcategories are insertable by authenticated users" 
  ON subcategories FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Subcategories are updatable by authenticated users" 
  ON subcategories FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Subcategories are deletable by authenticated users" 
  ON subcategories FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_slug ON subcategories(category_id, slug);
