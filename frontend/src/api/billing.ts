import { apiRequest } from "./client";
import type { BillResult } from "../types";

type BillResponse = BillResult & {
  breakdown?: Partial<BillResult>;
};

function normalizeBill(response: BillResponse): BillResult {
  const breakdown = response.breakdown ?? {};
  return {
    ...response,
    discounts: response.discounts ?? breakdown.discounts ?? [],
    line_items: response.line_items ?? breakdown.line_items ?? [],
  };
}

export function previewBill(orderId: number) {
  return apiRequest<BillResponse>("/billing/preview/", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
  }).then(normalizeBill);
}

export function finalizeBill(orderId: number) {
  return apiRequest<BillResponse>("/billing/finalize/", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
  }).then(normalizeBill);
}