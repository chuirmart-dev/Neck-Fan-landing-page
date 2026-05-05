export const onRequestPost = async (context) => {
  const { env, request } = context;
  
  try {
    const data = await request.json();
    const customer = data.customer;
    const orderData = data.order;
    
    const customerId = crypto.randomUUID();
    const orderId = crypto.randomUUID();

    // D1 Transactions are done via batch
    const batch = [
      // Insert or update customer
      env.DB.prepare(
        "INSERT INTO customers (id, full_name, phone, address_line, district) VALUES (?, ?, ?, ?, ?) ON CONFLICT(phone) DO UPDATE SET full_name=excluded.full_name, address_line=excluded.address_line"
      ).bind(customerId, customer.full_name, customer.phone, customer.address_line, customer.district || 'Not Specified'),
      
      // Get the actual customer ID if it already existed (phone conflict handle)
      // Note: In D1, batch is better for performance. we use the generated ID for simplicity here.
      
      // Insert order
      env.DB.prepare(
        "INSERT INTO orders (id, customer_id, subtotal, total_amount, payment_method, status) VALUES (?, (SELECT id FROM customers WHERE phone = ?), ?, ?, ?, ?)"
      ).bind(orderId, customer.phone, orderData.subtotal, orderData.total_amount, orderData.payment_method, 'pending')
    ];

    await env.DB.batch(batch);

    return new Response(JSON.stringify({ success: true, orderId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestGet = async (context) => {
  const { env, request } = context;
  
  // Admin Check
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT o.*, c.full_name, c.phone, c.address_line, c.district
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.ordered_at DESC
    `).all();
    
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestPatch = async (context) => {
  const { env, request } = context;
  
  // Admin Check
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  try {
    const { id, status } = await request.json();
    if (!id || !status) return new Response("ID and Status required", { status: 400 });

    await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestDelete = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return new Response("ID required", { status: 400 });

  // Admin Check
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  try {
    await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
