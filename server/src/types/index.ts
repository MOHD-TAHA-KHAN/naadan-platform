export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export type KdsItem = {
  id: string;
  nameAtOrder: string;
  quantity: number;
};

export interface KdsTicket {
  id: string;
  orderNumber?: string;
  status: OrderStatus;
  createdAt: string;
  totalPrice: number;
  customerName: string;
  items: KdsItem[];
}