// Cloudflare D1 API endpoints
const API_BASE = '/api';

const safeJson = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('JSON Parse Error:', text);
    return { error: 'Invalid JSON response from server' };
  }
};

export const apiService = {
  // Products
  async getProducts() {
    const response = await fetch(`${API_BASE}/products`);
    if (response.ok) {
      return await safeJson(response);
    }
    throw new Error('পণ্য লোড করা সম্ভব হয়নি।');
  },

  async saveProduct(product: any, sessionToken?: string) {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(product)
      });
      
      const data = await safeJson(response);
      if (!response.ok) {
        throw new Error(data.error || 'পণ্য সেভ করা সম্ভব হয়নি।');
      }
      
      return data;
    } catch (err) {
      console.error('D1 Save failed:', err);
      throw err;
    }
  },

  // Orders
  async submitOrder(customer: any, order: any) {
    let response;
    try {
      response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, order })
      });
    } catch (fetchErr: any) {
      console.error('Fetch error:', fetchErr);
      throw new Error(`Network Error: ${fetchErr.message}. ইন্টারনেটে সমস্যা হতে পারে।`);
    }
    
    if (!response.ok) {
      const data = await safeJson(response);
      const detail = data.detail || '';
      const errorStr = data.error || `Server Error ${response.status}`;
      throw new Error(`${errorStr}${detail ? ': ' + detail : ''}`);
    }
    
    const data = await safeJson(response);
    return data;
  },

  async getOrders(sessionToken?: string) {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      if (response.ok) {
        const results = await safeJson(response);
        if (!Array.isArray(results)) return [];
        
        return results.map((row: any) => ({
          ...row,
          customer: {
            full_name: row.full_name || 'Unknown',
            phone: row.phone || 'N/A',
            address_line: row.address_line || '',
            district: row.district || ''
          }
        }));
      }
      return [];
    } catch (err) {
      console.error('D1 Orders fetch error:', err);
      return [];
    }
  },

  async updateOrderStatus(orderId: string, status: string, sessionToken?: string) {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ id: orderId, status })
      });
      
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || 'স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
      return data;
    } catch (err) {
      console.error('D1 Order status update failed:', err);
      throw err;
    }
  },

  async deleteOrder(orderId: string, sessionToken?: string) {
    try {
      const response = await fetch(`${API_BASE}/orders?id=${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || 'অর্ডার ডিলিট করা সম্ভব হয়নি।');
      return data;
    } catch (err) {
      console.error('D1 Order delete failed:', err);
      throw err;
    }
  },

  async deleteProduct(productId: string, sessionToken?: string) {
    try {
      const response = await fetch(`${API_BASE}/products?id=${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || 'পণ্য ডিলিট করা সম্ভব হয়নি।');
      return data;
    } catch (err) {
      console.error('D1 Product delete failed:', err);
      throw err;
    }
  }
};
