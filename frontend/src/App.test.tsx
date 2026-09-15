import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App, { NewOrder, OrdersPage } from "./App";

const menu = [
  { id: 1, name: "Paneer Tikka", category: "Mains", price_paise: 25000, is_available: true },
  { id: 2, name: "Mango Lassi", category: "Drinks", price_paise: 8000, is_available: true },
  { id: 3, name: "Sold Out Thali", category: "Mains", price_paise: 30000, is_available: false },
];

function renderOrder() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/new-order"]}>
        <Routes>
          <Route path="/new-order" element={<NewOrder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("NewOrder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => menu,
    }));
  });

  it("renders menu availability and filters by category", async () => {
    const user = userEvent.setup();
    renderOrder();

    expect(await screen.findByText("Paneer Tikka")).toBeInTheDocument();
    expect(screen.getByText("Sold out")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter menu by category" }), "Drinks");
    expect(screen.getByText("Mango Lassi")).toBeInTheDocument();
    expect(screen.queryByText("Paneer Tikka")).not.toBeInTheDocument();
  });

  it("adds items and updates quantities without pricing formulas", async () => {
    const user = userEvent.setup();
    renderOrder();

    await user.click(await screen.findByRole("button", { name: /Paneer Tikka/ }));
    expect(screen.getAllByText("₹250.00").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Increase Paneer Tikka" }));
    expect(screen.getAllByText("₹500.00").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Decrease Paneer Tikka" }));
    expect(screen.getAllByText("₹250.00").length).toBeGreaterThan(0);
  });

  it("renders the server bill breakdown after preview", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => menu })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 42 }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subtotal_paise: 25000,
          discounts: [{ name: "Lunch offer", amount_paise: 2000, reason: "Eligible" }],
          discount_total_paise: 2000,
          packing_charge_paise: 200,
          delivery_fee_paise: 0,
          taxable_amount_paise: 23200,
          gst_paise: 1160,
          total_paise: 24360,
          line_items: [],
        }),
      }));

    renderOrder();
    await user.click(await screen.findByRole("button", { name: /Paneer Tikka/ }));
    await user.click(screen.getByRole("button", { name: "Calculate bill" }));

    expect(await screen.findByText("Server preview")).toBeInTheDocument();
    expect(screen.getByText("Lunch offer")).toBeInTheDocument();
    expect(screen.getByText("Taxable amount")).toBeInTheDocument();
    expect(screen.getByText("₹243.60")).toBeInTheDocument();
  });

  it("shows the static payment screen after finalizing the bill", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => menu })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 42 }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subtotal_paise: 25000,
          discounts: [],
          discount_total_paise: 0,
          packing_charge_paise: 0,
          delivery_fee_paise: 0,
          taxable_amount_paise: 25000,
          gst_paise: 1250,
          total_paise: 26250,
          line_items: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subtotal_paise: 25000,
          discounts: [],
          discount_total_paise: 0,
          packing_charge_paise: 0,
          delivery_fee_paise: 0,
          taxable_amount_paise: 25000,
          gst_paise: 1250,
          total_paise: 26250,
          line_items: [],
        }),
      }));

    renderOrder();
    await user.click(await screen.findByRole("button", { name: /Paneer Tikka/ }));
    await user.click(screen.getByRole("button", { name: "Calculate bill" }));
    await user.click(await screen.findByRole("button", { name: "Finalize bill" }));

    expect(await screen.findByText("Ready to collect.")).toBeInTheDocument();
    expect(screen.getByText("Amount due")).toBeInTheDocument();
    expect(screen.getByText("₹262.50")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Record payment" }));
    expect(await screen.findByText("Build the next bill.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calculate bill" })).toBeDisabled();
  });

  it("renders the routed application shell with live-shaped API data", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Good morning.")).toBeInTheDocument();
    expect(screen.getByText("Pricing engine connected")).toBeInTheDocument();
  });

  it("shows a readable error when the menu response is malformed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: menu }),
    }));

    renderOrder();

    expect(await screen.findByText("Menu could not be loaded.")).toBeInTheDocument();
  });

  it("shows order history and filters in-progress orders", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 12, order_type: "delivery", status: "draft", items: [{ id: 1, item_name_snapshot: "Butter Chicken", unit_price_paise_snapshot: 32000, quantity: 1 }], created_at: "2026-09-15T10:00:00Z", updated_at: "2026-09-15T10:00:00Z" },
        { id: 13, order_type: "dine_in", status: "completed", items: [{ id: 2, item_name_snapshot: "Masala Dosa", unit_price_paise_snapshot: 18000, quantity: 2 }], created_at: "2026-09-15T09:00:00Z", updated_at: "2026-09-15T09:00:00Z" },
      ],
    }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><MemoryRouter><OrdersPage /></MemoryRouter></QueryClientProvider>);

    expect(await screen.findByText("Order #12")).toBeInTheDocument();
    expect(screen.getByText("Order #13")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: /In progress/ }));
    expect(screen.getByText("Order #12")).toBeInTheDocument();
    expect(screen.queryByText("Order #13")).not.toBeInTheDocument();
  });
});