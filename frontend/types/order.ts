export type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

// Money fields are integer Rupiah strings, exactly as the backend sends them
export type OrderSummary = {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: string;
  discount_amount: string;
  grand_total: string;
  customer: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
};

export type OrderDetail = Omit<OrderSummary, "customer"> & {
  customer: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  created_by: {
    id: number;
    name: string;
    email: string;
  };
  items: OrderItem[];
};
