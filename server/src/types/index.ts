export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export type KdsItem = {
  id: string;
  nameAtOrder: string;
  quantity: number;
  priceAtOrder?: number;
};

export interface KdsTicket {
  id: string;
  orderNumber?: string;
  status: OrderStatus;
  createdAt: string;
  totalPrice: number;
  deliveryFee?: number;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  address?: string;
  customerCoords?: { lat: number; lng: number } | null;
  kitchenCoords?: { lat: number; lng: number };
  rejectReason?: string;
  deviceFingerprint?: string;
  trackingUrl?: string;
  riderPhone?: string;
  riderName?: string;
  items: KdsItem[];
}