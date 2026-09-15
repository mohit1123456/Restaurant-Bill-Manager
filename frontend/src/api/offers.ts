import { apiRequest } from "./client";
import type { Offer } from "../types";

export function getOffers() {
  return apiRequest<unknown>('/offers/').then((data) => {
    if (!Array.isArray(data)) throw new Error("Offers response was not a list.");
    return data as Offer[];
  });
}

export type OfferInput = Omit<Offer, "id">;

export function createOffer(input: OfferInput) {
  return apiRequest<Offer>("/offers/", { method: "POST", body: JSON.stringify(input) });
}

export function updateOffer(id: number, input: Partial<OfferInput>) {
  return apiRequest<Offer>(`/offers/${id}/`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteOffer(id: number) {
  return apiRequest<void>(`/offers/${id}/`, { method: "DELETE" });
}