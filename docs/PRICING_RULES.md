# Pricing Rules — Working Specification

This file is intentionally the single place where pricing assumptions are documented.

Before implementing the calculator, confirm every rule from the assessment brief. If a rule is ambiguous, make the assumption explicit here and explain the trade-off in `REASONING.md`.

## 1. Order subtotal

For each order item:

```text
line total = unit price × quantity
```

Then:

```text
subtotal = sum(line totals)
```

## 2. Sold-out items

An unavailable menu item must not be addable to a new order.

An existing order must retain its price/name snapshot.

## 3. Offers

The engine must determine:

1. Which offers are active
2. Which offers are eligible
3. Discount amount
4. Maximum discount cap
5. Offer priority
6. Whether offers stack
7. Order in which stacked offers are applied

Do not hide these decisions in UI code.

## 4. Packing charge

The packing charge is a fixed configured amount applied to every order.
The amount is stored in `RestaurantSettings.packing_charge_paise`.

## 5. Delivery fee

The delivery fee is a fixed configured amount applied only to delivery orders.
The amount is stored in `RestaurantSettings.delivery_fee_paise`.

Free delivery applies when the order subtotal is greater than or equal to the
configured `RestaurantSettings.free_delivery_threshold_paise`. A threshold of
zero disables free delivery.

The large-order condition is represented explicitly as the configured
free-delivery threshold.

## 6. GST

The default GST rate is 5%, stored as 500 basis points in
`RestaurantSettings.gst_rate_basis_points`. The value remains configurable.

The taxable base is:

```text
subtotal - discounts + packing charge + delivery fee
```

GST is calculated after discounts and fees. Percentage calculations use integer
paise and round half up to the nearest paisa.

## 7. Rounding

Recommended approach:

- Store money as integer paise
- Avoid binary floating-point for monetary state
- Define the exact GST rounding rule
- Round only at explicitly defined stages

The implemented rounding rule is round half up, and rounding occurs when a
percentage discount or GST amount is calculated.

## 10. Offer semantics

- Fixed discount values are stored in paise.
- Percentage discount values are stored in basis points; 1000 means 10%.
- An offer is eligible only when active, within its validity window, and above
    its minimum subtotal.
- Offers are ordered by descending priority.
- The highest-priority eligible exclusive offer is applied alone.
- If no exclusive offer is eligible, eligible stackable offers are applied in
    priority order until the subtotal reaches zero.

## 11. Order status transitions

```text
draft -> confirmed -> completed
draft -> cancelled
confirmed -> cancelled
```

Completed and cancelled orders are terminal.

## 8. Invariants

The pricing engine should maintain:

```text
subtotal >= 0
discount_total >= 0
discount_total <= subtotal
fees >= 0
tax >= 0
final_total >= 0
```

And:

```text
final_total =
    taxable_amount
    + GST
```

where `taxable_amount` itself is derived from the documented subtotal/discount/fee policy.

## 12. Auditability

The final response from the pricing engine should explain the calculation rather than return only one number.

Example stages:

```text
Subtotal
- Discounts
+ Packing
+ Delivery
= Taxable amount
+ GST
= Final total
```
