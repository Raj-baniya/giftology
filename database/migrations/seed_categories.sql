-- Seed categories from existing static data
INSERT INTO categories (id, name, slug, image_url, display_order) VALUES
  ('1', 'For Him', 'for-him', 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=800&q=80', 1),
  ('2', 'For Her', 'for-her', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80', 2),
  ('3', 'Anniversary', 'anniversary', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80', 3),
  ('4', 'Birthdays', 'birthdays', 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=800&q=80', 4),
  ('5', 'For Kids', 'for-kids', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80', 5),
  ('6', 'Home Decor', 'for-home', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80', 6),
  ('7', 'Wedding', 'wedding', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 7),
  ('8', 'Diwali', 'diwali', 'https://blog.astrolive.app/wp-content/uploads/2025/09/Diwali-2025-Date-Significance-How-To-Celebrate-Safely.webp', 8),
  ('9', 'Holi', 'holi', 'https://images.unsplash.com/photo-1615966650071-855b15f29ad1?auto=format&fit=crop&w=800&q=80', 9),
  ('10', 'Halloween', 'halloween', 'https://images.unsplash.com/photo-1508361001413-7a9dca21d08a?auto=format&fit=crop&w=800&q=80', 10),
  ('11', 'Christmas', 'christmas', 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=800&q=80', 11),
  ('12', 'Eid', 'eid', 'https://i.pinimg.com/736x/b1/90/bc/b190bc762bb23a8721c1f2646c215863.jpg', 12),
  ('13', 'Corporate Gifts', 'corporate-gifts', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', 13),
  ('14', 'Baby Shower', 'baby-shower', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80', 14),
  ('15', 'Housewarming', 'housewarming', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', 15),
  ('16', 'Graduation', 'graduation', 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80', 16),
  ('17', 'Retirement', 'retirement', 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=800&q=80', 17),
  ('18', 'Valentine''s Day', 'valentines-day', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80', 18),
  ('19', 'Mother''s Day', 'mothers-day', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', 19),
  ('20', 'Father''s Day', 'fathers-day', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80', 20)
ON CONFLICT (slug) DO NOTHING;

-- Seed subcategories for For Him
INSERT INTO subcategories (category_id, name, slug, image_url, display_order) VALUES
  ('1', 'Watches', 'watches', 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=300&q=80', 1),
  ('1', 'Wallets', 'wallets', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=300&q=80', 2),
  ('1', 'Shoes', 'shoes', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80', 3),
  ('1', 'Grooming', 'grooming', 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=300&q=80', 4),
  ('1', 'Gadgets', 'gadgets', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80', 5)
ON CONFLICT (category_id, slug) DO NOTHING;

-- For Her
INSERT INTO subcategories (category_id, name, slug, image_url, display_order) VALUES
  ('2', 'Jewelry', 'jewelry', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=300&q=80', 1),
  ('2', 'Handbags', 'handbags', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80', 2),
  ('2', 'Perfumes', 'perfumes', 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80', 3),
  ('2', 'Skincare', 'skincare', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80', 4),
  ('2', 'Dresses', 'dresses', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=300&q=80', 5)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Continue with other categories...
-- (I'll add the rest in a similar pattern)
