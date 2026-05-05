// Cloudflare D1 API endpoints
const API_BASE = '/api';

export const apiService = {
  // Products
  async getProducts() {
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Cloudflare D1-তে ডাটা পাওয়া যায়নি।');
    } catch (err) {
      console.error('D1 Fetch Error:', err);
      throw err;
    }
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'পণ্য সেভ করা সম্ভব হয়নি।');
      }
      
      return await response.json();
    } catch (err) {
      console.error('D1 Save failed:', err);
      throw err;
    }
  },

  // Orders
  async submitOrder(customer: any, order: any) {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, order })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'অর্ডার সাবমিট করা সম্ভব হয়নি।');
      }
      
      return await response.json();
    } catch (err) {
      console.error('D1 Order submission failed:', err);
      throw err;
    }
  },

  async getOrders(sessionToken?: string) {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      if (response.ok) {
        const results = await response.json();
        // D1 এর ডাটাকে ফ্রন্টএন্ড এর ফরম্যাটে কনভার্ট করা (Flattened to Nested)
        return results.map((row: any) => ({
          ...row,
          customer: {
            full_name: row.full_name,
            phone: row.phone,
            address_line: row.address_line,
            district: row.district
          }
        }));
      }
      throw new Error('অর্ডার লিস্ট পাওয়া যায়নি।');
    } catch (err) {
      console.error('D1 Orders fetch error:', err);
      throw err;
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
      if (!response.ok) throw new Error('স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
      return await response.json();
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
      if (!response.ok) throw new Error('অর্ডার ডিলিট করা সম্ভব হয়নি।');
      return await response.json();
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
      if (!response.ok) throw new Error('পণ্য ডিলিট করা সম্ভব হয়নি।');
      return await response.json();
    } catch (err) {
      console.error('D1 Product delete failed:', err);
      throw err;
    }
  }
};
