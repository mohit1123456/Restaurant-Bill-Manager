import { apiRequest } from "./client";
import type { MenuItem } from "../types";

export function getMenuItems() {
  return apiRequest<unknown>('/menu/items/').then((data) => {
    if (!Array.isArray(data)) throw new Error("Menu response was not a list.");
    return data as MenuItem[];
  });
}

export type MenuItemInput = Pick<MenuItem, "name" | "category" | "price_paise" | "is_available">;

export function createMenuItem(input: MenuItemInput) {
  return apiRequest<MenuItem>("/menu/items/", { method: "POST", body: JSON.stringify(input) });
}

export function updateMenuItem(id: number, input: Partial<MenuItemInput>) {
  return apiRequest<MenuItem>(`/menu/items/${id}/`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteMenuItem(id: number) {
  return apiRequest<void>(`/menu/items/${id}/`, { method: "DELETE" });
}