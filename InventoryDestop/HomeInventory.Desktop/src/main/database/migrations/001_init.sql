CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  tax_code TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  model_normalized TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT,
  stock_quantity REAL NOT NULL DEFAULT 0,
  import_price REAL NOT NULL DEFAULT 0,
  category_id TEXT NOT NULL,
  brand_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  order_date TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL NOT NULL,
  line_total REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  order_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id TEXT PRIMARY KEY,
  sales_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL
);
