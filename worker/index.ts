/// <reference types="@cloudflare/workers-types" />
export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API Routes for Products
    if (url.pathname === "/api/products") {
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare(
            "SELECT * FROM products WHERE is_active = 1 OR is_active = '1' ORDER BY created_at DESC"
          ).all();
          return new Response(JSON.stringify(results), { 
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
          });
        } catch (error: any) {
          console.error("Products GET Error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
      
      if (request.method === "POST") {
        try {
          const product: any = await request.json();
          const id = product.id || crypto.randomUUID();
          await env.DB.prepare(
            "INSERT INTO products (id, name, slug, price, stock_count, image_url, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, price=excluded.price, stock_count=excluded.stock_count, image_url=excluded.image_url, description=excluded.description"
          ).bind(id, product.name, product.slug || id, product.price, product.stock_count || 0, product.image_url || "", product.description || "", 1).run();
          return new Response(JSON.stringify({ success: true, id }), { headers: { "Content-Type": "application/json" } });
        } catch (error: any) {
          console.error("Products POST Error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }

      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return new Response("ID required", { status: 400 });
        try {
          await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
          return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
        } catch (error: any) {
          console.error("Products DELETE Error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
    }

    // API Routes for Orders
    if (url.pathname === "/api/orders") {
      if (request.method === "GET") {
        try {
          const { results } = await env.DB.prepare(`
            SELECT o.*, c.full_name, c.phone, c.address_line, c.district
            FROM orders o 
            JOIN customers c ON o.customer_id = c.id 
            ORDER BY o.ordered_at DESC
          `).all();
          return new Response(JSON.stringify(results), { 
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
          });
        } catch (error: any) {
          console.error("Orders GET Error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }

      if (request.method === "POST") {
        try {
          const data: any = await request.json();
          const customer = data.customer;
          const orderData = data.order;
          
          if (!customer || !customer.phone) throw new Error("Customer phone is required");

          const customerId = crypto.randomUUID();
          const orderId = crypto.randomUUID();

          // Check for existing customer by phone
          const existingCust: any = await env.DB.prepare("SELECT id FROM customers WHERE phone = ?").bind(customer.phone).first();
          const actualCustId = existingCust ? existingCust.id : customerId;

          const batch = [];
          
          // 1. Customer UPSERT
          if (!existingCust) {
            batch.push(env.DB.prepare("INSERT INTO customers (id, full_name, phone, address_line, district) VALUES (?, ?, ?, ?, ?)").bind(actualCustId, customer.full_name, customer.phone, customer.address_line, customer.district || 'Not Specified'));
          } else {
            batch.push(env.DB.prepare("UPDATE customers SET full_name = ?, address_line = ?, district = ? WHERE id = ?").bind(customer.full_name, customer.address_line, customer.district || 'Not Specified', actualCustId));
          }
          
          // 2. Order Insert
          const total = orderData.total_amount || 0;
          batch.push(env.DB.prepare("INSERT INTO orders (id, customer_id, subtotal, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)").bind(orderId, actualCustId, total, total, orderData.payment_method || 'Cash on Delivery', 'pending'));

          // 3. Order Items
          if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
            for (const item of orderData.items) {
              batch.push(env.DB.prepare("INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), orderId, item.id || item.product_id || 'neck-fan-001', item.quantity || 1, item.price || item.unit_price || 0));
            }
          } else {
            // Default product if none provided
            batch.push(env.DB.prepare("INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), orderId, 'neck-fan-001', 1, total));
          }

          await env.DB.batch(batch);
          return new Response(JSON.stringify({ success: true, orderId }), { headers: { "Content-Type": "application/json" } });
        } catch (error: any) {
          console.error("Order POST Error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }

      if (request.method === "PATCH") {
        try {
          const { id, status }: any = await request.json();
          await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
          return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
        } catch (error: any) {
          console.error("Order PATCH Error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }

      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return new Response("ID required", { status: 400 });
        try {
          await env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(id).run();
          await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
          return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
        } catch (error: any) {
          console.error("Order DELETE Error:", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
    }

    // Serve static assets + SPA fallback
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
