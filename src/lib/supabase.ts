import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

const isValidUrl = (url: string) => {
  try {
    return Boolean(new URL(url));
  } catch (e) {
    return false;
  }
};

if (supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
}

export const supabase = supabaseClient as SupabaseClient;

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface SupabaseProduct {
  id?: string;
  name: string;
  slug: string;
  headline?: string;
  subheadline?: string;
  description?: string;
  price: number;
  original_price?: number;
  stock_count: number;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
}

export interface SupabaseOrder {
  id: string;
  customer_id: string;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  total_amount: number;
  ordered_at: string;
  customer?: {
    full_name: string;
    phone: string;
    address_line: string;
  };
  order_items?: {
    id: string;
    quantity: number;
    unit_price: number;
    product?: {
      name: string;
    };
  }[];
}
