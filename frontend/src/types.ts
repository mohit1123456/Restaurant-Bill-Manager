export type MenuItem = {
  id: number;
  name: string;
  category: string;
  price_paise: number;
  is_available: boolean;
};

export type Offer = {
  id: number;
  name: string;
  discount_type: "fixed" | "percentage";
  minimum_order_paise: number;
  discount_value: number;
  maximum_discount_paise: number | null;
  priority: number;
  is_active: boolean;
  stacking_policy: "exclusive" | "stackable";
  valid_from?: string | null;
  valid_until?: string | null;
};

export type DraftItem = MenuItem & { quantity: number };

export type Order = {
  id: number;
  order_type: "dine_in" | "takeaway" | "delivery";
  status: "draft" | "confirmed" | "completed" | "cancelled";
  items: Array<{
    id: number;
    item_name_snapshot: string;
    unit_price_paise_snapshot: number;
    quantity: number;
  }>;
  created_at: string;
  updated_at: string;
};

export type BillResult = {
  subtotal_paise: number;
  discounts: Array<{ name: string; amount_paise: number; reason: string }>;
  discount_total_paise: number;
  packing_charge_paise: number;
  delivery_fee_paise: number;
  taxable_amount_paise: number;
  gst_paise: number;
  total_paise: number;
  line_items: Array<{
    name: string;
    quantity: number;
    unit_price_paise: number;
    line_total_paise: number;
  }>;
};