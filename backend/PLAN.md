# Backend Plan — Restaurant Bill Manager

## 1. Technology

- Python
- Django
- Django REST Framework
- PostgreSQL recommended
- pytest / Django test framework
- Decimal only where needed; monetary values should preferably be represented as integer paise

## 2. Backend responsibilities

The backend is the source of truth for:

- Menu data
- Availability
- Orders
- Offers
- Pricing rules
- Bill calculation
- Tax calculation
- Fee calculation
- Validation
- Persistence
- Audit-friendly calculation breakdown

## 3. Suggested Django apps

```text
backend/
├── manage.py
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── ...
└── apps/
    ├── menu/
    ├── orders/
    ├── offers/
    └── billing/
```

## 4. Data models

### MenuItem

Fields:

- id
- name
- category
- price_paise
- is_available
- created_at
- updated_at

### Order

Fields:

- id
- order_type
- status
- created_at
- updated_at

### OrderItem

Fields:

- id
- order
- menu_item
- item_name_snapshot
- unit_price_paise_snapshot
- quantity

The name and price snapshot is important. Historical bills must not change when a menu item's name or price changes later.

### Offer

Fields:

- id
- name
- type
- minimum_order_paise
- discount_value
- maximum_discount_paise
- priority
- is_active
- stacking_policy
- valid_from
- valid_until

The exact fields can be simplified after the pricing requirements are finalized.

### PricingRule / RestaurantSettings

Potential configuration:

- GST rate
- packing charge
- delivery fee
- free-delivery threshold
- rounding policy

## 5. Pricing engine

Create a dedicated service layer, for example:

```text
apps/billing/services/
├── calculator.py
├── discounts.py
├── fees.py
├── tax.py
└── money.py
```

The main public function should conceptually be:

```python
calculate_bill(order, pricing_context) -> BillResult
```

It should be deterministic.

## 6. Calculation pipeline

```text
Validate order
      ↓
Calculate line totals
      ↓
Subtotal
      ↓
Determine eligible offers
      ↓
Apply discount policy
      ↓
Discounted subtotal
      ↓
Packing charge
      ↓
Delivery fee
      ↓
Taxable amount
      ↓
GST
      ↓
Final total
```

Do not mix these stages together.

## 7. Money representation

Recommended internal representation:

```text
₹125.50 → 12550 paise
₹10.00  → 1000 paise
```

Use integer arithmetic for monetary calculations wherever possible.

API responses can expose:

```json
{
  "amount_paise": 12550,
  "display_amount": "₹125.50"
}
```

The backend remains authoritative.

## 8. Bill result shape

Conceptually:

```json
{
  "subtotal_paise": 92000,
  "discounts": [
    {
      "offer_id": 1,
      "name": "Flat ₹50 Off",
      "amount_paise": 5000,
      "reason": "Eligible"
    }
  ],
  "discount_total_paise": 5000,
  "packing_charge_paise": 2000,
  "delivery_fee_paise": 5000,
  "taxable_amount_paise": 84000,
  "gst_paise": 4200,
  "total_paise": 88200
}
```

Actual response shape can be finalized during API design.

## 9. REST API plan

### Menu

```text
GET    /api/menu/items/
POST   /api/menu/items/
GET    /api/menu/items/:id/
PATCH  /api/menu/items/:id/
DELETE /api/menu/items/:id/
```

### Offers

```text
GET    /api/offers/
POST   /api/offers/
GET    /api/offers/:id/
PATCH  /api/offers/:id/
DELETE /api/offers/:id/
```

### Orders

```text
POST   /api/orders/
GET    /api/orders/
GET    /api/orders/:id/
PATCH  /api/orders/:id/
```

### Billing

```text
POST /api/billing/preview/
POST /api/billing/finalize/
GET  /api/billing/:order_id/
```

`preview` should calculate without necessarily finalizing/persisting a bill.

`finalize` should create the authoritative completed bill.

## 10. Pricing tests

Before connecting React, implement backend tests for:

### Subtotal

- Single item
- Multiple items
- Multiple quantities

### Discounts

- Fixed discount
- Percentage discount
- Minimum threshold
- Maximum cap
- Ineligible offer
- Multiple offers
- Stacking rules
- Discount cannot make subtotal negative

### Fees

- Packing charge
- Delivery charge
- Free delivery threshold
- Boundary values

### GST

- Normal calculation
- Rounding
- Boundary values
- Exact paisa output

### Availability

- Available item can be ordered
- Sold-out item cannot be newly ordered
- Existing order keeps its snapshot price

### Regression

Every discovered bug gets a test before it is fixed.

## 11. Backend milestones

### B1 — Bootstrap
- Django project
- DRF
- Environment configuration
- Database

### B2 — Models
- Menu
- Orders
- Offers
- Billing configuration

### B3 — Pricing engine
- Money utilities
- Subtotal
- Discounts
- Fees
- GST
- Bill result

### B4 — Tests
- Comprehensive pricing tests
- Boundary tests
- Regression tests

### B5 — APIs
- Serializers
- ViewSets/API views
- Validation
- Error responses

### B6 — Integration
- Connect React
- Preview bill
- Finalize bill

## 12. Definition of done

The backend is done when:

- All pricing rules live in one clear domain layer
- Pricing is independently unit-tested
- Money is handled safely
- Every bill has a transparent breakdown
- Menu availability is enforced server-side
- Historical order prices are preserved
- React does not need to know pricing formulas
