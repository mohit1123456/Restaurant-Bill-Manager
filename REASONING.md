 Project Reasoning - Restaurant Bill Manager

This document records the important decisions behind the project. The pricing rules in `docs/PRICING_RULES.md` remain the authoritative business specification; this file explains why the implementation follows those rules and documents trade-offs.

## Product goal

Restaurant staff should be able to create an order quickly, understand every part of the resulting bill, and trust that the final amount comes from one backend pricing engine.

The application therefore favors:

- Fast menu and order workflows for counter staff
- Transparent subtotal, discount, fee, tax, and final-total breakdowns
- Server-side authority for prices and pricing rules
- Historical accuracy when menu data changes
- Explicit validation and useful error states

## Architecture decision

The project is split into a Django/DRF backend and a React frontend.

The backend owns:

- Menu data and availability
- Orders and order-item snapshots
- Offers and pricing configuration
- Bill calculation
- GST, packing, and delivery fees
- Finalized bill persistence
- Validation and API responses

The frontend owns:

- Menu browsing and filtering
- Current order interaction
- Forms and navigation
- Loading, empty, and error states
- Rendering the backend's bill breakdown

React must not reimplement discount, delivery, tax, or final-total formulas. It requests a preview or finalization from Django and renders the response.

## Money representation

The user-facing application uses rupees. Staff enter values such as `125.50`, and the interface displays values such as `₹125.50`.

The backend transport and calculation layer use integer paise for exact arithmetic:

```text
₹125.50 -> 12550 paise
```

The frontend converts rupees to paise only at the API boundary. Conversion is string-based rather than binary floating-point based, so values with two decimal places remain exact. Percentage offers are entered as normal percentages in the UI and converted to backend basis points.

This preserves a simple user experience without sacrificing monetary precision internally.

## Historical order accuracy

`OrderItem` stores:

- The current menu-item reference
- The item name at order time
- The unit price at order time
- The quantity

The name and price snapshot prevents an old order or bill from changing when a restaurant later edits a menu item. Menu items referenced by orders use protected deletion behavior.

## Pricing pipeline

Bill calculation is intentionally staged:

1. Validate that the order contains items
2. Calculate each line total from the order snapshot
3. Calculate the subtotal
4. Find active and eligible offers
5. Apply offer priority and stacking policy
6. Apply packing and delivery fees
7. Calculate the taxable amount
8. Calculate GST with half-up rounding
9. Calculate the final total
10. Return an auditable breakdown

The calculation is deterministic for the same order, offers, settings, and calculation time.

## Offer decisions

Offers are eligible only when they are active, within their validity window, and the subtotal meets their minimum threshold.

Eligible offers are ordered by descending priority. If an eligible exclusive offer exists, the highest-priority exclusive offer is applied alone. If no exclusive offer exists, stackable offers are applied in priority order. A discount is capped when configured and can never reduce the subtotal below zero.

These rules live in `backend/apps/billing/services/discounts.py`, not in React.

## Fee and tax decisions

Packing is a fixed configured charge applied to every order.

Delivery is a fixed configured charge applied only to delivery orders. Free delivery applies when the subtotal reaches the configured threshold. A threshold of zero disables free delivery.

The default GST rate is 5%, but it is stored in restaurant settings so it can be changed without rewriting the calculator. GST is calculated after discounts and fees:

```text
Taxable amount = subtotal - discounts + packing + delivery
Final total = taxable amount + GST
```

Percentage calculations and GST use integer arithmetic with half-up rounding to the nearest paisa.

## Order lifecycle

Orders begin as `draft`. Valid transitions are:

```text
draft -> confirmed -> completed
draft -> cancelled
confirmed -> cancelled
```

Completed and cancelled orders are terminal. Bill finalization is idempotent: repeating finalization for the same order returns the existing authoritative bill rather than creating a second bill.

## API and UI boundary

The API returns integer monetary fields and a human-readable display breakdown where appropriate. The frontend displays rupees but does not decide what the values mean.

Preview does not finalize an order. Finalization persists the calculation and marks the order completed. This keeps the cashier workflow reversible until the final action.

Preview and finalized billing responses intentionally expose the same breakdown
shape. In particular, both include `discounts` and `line_items`. The frontend
also normalizes these arrays defensively because a missing optional field must
not turn a successful finalization into a render-time application error.

## Demo data

`python3 manage.py seed_demo_data` creates repeatable sample settings, menu items, offers, orders, and a completed bill. The command reuses matching demo slots so it can be run during development without continually creating new records.

The seeded data includes available and sold-out menu items, active and inactive offers, multiple order types, and a completed bill so the UI can be exercised immediately.

## Frontend design reasoning

The interface is designed for repeated operational use rather than a marketing landing page:

- Navigation stays visible for quick movement between workflows
- The New Order page puts the menu beside the current order
- Search and category filtering reduce menu scanning time
- Unavailable items remain visible but cannot be added
- Bill previews show every pricing component before finalization
- Management pages keep menu and offer mutations close to their data tables
- Loading, empty, validation, API, and application-error states are explicit
- Dashboard content explains the workflow without duplicating pricing rules

## Testing strategy

Backend tests cover pricing behavior, discount boundaries, fee and GST boundaries, availability, snapshots, status transitions, and billing API idempotency.

Frontend tests cover menu rendering, availability, category filtering, quantity changes, bill breakdown rendering, mocked API workflows, top-level routing, malformed API responses, and rupee conversion edge cases.

The current verified baseline is:

- Backend: 19 tests passing
- Frontend: 9 tests passing
- Django system check passing
- Frontend TypeScript/Vite production build passing

## Known follow-up work

The main remaining product work is:

- Bill history and recent-bill dashboard data
- Responsive layout checks in an actual browser
- Broader frontend management tests
- Full cross-application cashier workflow testing
- Production database and deployment configuration
- Authentication and authorization before exposing management endpoints
- Pagination and filtering for larger menu, offer, and order datasets

## Decision rule for future changes

When a new requirement conflicts with an earlier implementation detail, preserve the user-facing requirement and update the API boundary deliberately. Keep the backend as the pricing authority, document the trade-off here, update `docs/PRICING_RULES.md` when business behavior changes, and add a regression test before considering the change complete.
