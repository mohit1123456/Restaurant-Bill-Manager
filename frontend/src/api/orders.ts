import { apiRequest } from "./client";
import type { DraftItem, Order } from "../types";

export function getOrders() {
  return apiRequest<Order[]>('/orders/').then((data) => {
    if (!Array.isArray(data)) throw new Error("Orders response was not a list.");
    return data;
  });
}

export function createOrder(orderType: string, items: DraftItem[]) {
  return apiRequest<{ id: number }>("/orders/", {
    method: "POST",
    body: JSON.stringify({
      order_type: orderType,
      items: items.map((item) => ({ menu_item: item.id, quantity: item.quantity })),
    }),
  });
}