export type Product = {
  id: number;
  product_code: string;
  name: string;
  // Integer Rupiah string, as sent by the backend
  price: string;
  stock: number;
  created_at: string;
  updated_at: string;
};
