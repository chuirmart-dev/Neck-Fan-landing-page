-- Cloudflare D1 Database Schema
-- generated for NeckBreeze Store

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  headline TEXT,
  subheadline TEXT,
  description TEXT,
  price REAL NOT NULL,
  original_price REAL,
  stock_count INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  address_line TEXT,
  district TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'cod',
  payment_status TEXT DEFAULT 'unpaid',
  subtotal REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  delivery_charge REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Order Items Table (for future proofing)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Initial product data
INSERT OR IGNORE INTO products (id, name, slug, price, stock_count, is_active) 
VALUES ('neck-fan-001', 'NeckBreeze Signature Fan', 'neckbreeze-signature', 1450.0, 50, 1);
