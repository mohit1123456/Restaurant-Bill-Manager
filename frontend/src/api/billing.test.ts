import { describe, expect, it, vi } from "vitest";
import { finalizeBill } from "./billing";

describe("billing API", () => {
  it("normalizes finalized responses without top-level breakdown arrays", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 7,
        order: 3,
        subtotal_paise: 10000,
        discount_total_paise: 0,
        packing_charge_paise: 0,
        delivery_fee_paise: 0,
        taxable_amount_paise: 10000,
        gst_paise: 500,
        total_paise: 10500,
        breakdown: {
          discounts: [{ name: "Test offer", amount_paise: 100, reason: "Eligible" }],
          line_items: [],
        },
      }),
    }));

    const result = await finalizeBill(3);

    expect(result.discounts).toHaveLength(1);
    expect(result.line_items).toEqual([]);
  });
});
