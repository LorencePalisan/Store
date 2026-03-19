export interface AppUser {
  id: string;
  email: string;
  role: "owner" | "manager" | "viewer";
  status: "setup" | "pending" | "approved" | "rejected";
  store_id: string;
  created_at: Date;
}

export interface Store {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  created_at: Date;
}

export interface SaleProduct {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  store_id: string;
  products: SaleProduct[];
  total_amount: number;
  created_by: string;
  created_by_email: string;
  created_at: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  created_at: Date;
}
