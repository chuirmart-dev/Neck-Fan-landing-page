const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
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
    const { results } = await env.DB.prepare(
      "SELECT * FROM products WHERE is_active = 1 OR is_active = '1' ORDER BY created_at DESC"
    ).all();
    return jsonResponse(results);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequestPost(context: any) {
  const { env, request } = context;
  try {
    const product: any = await request.json();
    const id = product.id || crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO products (id, name, slug, price, stock_count, image_url, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, price=excluded.price, stock_count=excluded.stock_count, image_url=excluded.image_url, description=excluded.description"
    ).bind(id, product.name, product.slug || id, product.price, product.stock_count || 0, product.image_url || "", product.description || "", 1).run();
    return jsonResponse({ success: true, id });
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
    await env.DB.prepare("DELETE FROM order_items WHERE product_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
    return jsonResponse({ success: true });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 500);
  }
}
