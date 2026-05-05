export const onRequestGet = async (context) => {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC"
    ).all();
    
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

export const onRequestPost = async (context) => {
  const { env, request } = context;
  
  // Admin Check (Simplified for demonstration, in production verify Supabase JWT)
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const product = await request.json();
    const id = product.id || crypto.randomUUID();
    
    await env.DB.prepare(
      "INSERT INTO products (id, name, slug, price, stock_count, image_url, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, price=excluded.price, stock_count=excluded.stock_count, image_url=excluded.image_url, description=excluded.description"
    ).bind(
      id, 
      product.name, 
      product.slug, 
      product.price, 
      product.stock_count, 
      product.image_url, 
      product.description,
      1
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
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
    await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
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
