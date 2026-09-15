# Backend Tasks Checklist - Restaurant Bill Manager

Use this checklist to track backend work. Check an item only when it is implemented and verified.

## B0 - Requirements and project decisions

- [x] Review and confirm the pricing rules in `docs/PRICING_RULES.md`
- [x] Define order types and the allowed order status transitions
- [x] Define offer types, discount semantics, stacking policy, and priority behavior
- [x] Define GST rate, fee rules, free-delivery threshold, and rounding policy
- [x] Decide which pricing configuration is global and which is stored per bill/order
- [x] Document unresolved pricing assumptions before implementation

## B1 - Bootstrap

- [x] Create the Django project
- [x] Configure Django REST Framework
- [x] Configure environment-based settings
- [x] Configure the database
- [x] Keep SQLite available for local MVP development if needed
- [x] Configure timezone, locale, and INR currency assumptions
- [x] Add the `menu` app
- [x] Add the `orders` app
- [x] Add the `offers` app
- [x] Add the `billing` app
- [x] Configure project URLs and app routing
- [x] Add development and test dependencies
- [x] Add a basic health-check endpoint
- [x] Confirm the project starts successfully

## B2 - Data models and persistence

### Menu

- [x] Create the `MenuItem` model
- [x] Add name and category fields
- [x] Add integer `price_paise` field
- [x] Add `is_available` field
- [x] Add `created_at` and `updated_at` fields
- [x] Add model validation for a non-negative price
- [x] Add database indexes/constraints needed for menu queries
- [x] Create and apply menu migrations

### Orders

- [x] Create the `Order` model
- [x] Add `order_type`
- [x] Add `status`
- [x] Add timestamps
- [x] Create the `OrderItem` model
- [x] Link `OrderItem` to `Order` and `MenuItem`
- [x] Store `item_name_snapshot`
- [x] Store `unit_price_paise_snapshot`
- [x] Store a positive integer `quantity`
- [x] Preserve order item snapshots when menu data changes
- [x] Define deletion behavior for menu items referenced by orders
- [x] Create and apply order migrations

### Offers and billing configuration

- [x] Create the `Offer` model
- [x] Add name, type, threshold, value, cap, and priority fields
- [x] Add active and validity-window fields
- [x] Add stacking policy
- [x] Validate offer values and date ranges
- [x] Create pricing configuration for GST and fees
- [x] Define how configuration changes affect new and finalized bills
- [x] Create and apply offer/billing migrations
- [x] Register relevant models in the admin interface, if used

## B3 - Pricing engine

### Money and result types

- [x] Add integer-paise money utilities
- [x] Reject invalid negative monetary inputs where appropriate
- [x] Add deterministic rounding helpers for percentage and tax calculations
- [x] Add display formatting such as `₹125.50` at the API boundary
- [x] Define the structured bill result and calculation breakdown

### Calculation pipeline

- [x] Validate the order before calculating
- [x] Calculate each line total
- [x] Calculate the subtotal
- [x] Find eligible offers
- [x] Apply priority and stacking rules
- [x] Prevent discounts from making the subtotal negative
- [x] Calculate the discounted subtotal
- [x] Calculate the packing charge
- [x] Calculate the delivery fee
- [x] Apply the free-delivery threshold
- [x] Determine the taxable amount
- [x] Calculate GST with the configured rounding policy
- [x] Calculate the final total
- [x] Keep each calculation stage separate and auditable
- [x] Ensure the same input always produces the same result
- [x] Expose a public `calculate_bill(order, pricing_context)` service entry point

### Billing services

- [x] Implement `calculator.py`
- [x] Implement `discounts.py`
- [x] Implement `fees.py`
- [x] Implement `tax.py`
- [x] Implement `money.py`
- [x] Record the applied offers and reasons in the breakdown
- [x] Record all fees, taxable amount, GST, and final total
- [x] Ensure preview calculations do not unintentionally finalize orders
- [x] Ensure finalized bills retain their authoritative calculation breakdown

