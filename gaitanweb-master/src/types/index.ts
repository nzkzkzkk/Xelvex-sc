export type StockStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "DISABLED";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface Game {
  id: string;
  slug: string;
  name: string;
  coverImage: string;
  productCount: number;
}

export interface Product {
  id: string;
  slug: string;
  gameId: string;
  gameName: string;
  title: string;
  subtitle?: string;
  category?: string;
  image: string;
  price: number;
  currency: "THB";
  stockCount: number;
  status: "ACTIVE" | "DISABLED";
  autoDelivery: boolean;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  productTitle: string;
  price: number;
  createdAt: string;
  status: OrderStatus;
}

export interface CartItem {
  productId: string;
  title: string;
  gameName: string;
  image: string;
  price: number;
  quantity: number;
}
