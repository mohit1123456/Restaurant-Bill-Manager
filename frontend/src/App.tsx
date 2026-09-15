import { Component, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, getOrders } from "./api/orders";
import { finalizeBill, previewBill } from "./api/billing";
import { createMenuItem, deleteMenuItem, getMenuItems, updateMenuItem, type MenuItemInput } from "./api/menu";
import { createOffer, deleteOffer, getOffers, updateOffer, type OfferInput } from "./api/offers";
import type { BillResult, DraftItem, MenuItem, Offer, Order } from "./types";
import { basisPointsToPercentage, paiseToRupees, percentageToBasisPoints, rupeesToPaise } from "./utils/money";

const formatMoney = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);

function StatusMessage({ message }: { message: string }) {
  return <p className="status-message">{message}</p>;
}

class AppErrorBoundary extends Component<React.PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Restaurant Bill Manager failed to render.", error);
  }

  render() {
    if (this.state.hasError) {
      return <main className="error-page"><p className="eyebrow">Application error</p><h1>Something needs attention.</h1><p className="muted">Reload the workspace to continue.</p><button className="primary-button" onClick={() => window.location.reload()}>Reload workspace</button></main>;
    }
    return this.props.children;
  }
}

function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">RB</div>
        <div>
          <p className="eyebrow">Restaurant operations</p>
          <h1>Bill Manager</h1>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Overview</NavLink>
          <NavLink to="/new-order">New order</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/offers">Offers</NavLink>
        </nav>
        <div className="sidebar-note">
          <span className="live-dot" />
          <span>Pricing engine connected</span>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-order" element={<NewOrder />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/offers" element={<OffersPage />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard() {
  const menu = useQuery({ queryKey: ["menu"], queryFn: getMenuItems });
  const offers = useQuery({ queryKey: ["offers"], queryFn: getOffers });
  const orders = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const navigate = useNavigate();
  return (
    <section className="page dashboard-page">
      <div className="page-heading">
        <div><p className="eyebrow">Tuesday, September 15</p><h2>Good morning.</h2><p className="muted">Keep the counter moving with a clear view of today&apos;s service.</p></div>
        <button className="primary-button" onClick={() => navigate("/new-order")}>+ Start new order</button>
      </div>
      <div className="stat-grid">
        <article className="stat-card accent-card"><span>Available items</span><strong>{menu.data?.filter((item) => item.is_available).length ?? "-"}</strong><small>Ready to add</small></article>
        <article className="stat-card"><span>Active offers</span><strong>{offers.data?.filter((offer) => offer.is_active).length ?? "-"}</strong><small>Backend managed</small></article>
        <article className="stat-card"><span>Orders in progress</span><strong>{orders.data?.filter((order) => order.status === "draft" || order.status === "confirmed").length ?? "-"}</strong><small>Needs attention</small></article>
        <article className="stat-card"><span>Pricing status</span><strong className="status-text">Live</strong><small>Calculations stay authoritative</small></article>
      </div>
      <div className="dashboard-grid">
        <article className="panel welcome-panel"><p className="eyebrow">Counter workflow</p><h3>Build a bill without losing the details.</h3><p className="muted">Choose available menu items, request a server-side preview, and see every fee, discount, and tax component before finalizing.</p><button className="text-button" onClick={() => navigate("/new-order")}>Open order workspace <span>→</span></button></article>
        <article className="panel checklist-panel"><div className="panel-heading"><h3>Today&apos;s focus</h3><span className="tiny-label">MVP</span></div><ul className="plain-list"><li><span className="check-circle">✓</span> Server-side prices</li><li><span className="check-circle">✓</span> Transparent breakdowns</li><li><span className="check-circle">✓</span> Snapshot-safe orders</li></ul></article>
      </div>
      <section className="content-section"><div className="section-heading"><div><p className="eyebrow">Built for the counter</p><h3>Clear decisions at every step.</h3></div><p className="muted section-intro">Restaurant Bill Manager keeps the fast work simple while making the important numbers visible.</p></div><div className="content-grid"><article className="content-card"><span className="content-index">01</span><h4>Start with what is available</h4><p className="muted">The menu reflects live availability, so staff can build an order without promising an unavailable item.</p></article><article className="content-card"><span className="content-index">02</span><h4>Let the server calculate</h4><p className="muted">Discounts, delivery, packing, and GST are calculated by the backend pricing engine instead of duplicated in the interface.</p></article><article className="content-card"><span className="content-index">03</span><h4>See why the total changed</h4><p className="muted">Every bill preview explains its subtotal, applied offers, fees, taxable amount, tax, and final total.</p></article></div></section>
    </section>
  );
}

type OrderFilter = "all" | "in_progress" | "completed" | "cancelled";

const orderTypeLabel: Record<Order["order_type"], string> = {
  dine_in: "Dine in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

const orderStatusLabel: Record<Order["status"], string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrdersPage() {
  const orders = useQuery({ queryKey: ["orders"], queryFn: getOrders });
  const [filter, setFilter] = useState<OrderFilter>("all");
  const filteredOrders = (orders.data ?? []).filter((order) => {
    if (filter === "in_progress") return order.status === "draft" || order.status === "confirmed";
    return filter === "all" || order.status === filter;
  });

  return <section className="page"><div className="page-heading"><div><p className="eyebrow">Service history</p><h2>Orders.</h2><p className="muted">Track every order from draft to completed bill.</p></div><NavLink className="primary-button nav-button" to="/new-order">+ Start new order</NavLink></div><div className="order-tabs" role="tablist" aria-label="Order status filter"><button className={filter === "all" ? "tab-button active" : "tab-button"} onClick={() => setFilter("all")}>All <span>{orders.data?.length ?? 0}</span></button><button className={filter === "in_progress" ? "tab-button active" : "tab-button"} onClick={() => setFilter("in_progress")}>In progress <span>{orders.data?.filter((order) => order.status === "draft" || order.status === "confirmed").length ?? 0}</span></button><button className={filter === "completed" ? "tab-button active" : "tab-button"} onClick={() => setFilter("completed")}>Completed <span>{orders.data?.filter((order) => order.status === "completed").length ?? 0}</span></button><button className={filter === "cancelled" ? "tab-button active" : "tab-button"} onClick={() => setFilter("cancelled")}>Cancelled <span>{orders.data?.filter((order) => order.status === "cancelled").length ?? 0}</span></button></div><section className="panel orders-panel">{orders.isLoading ? <StatusMessage message="Loading order history..." /> : orders.isError ? <StatusMessage message="Order history could not be loaded." /> : filteredOrders.length === 0 ? <div className="empty-history"><span className="empty-icon">—</span><h3>No orders in this view</h3><p className="muted">Try another status filter or start a new order.</p></div> : <div className="order-history-list">{filteredOrders.map((order) => { const total = order.items.reduce((sum, item) => sum + item.unit_price_paise_snapshot * item.quantity, 0); return <article className="history-row" key={order.id}><div className="history-id"><strong>Order #{order.id}</strong><small>{new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></div><div className="history-type"><span>{orderTypeLabel[order.order_type]}</span><small>{order.items.length} item line{order.items.length === 1 ? "" : "s"}</small></div><div className="history-items">{order.items.slice(0, 2).map((item) => <span key={item.id}>{item.item_name_snapshot} × {item.quantity}</span>)}{order.items.length > 2 && <span>+ {order.items.length - 2} more</span>}</div><strong className="history-total">{formatMoney(total)}</strong><span className={`status-pill status-${order.status}`}>{orderStatusLabel[order.status]}</span></article>; })}</div>}</section></section>;
}

export function NewOrder() {
  const menu = useQuery({ queryKey: ["menu"], queryFn: getMenuItems });
  const [items, setItems] = useState<DraftItem[]>([]);
  const [orderType, setOrderType] = useState("dine_in");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [bill, setBill] = useState<BillResult | null>(null);
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orderMutation = useMutation({ mutationFn: () => createOrder(orderType, items) });
  const billMutation = useMutation({ mutationFn: (orderId: number) => previewBill(orderId), onSuccess: setBill });
  const finalizeMutation = useMutation({ mutationFn: (orderId: number) => finalizeBill(orderId), onSuccess: (result) => { setBill(result); setFinalized(true); } });
  const categories = [...new Set((menu.data ?? []).map((item) => item.category).filter(Boolean))].sort();
  const filteredItems = (menu.data ?? []).filter((item) =>
    (category === "all" || item.category === category) &&
    (item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase()))
  );

  const addItem = (item: MenuItem) => setItems((current) => {
    const existing = current.find((entry) => entry.id === item.id);
    if (existing) return current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry);
    return [...current, { ...item, quantity: 1 }];
  });
  const updateQuantity = (id: number, quantity: number) => setItems((current) => quantity < 1 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, quantity } : item));
  const subtotal = items.reduce((sum, item) => sum + item.price_paise * item.quantity, 0);
  const requestPreview = async () => {
    setError(null);
    try {
      const order = await orderMutation.mutateAsync();
      await billMutation.mutateAsync(order.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to calculate this bill.");
    }
  };
  const requestFinalize = async () => {
    if (!orderMutation.data?.id) return;
    setError(null);
    try {
      await finalizeMutation.mutateAsync(orderMutation.data.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to finalize this bill.");
    }
  };

  return (
    <section className="page">
      {finalized && bill ? <PaymentScreen bill={bill} orderId={orderMutation.data?.id} onPaymentRecorded={() => { setFinalized(false); setBill(null); setItems([]); }} /> : <>
      <div className="page-heading compact-heading"><div><p className="eyebrow">Service desk / New order</p><h2>Build the next bill.</h2></div><label className="select-wrap">Order type<select value={orderType} onChange={(event) => setOrderType(event.target.value)}><option value="dine_in">Dine in</option><option value="takeaway">Takeaway</option><option value="delivery">Delivery</option></select></label></div>
      <div className="order-layout">
        <section className="panel menu-panel"><div className="panel-heading"><div><h3>Menu</h3><p className="muted">Only available items can be added.</p></div><div className="menu-filters"><input className="search-input" aria-label="Search menu" placeholder="Search menu" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filter menu by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((itemCategory) => <option key={itemCategory} value={itemCategory}>{itemCategory}</option>)}</select></div></div>{menu.isLoading && <StatusMessage message="Loading menu..." />}{menu.isError && <StatusMessage message="Menu could not be loaded." />}{menu.data && filteredItems.length === 0 && <StatusMessage message="No menu items match that search." />}<div className="menu-list">{filteredItems.map((item) => <button className="menu-row" disabled={!item.is_available} key={item.id} onClick={() => addItem(item)}><span className="item-swatch">{item.name.slice(0, 1)}</span><span className="menu-row-copy"><strong>{item.name}</strong><small>{item.category || "Menu item"}</small></span><span className="menu-row-price">{formatMoney(item.price_paise)}</span><span className={item.is_available ? "add-indicator" : "sold-out"}>{item.is_available ? "+" : "Sold out"}</span></button>)}</div></section>
        <aside className="panel order-panel"><div className="panel-heading"><div><p className="eyebrow">Current order</p><h3>{items.length ? `${items.length} line${items.length === 1 ? "" : "s"}` : "Nothing added"}</h3></div><span className="order-number">#NEW</span></div>{items.length === 0 ? <div className="empty-order"><span className="empty-icon">+</span><p>Add items from the menu to begin.</p></div> : <div className="order-items">{items.map((item) => <div className="order-item" key={item.id}><div><strong>{item.name}</strong><small>{formatMoney(item.price_paise)} each</small></div><div className="quantity-control"><button aria-label={`Decrease ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label={`Increase ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button></div><strong>{formatMoney(item.price_paise * item.quantity)}</strong></div>)}</div>}<div className="order-total"><span>Plain subtotal</span><strong>{formatMoney(subtotal)}</strong></div>{error && <p className="error-text">{error}</p>}{bill && <BillBreakdown bill={bill} />}{!bill && <button className="primary-button full-button" disabled={!items.length || orderMutation.isPending || billMutation.isPending} onClick={requestPreview}>{orderMutation.isPending || billMutation.isPending ? "Calculating..." : "Calculate bill"}</button>}{bill && !finalized && <button className="primary-button full-button" disabled={finalizeMutation.isPending} onClick={requestFinalize}>{finalizeMutation.isPending ? "Saving..." : "Finalize bill"}</button>}</aside>
      </div>
      </>}
    </section>
  );
}

function BillBreakdown({ bill }: { bill: BillResult }) {
  return <div className="bill-breakdown"><div className="breakdown-title"><span>Server preview</span><span className="verified-badge">Verified</span></div><div className="breakdown-row"><span>Subtotal</span><strong>{formatMoney(bill.subtotal_paise)}</strong></div>{bill.discounts.map((discount) => <div className="breakdown-row discount-row" key={discount.name}><span>{discount.name}<small>{discount.reason}</small></span><strong>− {formatMoney(discount.amount_paise)}</strong></div>)}<div className="breakdown-row"><span>Discount total</span><strong>− {formatMoney(bill.discount_total_paise)}</strong></div><div className="breakdown-row"><span>Packing</span><strong>{formatMoney(bill.packing_charge_paise)}</strong></div><div className="breakdown-row"><span>Delivery</span><strong>{formatMoney(bill.delivery_fee_paise)}</strong></div><div className="breakdown-row"><span>Taxable amount</span><strong>{formatMoney(bill.taxable_amount_paise)}</strong></div><div className="breakdown-row"><span>GST</span><strong>{formatMoney(bill.gst_paise)}</strong></div><div className="final-row"><span>Total</span><strong>{formatMoney(bill.total_paise)}</strong></div></div>;
}

function PaymentScreen({ bill, orderId, onPaymentRecorded }: { bill: BillResult; orderId?: number; onPaymentRecorded: () => void }) {
  return <div className="payment-screen"><div className="payment-heading"><div><p className="eyebrow">Payment</p><h2>Ready to collect.</h2><p className="muted">Order #{orderId ?? "—"} is finalized and waiting for payment.</p></div><span className="payment-status">Finalized</span></div><div className="payment-layout"><section className="panel payment-total"><p className="eyebrow">Amount due</p><strong>{formatMoney(bill.total_paise)}</strong><span>Includes discounts, fees, and GST</span></section><section className="panel payment-methods"><div className="panel-heading"><div><h3>Choose payment method</h3><p className="muted">Payment processing will be connected later.</p></div></div><div className="payment-method-list"><button className="payment-method active" type="button"><span className="payment-icon">₹</span><span><strong>Cash</strong><small>Collect at the counter</small></span><span className="selected-mark">✓</span></button><button className="payment-method" type="button"><span className="payment-icon">▣</span><span><strong>Card</strong><small>Terminal payment</small></span></button><button className="payment-method" type="button"><span className="payment-icon">⌁</span><span><strong>UPI</strong><small>Scan to pay</small></span></button></div><button className="primary-button full-button" type="button" onClick={onPaymentRecorded}>Record payment</button></section></div></div>;
}

function MenuPage() {
  const menu = useQuery({ queryKey: ["menu"], queryFn: getMenuItems });
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<MenuItemInput>({ name: "", category: "", price_paise: 0, is_available: true });
  const [priceRupees, setPriceRupees] = useState("");
  const [formError, setFormError] = useState("");
  const saveMutation = useMutation({
    mutationFn: (input: MenuItemInput) => editing ? updateMenuItem(editing.id, input) : createMenuItem(input),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["menu"] }); setEditing(null); setCreating(false); setFormError(""); },
  });
  const deleteMutation = useMutation({ mutationFn: deleteMenuItem, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }) });
  const toggleMutation = useMutation({ mutationFn: ({ id, is_available }: { id: number; is_available: boolean }) => updateMenuItem(id, { is_available }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }) });
  const openCreate = () => { setEditing(null); setForm({ name: "", category: "", price_paise: 0, is_available: true }); setPriceRupees(""); setCreating(true); setFormError(""); };
  const openEdit = (item: MenuItem) => { setEditing(item); setForm({ name: item.name, category: item.category, price_paise: item.price_paise, is_available: item.is_available }); setPriceRupees(paiseToRupees(item.price_paise)); setCreating(false); setFormError(""); };
  const save = async (event: React.FormEvent) => { event.preventDefault(); const pricePaise = rupeesToPaise(priceRupees); if (!form.name.trim() || pricePaise === null) { setFormError("Enter an item name and a valid price in rupees, for example 125.50."); return; } try { await saveMutation.mutateAsync({ ...form, price_paise: pricePaise }); } catch { setFormError("The menu item could not be saved."); } };
  return <section className="page"><div className="page-heading"><div><p className="eyebrow">Catalog</p><h2>Menu management.</h2><p className="muted">Keep prices and availability current for the counter.</p></div><button className="primary-button" onClick={openCreate}>+ Add menu item</button></div>{(creating || editing) && <form className="panel management-form" onSubmit={save}><div className="panel-heading"><h3>{editing ? "Edit menu item" : "New menu item"}</h3><button type="button" className="quiet-button" onClick={() => { setEditing(null); setCreating(false); }}>Cancel</button></div><div className="form-grid"><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label>Price (rupees)<input min="0" required step="0.01" type="number" placeholder="125.50" value={priceRupees} onChange={(event) => setPriceRupees(event.target.value)} /></label><label className="checkbox-label"><input type="checkbox" checked={form.is_available} onChange={(event) => setForm({ ...form, is_available: event.target.checked })} /> Available</label></div>{formError && <p className="error-text">{formError}</p>}<button className="primary-button" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save item"}</button></form>}<section className="panel table-panel">{menu.isLoading ? <StatusMessage message="Loading menu..." /> : menu.isError ? <StatusMessage message="Menu could not be loaded." /> : <table><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Availability</th><th>Actions</th></tr></thead><tbody>{menu.data?.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.category || "—"}</td><td>{formatMoney(item.price_paise)}</td><td><button className={item.is_available ? "availability available action-link" : "availability unavailable action-link"} onClick={() => toggleMutation.mutate({ id: item.id, is_available: !item.is_available })}>{item.is_available ? "Available" : "Sold out"}</button></td><td><div className="table-actions"><button className="quiet-button" onClick={() => openEdit(item)}>Edit</button><button className="quiet-button danger-button" onClick={() => deleteMutation.mutate(item.id)}>Delete</button></div></td></tr>)}</tbody></table>}</section></section>;
}