## B4 - Pricing and domain tests

### Subtotal tests

- [x] Test a single item
- [x] Test multiple items
- [x] Test multiple quantities
- [x] Test snapshot prices rather than current menu prices

### Discount tests

- [x] Test a fixed discount
- [x] Test a percentage discount
- [x] Test minimum-order threshold behavior
- [x] Test maximum discount caps
- [x] Test ineligible offers
- [x] Test multiple offers
- [x] Test stacking rules
- [x] Test priority behavior
- [x] Test that discounts cannot produce a negative subtotal
- [x] Test offer validity dates and active state

### Fee and tax tests

- [x] Test packing charges
- [x] Test delivery charges
- [x] Test the free-delivery threshold
- [x] Test fee boundary values
- [x] Test normal GST calculation
- [x] Test GST rounding
- [x] Test GST boundary values
- [x] Test exact paisa output

### Availability and regression tests

- [x] Test that an available item can be ordered
- [x] Test that a sold-out item cannot be newly ordered
- [x] Test that an existing order keeps its snapshot name and price
- [x] Add a regression test before fixing every discovered pricing bug
- [x] Run the complete backend test suite successfully

## B5 - REST APIs

### Menu API

- [x] Implement `GET /api/menu/items/`
- [x] Implement `POST /api/menu/items/`
- [x] Implement `GET /api/menu/items/:id/`
- [x] Implement `PATCH /api/menu/items/:id/`
- [x] Implement `DELETE /api/menu/items/:id/`
- [x] Validate menu item prices and availability changes

### Offers API

- [x] Implement `GET /api/offers/`
- [x] Implement `POST /api/offers/`
- [x] Implement `GET /api/offers/:id/`
- [x] Implement `PATCH /api/offers/:id/`
- [x] Implement `DELETE /api/offers/:id/`
- [x] Validate offer configuration and validity windows

### Orders API

- [x] Implement `POST /api/orders/`
- [x] Implement `GET /api/orders/`
- [x] Implement `GET /api/orders/:id/`
- [x] Implement `PATCH /api/orders/:id/`
- [x] Validate item existence, quantity, and availability server-side
- [x] Create immutable item snapshots during order creation
- [x] Enforce valid order status transitions

### Billing API

- [x] Implement `POST /api/billing/preview/`
- [x] Implement `POST /api/billing/finalize/`
- [x] Implement `GET /api/billing/:order_id/`
- [x] Return a transparent calculation breakdown
- [x] Return both integer paise values and display amounts where appropriate
- [x] Prevent unauthorized or invalid bill finalization
- [x] Make finalization safe against duplicate requests

### API quality

- [x] Add serializers for requests and responses
- [x] Add consistent validation error responses
- [ ] Add pagination/filtering where list endpoints need it
- [x] Add API tests for successful requests
- [x] Add API tests for validation and unavailable-item failures
- [x] Add API documentation or an endpoint reference

## B6 - Integration and delivery

- [ ] Connect the frontend to menu and order endpoints
- [ ] Connect bill preview to the pricing engine
- [ ] Connect bill finalization to persisted authoritative bills
- [ ] Verify that React contains no pricing formulas
- [ ] Test the full menu-to-order-to-bill workflow
- [ ] Test preview versus finalized bill consistency
- [ ] Test historical bills after menu and offer changes
- [ ] Add logging suitable for debugging calculation failures without exposing sensitive data
- [ ] Review transaction boundaries and concurrent finalization behavior
- [ ] Run formatting, linting, type checks, and the full test suite
- [ ] Update backend documentation and setup instructions

## Definition of done

- [ ] All pricing rules live in one clear backend domain layer
- [ ] Pricing is independently unit-tested
- [ ] Monetary values are handled safely as integer paise
- [ ] Every bill has a transparent calculation breakdown
- [ ] Menu availability is enforced server-side
- [ ] Historical order prices are preserved
- [ ] The API returns stable, documented response shapes
- [ ] React does not need to know pricing formulas
- [ ] The backend passes the agreed quality checks
