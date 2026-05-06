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
      ...corsHeaders
    }
  });
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: any) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(`
      SELECT o.*, c.full_name, c.phone, c.address_line, c.district
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.ordered_at DESC
    `).all();
    return jsonResponse(results);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestPost(context: any) {
  const { env, request } = context;
  try {
    const data: any = await request.json();
    const customer = data.customer;
    const orderData = data.order;
    
    if (!customer || !customer.phone) throw new Error("Customer phone is required");

    const customerId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO customers (id, full_name, phone, address_line, district) 
      VALUES (?, ?, ?, ?, ?) 
      ON CONFLICT(phone) DO UPDATE SET 
        full_name=excluded.full_name, 
        address_line=excluded.address_line, 
        district=excluded.district
    `).bind(customerId, customer.full_name, customer.phone, customer.address_line, customer.district || 'Not Specified').run();
    
    const customerRecord: any = await env.DB.prepare("SELECT id FROM customers WHERE phone = ?").bind(customer.phone).first();
    const actualCustId = customerRecord.id;

    let product: any = await env.DB.prepare("SELECT id FROM products LIMIT 1").first();
    if (!product) {
      const fallbackId = 'neck-fan-001';
      await env.DB.prepare(`
        INSERT OR IGNORE INTO products (id, name, slug, price, stock_count, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(fallbackId, 'NeckBreeze Fan', 'neckbreeze-fan', 1450, 100, 1).run();
      product = { id: fallbackId };
    }

    const orderId = crypto.randomUUID();
    const total = orderData.total_amount || 1450;
    const batch = [
      env.DB.prepare("INSERT INTO orders (id, customer_id, subtotal, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)").bind(orderId, actualCustId, total, total, orderData.payment_method || 'cod', 'pending'),
      env.DB.prepare("INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), orderId, product.id, 1, 1450)
    ];

    await env.DB.batch(batch);
    return jsonResponse({ success: true, orderId });
  } catch (error: any) {
    return jsonResponse({ error: "অর্ডার সাবমিট করা সম্ভব হয়নি।", detail: error.message }, 500);
  }
}

export async function onRequestPatch(context: any) {
  const { env, request } = context;
  try {
    const { id, status }: any = await request.json();
    await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
    return jsonResponse({ success: true });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestDelete(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonResponse({ error: "ID required" }, 400);
  try {
    await env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
    return jsonResponse({ success: true });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}
