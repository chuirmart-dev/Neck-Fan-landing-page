export const onRequestPost = async (context) => {
  const { env, request } = context;
  
  try {
    const data = await request.json();
    const customer = data.customer;
    const orderData = data.order;
    
    const customerId = crypto.randomUUID();
    const orderId = crypto.randomUUID();

    // D1 Transactions
    const existingCust = await env.DB.prepare("SELECT id FROM customers WHERE phone = ?").bind(customer.phone).first();
    const actualCustId = existingCust ? existingCust.id : customerId;

    const batch = [];
    
    if (!existingCust) {
      batch.push(
        env.DB.prepare(
          "INSERT INTO customers (id, full_name, phone, address_line, district) VALUES (?, ?, ?, ?, ?)"
        ).bind(actualCustId, customer.full_name, customer.phone, customer.address_line, customer.district || 'Not Specified')
      );
    } else {
      batch.push(
        env.DB.prepare(
          "UPDATE customers SET full_name = ?, address_line = ?, district = ? WHERE id = ?"
        ).bind(customer.full_name, customer.address_line, customer.district || 'Not Specified', actualCustId)
      );
    }
    
    batch.push(
      env.DB.prepare(
        "INSERT INTO orders (id, customer_id, subtotal, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        orderId, 
        actualCustId, 
        orderData.subtotal || orderData.total_amount, 
        orderData.total_amount, 
        orderData.payment_method || 'Cash on Delivery', 
        'pending'
      )
    );

    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        batch.push(
          env.DB.prepare(
            "INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)"
          ).bind(crypto.randomUUID(), orderId, item.id || item.product_id, item.quantity || 1, item.price || item.unit_price)
        );
      }
    } else {
      batch.push(
        env.DB.prepare(
          "INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), orderId, 'neckfan-01', 1, orderData.total_amount)
      );
    }

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
