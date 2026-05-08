/// <reference types="@cloudflare/workers-types" />
export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
  "Access-Control-Max-Age": "86400",
};

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
    }
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Auto-migration for schema updates
    try {
      await env.DB.prepare("ALTER TABLE products ADD COLUMN headline TEXT").run();
      await env.DB.prepare("ALTER TABLE products ADD COLUMN subheadline TEXT").run();
      await env.DB.prepare("ALTER TABLE products ADD COLUMN original_price REAL").run();
      console.log("Migration: Added missing columns to products table");
    } catch (e) { /* Already exists */ }

    // Normalize path: lowercase and remove trailing slash
    let path = url.pathname.toLowerCase().replace(/\/+$/, "");
    if (!path) path = "/";
    
    console.log(`[Worker Request] ${request.method} ${path}`);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Database health check
    if (!env.DB) {
      console.error("D1 Database binding missing");
      return jsonResponse({ error: "D1 Database binding 'DB' is missing." }, 500);
    }

    // API Routes for Products
    if (path.endsWith("/api/products") || path.endsWith("/products")) {
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare(
            "SELECT * FROM products WHERE is_active = 1 OR is_active = '1' ORDER BY created_at DESC"
          ).all();
          return jsonResponse(results);
        } catch (error: any) {
          console.error("Products GET Error:", error);
          return jsonResponse({ error: error.message, stack: error.stack }, 500);
        }
      }
      
      if (request.method === "POST") {
        try {
          const product: any = await request.json();
          const id = product.id || crypto.randomUUID();
          await env.DB.prepare(
            "INSERT INTO products (id, name, slug, headline, subheadline, price, original_price, stock_count, image_url, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, headline=excluded.headline, subheadline=excluded.subheadline, price=excluded.price, original_price=excluded.original_price, stock_count=excluded.stock_count, image_url=excluded.image_url, description=excluded.description, is_active=excluded.is_active"
          ).bind(
            id, 
            product.name, 
            product.slug || id, 
            product.headline || "", 
            product.subheadline || "", 
            product.price, 
            product.original_price || null,
            product.stock_count || 0, 
            product.image_url || "", 
            product.description || "", 
            product.is_active !== undefined ? (product.is_active ? 1 : 0) : 1
          ).run();
          return jsonResponse({ success: true, id });
        } catch (error: any) {
          console.error("Products POST Error:", error);
          return jsonResponse({ error: error.message }, 500);
        }
      }

      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return jsonResponse({ error: "ID required" }, 400);
        try {
          // Delete associated order items first to avoid FK constraint issues
          await env.DB.prepare("DELETE FROM order_items WHERE product_id = ?").bind(id).run();
          await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
          return jsonResponse({ success: true });
        } catch (error: any) {
          console.error("Products DELETE Error:", error);
          return jsonResponse({ error: error.message }, 500);
        }
      }
    }

    // API Routes for Orders
    if (path.endsWith("/api/orders") || path.endsWith("/orders")) {
      console.log(`[Orders Handler] Method: ${request.method}, Path: ${path}`);
      
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare(`
            SELECT o.*, c.full_name, c.phone, c.address_line, c.district
            FROM orders o 
            JOIN customers c ON o.customer_id = c.id 
            ORDER BY o.ordered_at DESC
          `).all();
          return jsonResponse(results);
        } catch (error: any) {
          console.error("Orders GET Error:", error);
          return jsonResponse({ error: error.message }, 500);
        }
      }

      if (request.method === "POST") {
        try {
          const bodyText = await request.text();
          console.log(`[Orders POST] Raw Body: ${bodyText.substring(0, 500)}`);
          
          let data: any;
          try {
            data = JSON.parse(bodyText);
          } catch (e) {
            throw new Error(`Invalid JSON body: ${bodyText.substring(0, 100)}`);
          }
          
          const customer = data.customer;
          const orderData = data.order;
          
          if (!customer || !customer.phone) {
            console.error("Missing customer data:", customer);
            throw new Error("Customer phone is required (মোবাইল নাম্বার প্রয়োজন)");
          }

          // 1. Ensure customer exists
          const customerId = crypto.randomUUID();
          await env.DB.prepare(`
            INSERT INTO customers (id, full_name, phone, address_line, district) 
            VALUES (?, ?, ?, ?, ?) 
            ON CONFLICT(phone) DO UPDATE SET 
              full_name=excluded.full_name, 
              address_line=excluded.address_line, 
              district=excluded.district
          `).bind(customerId, customer.full_name, customer.phone, customer.address_line, customer.district || 'Not Specified').run();
          
          // 2. Get customer ID
          const customerRecord: any = await env.DB.prepare("SELECT id FROM customers WHERE phone = ?").bind(customer.phone).first();
          if (!customerRecord) throw new Error("Could not retrieve customer record (কাস্টমার ডাটা পাওয়া যায়নি)");
          const actualCustId = customerRecord.id;

          // 3. Product check
          let product: any = await env.DB.prepare("SELECT id FROM products LIMIT 1").first();
          if (!product) {
            const fallbackId = 'neck-fan-001';
            await env.DB.prepare(`
              INSERT OR IGNORE INTO products (id, name, slug, headline, subheadline, price, original_price, stock_count, image_url, description, is_active) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              fallbackId, 
              'NeckBreeze Fan', 
              'neckbreeze-fan', 
              'Ultimate 360° Personal Cooling',
              'Wearable Hands-Free Bladeless Fan',
              1450, 
              1800,
              100, 
              'https://images.unsplash.com/photo-1622543925917-763c34d1538c?auto=format&fit=crop&w=800',
              'Premium quality neck fan with long-lasting battery.',
              1
            ).run();
            product = { id: fallbackId };
          }
          const productId = product.id;

          const orderId = crypto.randomUUID();
          const total = orderData?.total_amount || 1450;
          const batch = [];
          
          batch.push(env.DB.prepare("INSERT INTO orders (id, customer_id, subtotal, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)").bind(orderId, actualCustId, total, total, orderData?.payment_method || 'cod', 'pending'));

          if (orderData?.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
            for (const item of orderData.items) {
              const pId = item.id || item.product_id || productId;
              batch.push(env.DB.prepare("INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), orderId, pId, item.quantity || 1, item.price || item.unit_price || 0));
            }
          } else {
            batch.push(env.DB.prepare("INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), orderId, productId, 1, 1450));
          }

          await env.DB.batch(batch);
          console.log("Order Successful:", orderId);
          return jsonResponse({ success: true, orderId });
        } catch (error: any) {
          console.error("Order POST Error Details:", error.message);
          return jsonResponse({ 
            error: "অর্ডার সাবমিট করা সম্ভব হয়নি।", 
            detail: error.message,
            at: new Date().toISOString()
          }, 500);
        }
      }

      if (request.method === "PATCH") {
        try {
          const { id, status }: any = await request.json();
          await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
          return jsonResponse({ success: true });
        } catch (error: any) {
          console.error("Order PATCH Error:", error);
          return jsonResponse({ error: error.message }, 500);
        }
      }

      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return jsonResponse({ error: "ID required" }, 400);
        try {
          await env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(id).run();
          await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
          return jsonResponse({ success: true });
        } catch (error: any) {
          console.error("Order DELETE Error:", error);
          return jsonResponse({ error: error.message }, 500);
        }
      }
    }

    // Serve static assets + SPA fallback
    if (path.startsWith("/api")) {
      return jsonResponse({ 
        error: "API Resource Not Found", 
        path, 
        method: request.method,
        availableRoutes: ["/api/products", "/api/orders"]
      }, 404);
    }
    
    // For static assets, only allow GET/HEAD
    if (request.method !== "GET" && request.method !== "HEAD") {
      return jsonResponse({ 
        error: "Method Not Allowed for static resources", 
        method: request.method, 
        path,
        detail: "সার্ভারের রাউটিং মিটছে না। আপনি সম্ভবত ভুল লিঙ্কে POST করার চেষ্টা করছেন।"
      }, 405);
    }

    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
         // SPA Fallback: serve index.html for unknown routes (frontend routing)
         const indexReq = new Request(new URL("/index.html", request.url).toString());
         return await env.ASSETS.fetch(indexReq);
      }
      return response;
    } catch (e: any) {
      return new Response(`Error fetching assets: ${e.message}`, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
