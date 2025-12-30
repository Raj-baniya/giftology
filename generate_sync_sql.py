
import os
import re

def clean_escaped_quotes(text):
    # If the text has \' or \", unescape them
    return text.replace("\\'", "'").replace('\\"', '"')

def parse_categories():
    categories_path = r'c:\copy-of-Giftology-main\data\categories.ts'
    with open(categories_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Improved regex for strings that might contain escaped quotes
    # Matches '...' including any \' inside it
    str_pattern = r"'(.*?)'(?=\s*,|\s*\n|\s*\})" # Simplified: capture between ' and ' before next property
    
    # Let's try matching the whole object blocks more robustly
    categories = []
    cat_blocks = re.split(r'\{\s+id:', content)[1:]
    
    for block in cat_blocks:
        # Match 'value' for id, name, slug, imageUrl
        id_m = re.search(r'^\s*\'(.*?)\'', block)
        name_m = re.search(r'name:\s*\'(.*?)\'(?=\s*,)', block) # Lookahead for comma
        # Handle the case where name might be 'Valentine\'s Day'
        # The (.*?) might stop at the first ' if we don't handle escapes
        # Let's use a better regex for the name specifically
        name_m = re.search(r"name:\s*'((?:[^'\\]|\\.)*)'", block)
        slug_m = re.search(r"slug:\s*'((?:[^'\\]|\\.)*)'", block)
        image_m = re.search(r"imageUrl:\s*'((?:[^'\\]|\\.)*)'", block)
        
        if id_m and name_m and slug_m and image_m:
            cat_id = id_m.group(1)
            cat_name = clean_escaped_quotes(name_m.group(1))
            cat_slug = clean_escaped_quotes(slug_m.group(1))
            cat_image = clean_escaped_quotes(image_m.group(1))
            
            # Subcategories block
            sub_block_match = re.search(r'subcategories:\s*\[(.*?)\]', block, re.DOTALL)
            sub_list = []
            if sub_block_match:
                sub_block = sub_block_match.group(1)
                # Find each { name: ... } in sub_block
                # Match name, slug, imageUrl with escape handling
                sub_items = re.findall(r"\{\s*name:\s*'((?:[^'\\]|\\.)*)',\s*slug:\s*'((?:[^'\\]|\\.)*)',\s*imageUrl:\s*'((?:[^'\\]|\\.)*)'\s*\}", sub_block)
                for s_name, s_slug, s_image in sub_items:
                    sub_list.append({
                        'name': clean_escaped_quotes(s_name),
                        'slug': clean_escaped_quotes(s_slug),
                        'imageUrl': clean_escaped_quotes(s_image)
                    })
            
            categories.append({
                'id': cat_id,
                'name': cat_name,
                'slug': cat_slug,
                'imageUrl': cat_image,
                'subcategories': sub_list
            })
            
    return categories

def parse_products():
    mock_data_path = r'c:\copy-of-Giftology-main\services\mockData.ts'
    with open(mock_data_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    products = []
    # Similar search for products
    prod_pattern = re.compile(r"\{\s*id:\s*'((?:[^'\\]|\\.)*)',\s*name:\s*'((?:[^'\\]|\\.)*)',\s*price:\s*(.*?),\s*category:\s*'((?:[^'\\]|\\.)*)',\s*imageUrl:\s*'((?:[^'\\]|\\.)*)',\s*description:\s*'((?:[^'\\]|\\.)*)',(.*?)\}", re.DOTALL)
    for m in prod_pattern.finditer(content):
        p_id, name, price, category, image_url, desc, extra = m.groups()
        trending = 'true' if 'trending: true' in extra else 'false'
        products.append({
            'id': p_id,
            'name': clean_escaped_quotes(name),
            'price': price.strip(),
            'category_slug': clean_escaped_quotes(category),
            'imageUrl': clean_escaped_quotes(image_url),
            'description': clean_escaped_quotes(desc),
            'trending': trending
        })
    return products

def generate_sql(categories, products):
    sql = [
        "-- Giftology Database Sync Script",
        "-- This script resets categories, subcategories, and products to match the application code.",
        "",
        "BEGIN;",
        "",
        "-- 1. Cleanup",
        "TRUNCATE public.order_items CASCADE;",
        "TRUNCATE public.orders CASCADE;",
        "TRUNCATE public.products CASCADE;",
        "TRUNCATE public.subcategories CASCADE;",
        "TRUNCATE public.categories CASCADE;",
        "",
        "-- 2. Insert Categories",
        "INSERT INTO public.categories (id, name, slug, image_url) VALUES"
    ]
    
    cat_values = []
    for cat in categories:
        c_name = cat['name'].replace("'", "''")
        cat_values.append(f"('{cat['id']}', '{c_name}', '{cat['slug']}', '{cat['imageUrl']}')")
    
    sql.append(",\n".join(cat_values) + ";")
    sql.append("")
    
    sql.append("-- 3. Insert Subcategories")
    if any(len(c['subcategories']) > 0 for c in categories):
        sql.append("INSERT INTO public.subcategories (category_id, name, slug, image_url) VALUES")
        sub_values = []
        for cat in categories:
            for sub in cat['subcategories']:
                s_name = sub['name'].replace("'", "''")
                sub_values.append(f"('{cat['id']}', '{s_name}', '{sub['slug']}', '{sub['imageUrl']}')")
        sql.append(",\n".join(sub_values) + ";")
    
    sql.append("")
    
    sql.append("-- 4. Insert Products")
    if products:
        sql.append("INSERT INTO public.products (id, name, slug, price, category_id, description, image_url, images, is_featured, trending, is_active, stock_quantity) VALUES")
        prod_values = []
        seen_ids = set()
        for prod in products:
            if prod['id'] in seen_ids: continue
            seen_ids.add(prod['id'])
            
            p_name = prod['name'].replace("'", "''")
            p_desc = prod['description'].replace("'", "''")
            p_slug = re.sub(r'[^a-z0-9-]', '', p_name.lower().replace(" ", "-"))
            
            matching_cat = next((c for c in categories if c['slug'] == prod['category_slug']), None)
            cat_id = matching_cat['id'] if matching_cat else '1'
            
            prod_values.append(f"('{prod['id']}', '{p_name}', '{p_slug}', {prod['price']}, '{cat_id}', '{p_desc}', '{prod['imageUrl']}', ARRAY['{prod['imageUrl']}'], {prod['trending']}, {prod['trending']}, true, 50)")
        
        sql.append(",\n".join(prod_values) + ";")
        
    sql.append("")
    sql.append("COMMIT;")
    
    return "\n".join(sql)

categories = parse_categories()
print(f"Parsed {len(categories)} categories")
for c in categories:
    print(f" - {c['name']} ({len(c['subcategories'])} subcategories)")

products = parse_products()
print(f"Parsed {len(products)} products")

sql_content = generate_sql(categories, products)

with open(r'c:\copy-of-Giftology-main\sync_database.sql', 'w', encoding='utf-8') as f:
    f.write(sql_content)

print("Generated sync_database.sql successfully.")