function OffersPage() {
  const offers = useQuery({ queryKey: ["offers"], queryFn: getOffers });
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Offer | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<OfferInput>({ name: "", discount_type: "fixed", minimum_order_paise: 0, discount_value: 0, maximum_discount_paise: null, priority: 0, is_active: true, stacking_policy: "exclusive" });
  const [discountDisplay, setDiscountDisplay] = useState("0");
  const [minimumDisplay, setMinimumDisplay] = useState("0");
  const [maximumDisplay, setMaximumDisplay] = useState("");
  const [formError, setFormError] = useState("");
  const saveMutation = useMutation({ mutationFn: (input: OfferInput) => editing ? updateOffer(editing.id, input) : createOffer(input), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["offers"] }); setEditing(null); setCreating(false); setFormError(""); } });
  const deleteMutation = useMutation({ mutationFn: deleteOffer, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers"] }) });
  const openCreate = () => { setEditing(null); setForm({ name: "", discount_type: "fixed", minimum_order_paise: 0, discount_value: 0, maximum_discount_paise: null, priority: 0, is_active: true, stacking_policy: "exclusive" }); setDiscountDisplay("0"); setMinimumDisplay("0"); setMaximumDisplay(""); setCreating(true); setFormError(""); };
  const openEdit = (offer: Offer) => { setEditing(offer); setForm({ name: offer.name, discount_type: offer.discount_type, minimum_order_paise: offer.minimum_order_paise, discount_value: offer.discount_value, maximum_discount_paise: offer.maximum_discount_paise, priority: offer.priority, is_active: offer.is_active, stacking_policy: offer.stacking_policy }); setDiscountDisplay(offer.discount_type === "fixed" ? paiseToRupees(offer.discount_value) : basisPointsToPercentage(offer.discount_value)); setMinimumDisplay(paiseToRupees(offer.minimum_order_paise)); setMaximumDisplay(offer.maximum_discount_paise === null ? "" : paiseToRupees(offer.maximum_discount_paise)); setCreating(false); setFormError(""); };
  const save = async (event: React.FormEvent) => { event.preventDefault(); const minimumPaise = rupeesToPaise(minimumDisplay); const maximumPaise = maximumDisplay ? rupeesToPaise(maximumDisplay) : null; const discountValue = form.discount_type === "fixed" ? rupeesToPaise(discountDisplay) : percentageToBasisPoints(discountDisplay); const invalidPercentage = form.discount_type === "percentage" && (discountValue === null || discountValue > 10000); if (!form.name.trim() || minimumPaise === null || maximumPaise === null && maximumDisplay !== "" || discountValue === null || invalidPercentage) { setFormError("Enter valid rupee amounts. Percentage discounts accept values up to 100%."); return; } try { await saveMutation.mutateAsync({ ...form, minimum_order_paise: minimumPaise, maximum_discount_paise: maximumPaise, discount_value: discountValue }); } catch { setFormError("The offer could not be saved."); } };
  return <section className="page"><div className="page-heading"><div><p className="eyebrow">Promotions</p><h2>Offers.</h2><p className="muted">Eligibility and discount math remain owned by the backend.</p></div><button className="primary-button" onClick={openCreate}>+ Create offer</button></div>{(creating || editing) && <form className="panel management-form" onSubmit={save}><div className="panel-heading"><h3>{editing ? "Edit offer" : "New offer"}</h3><button type="button" className="quiet-button" onClick={() => { setEditing(null); setCreating(false); }}>Cancel</button></div><div className="form-grid"><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Type<select value={form.discount_type} onChange={(event) => setForm({ ...form, discount_type: event.target.value as OfferInput["discount_type"] })}><option value="fixed">Fixed rupees</option><option value="percentage">Percentage</option></select></label><label>Discount value<input min="0" required step="0.01" type="number" placeholder={form.discount_type === "fixed" ? "50.00" : "10"} value={discountDisplay} onChange={(event) => setDiscountDisplay(event.target.value)} /></label><label>Minimum order (rupees)<input min="0" step="0.01" type="number" value={minimumDisplay} onChange={(event) => setMinimumDisplay(event.target.value)} /></label><label>Maximum cap (rupees)<input min="0" step="0.01" type="number" value={maximumDisplay} onChange={(event) => setMaximumDisplay(event.target.value)} /></label><label>Priority<input min="0" type="number" value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} /></label><label>Stacking<select value={form.stacking_policy} onChange={(event) => setForm({ ...form, stacking_policy: event.target.value as OfferInput["stacking_policy"] })}><option value="exclusive">Exclusive</option><option value="stackable">Stackable</option></select></label></div>{formError && <p className="error-text">{formError}</p>}<button className="primary-button" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save offer"}</button></form>}<section className="offer-grid">{offers.isLoading ? <StatusMessage message="Loading offers..." /> : offers.isError ? <StatusMessage message="Offers could not be loaded." /> : offers.data?.map((offer) => <article className="offer-card" key={offer.id}><div className="offer-card-top"><span className="offer-tag">Priority {offer.priority}</span><span className={offer.is_active ? "availability available" : "availability unavailable"}>{offer.is_active ? "Active" : "Inactive"}</span></div><h3>{offer.name}</h3><p className="muted">{offer.discount_type === "fixed" ? formatMoney(offer.discount_value) : `${offer.discount_value / 100}%`} discount</p><small>Minimum order {formatMoney(offer.minimum_order_paise)}</small><div className="table-actions offer-actions"><button className="quiet-button" onClick={() => openEdit(offer)}>Edit</button>{offer.is_active && <button className="quiet-button danger-button" onClick={() => updateOffer(offer.id, { is_active: false }).then(() => queryClient.invalidateQueries({ queryKey: ["offers"] }))}>Deactivate</button>}{!offer.is_active && <button className="quiet-button danger-button" onClick={() => deleteMutation.mutate(offer.id)}>Delete</button>}</div></article>)}</section></section>;
}

export default function App() {
  return <AppErrorBoundary><AppShell /></AppErrorBoundary>;
}