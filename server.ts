import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize DB
const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf8');
db.exec(schema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', dbPath, products: db.prepare('SELECT count(*) as count FROM products').get() });
  });

  // Products
  app.get('/api/products', (req, res) => {
    console.log('GET /api/products');
    try {
      const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
      res.json(products);
    } catch (err: any) {
      console.error('Products fetch error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', (req, res) => {
    console.log('POST /api/products', req.body);
    const product = req.body;
    const id = product.id || nanoid();
    const slug = product.slug || id;
    
    try {
      const stmt = db.prepare(`
        INSERT INTO products (id, name, slug, headline, subheadline, description, price, original_price, stock_count, image_url, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          slug = excluded.slug,
          headline = excluded.headline,
          subheadline = excluded.subheadline,
          description = excluded.description,
          price = excluded.price,
          original_price = excluded.original_price,
          stock_count = excluded.stock_count,
          image_url = excluded.image_url,
          is_active = excluded.is_active
      `);
      
      stmt.run(
        id, 
        product.name, 
        slug, 
        product.headline || null,
        product.subheadline || null,
        product.description || null,
        product.price,
        product.original_price || null,
        product.stock_count || 0,
        product.image_url || null,
        product.is_active ? 1 : 0
      );
      
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products', (req, res) => {
    const id = req.query.id as string;
    try {
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Orders
  app.get('/api/orders', (req, res) => {
    console.log('GET /api/orders');
    try {
      // Simple join to get customer info with orders
      const orders = db.prepare(`
        SELECT o.*, c.full_name, c.phone, c.address_line, c.district
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        ORDER BY o.ordered_at DESC
      `).all();

      // For each order, get items (optional based on schema)
      const ordersWithItems = orders.map((order: any) => {
        const items = db.prepare(`
          SELECT oi.*, p.name as product_name
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `).all(order.id);
        
        return {
          ...order,
          order_items: items.map((i: any) => ({
            ...i,
            product: { name: i.product_name }
          }))
        };
      });
      
      res.json(ordersWithItems);
    } catch (err: any) {
      console.error('Orders fetch error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders', (req, res) => {
    console.log('POST /api/orders', req.body);
    const { customer, order } = req.body;
    
    const customerId = nanoid();
    const orderId = nanoid();
    
    const transaction = db.transaction(() => {
      // 1. Insert/Update Customer
      let actualCustId;
      const existingCust = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer.phone) as any;
      
      if (existingCust) {
        actualCustId = existingCust.id;
        db.prepare('UPDATE customers SET full_name = ?, address_line = ?, district = ? WHERE id = ?')
          .run(customer.full_name, customer.address_line, customer.district, actualCustId);
      } else {
        actualCustId = customerId;
        db.prepare('INSERT INTO customers (id, full_name, phone, address_line, district) VALUES (?, ?, ?, ?, ?)')
          .run(actualCustId, customer.full_name, customer.phone, customer.address_line, customer.district);
      }

      // 2. Insert Order
      const orderStmt = db.prepare(`
        INSERT INTO orders (id, customer_id, subtotal, total_amount, status)
        VALUES (?, ?, ?, ?, ?)
      `);
      const total = Number(order.total_amount || order.total || 0);
      orderStmt.run(orderId, actualCustId, Number(order.subtotal || total), total, order.status || 'pending');

      // 3. Insert Items
      const itemStmt = db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        for (const item of order.items) {
          itemStmt.run(nanoid(), orderId, item.id || item.product_id, item.quantity || 1, item.price || item.unit_price);
        }
      } else {
        // Fallback: use product from orders table if possible or a default ID
        itemStmt.run(nanoid(), orderId, 'neck-fan-001', 1, total);
      }
      
      return orderId;
    });

    try {
      const id = transaction();
      res.json({ success: true, orderId: id });
    } catch (err: any) {
      console.error('Order transaction error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/orders', (req, res) => {
    const { id, status } = req.body;
    try {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/orders', (req, res) => {
    const id = req.query.id as string;
    try {
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
      db.prepare('DELETE FROM orders WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
