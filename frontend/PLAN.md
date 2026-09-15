# Frontend Plan — Restaurant Bill Manager

## 1. Technology

- React
- TypeScript
- Vite
- React Router
- TanStack Query for API/server state
- A component library or Tailwind CSS for UI consistency
- Vitest + React Testing Library for frontend tests

## 2. Frontend responsibilities

The frontend is responsible for:

- Menu browsing
- Creating/editing an order
- Showing item availability
- Managing quantities
- Selecting/viewing applicable offers
- Requesting bill calculation from Django
- Displaying a transparent bill breakdown
- Handling loading/error/empty states

The frontend must NOT independently calculate the authoritative final price.

## 3. Planned screens

### Dashboard

Purpose:
- Show basic restaurant billing activity
- Provide entry point for a new order

MVP widgets:
- New Order
- Recent Bills
- Active Offers
- Today's order count/revenue (if time permits)

### New Order

Two-column layout:

```text
Menu                         Current Order
---------------------        ---------------------
Search                       Item x Quantity
Category filter              Unit price
Availability                 Line total
Add item                     Remove / quantity
                             Subtotal
                             Calculate Bill
```

### Bill Preview

Display:

1. Ordered items
2. Plain subtotal
3. Applied discounts
4. Discount total
5. Packing charge
6. Delivery fee
7. Taxable amount
8. GST
9. Final amount

### Menu Management

- Create menu item
- Edit item
- Change price
- Toggle availability
- Search/filter

### Offers Management

- List offers
- Show active/inactive status
- Show eligibility
- Show discount type
- Show cap
- Create/edit/deactivate offer

## 4. Suggested frontend structure

```text
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── menu.ts
│   │   ├── orders.ts
│   │   ├── offers.ts
│   │   └── billing.ts
│   ├── components/
│   │   ├── menu/
│   │   ├── order/
│   │   ├── offers/
│   │   └── bill/
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── NewOrder/
│   │   ├── Bill/
│   │   ├── Menu/
│   │   └── Offers/
│   ├── hooks/
│   ├── types/
│   ├── routes/
│   ├── utils/
│   └── App.tsx
├── package.json
└── vite.config.ts
```

## 5. Important frontend rule

Do not duplicate pricing rules such as:

```text
10% discount
₹100 cap
₹50 delivery
₹1000 free-delivery threshold
```

inside React.

The backend owns these rules.

React only renders the result returned by the pricing API.

## 6. API interaction

Example flow:

```text
React order state
      |
      v
POST /api/billing/preview/
      |
      v
Django pricing engine
      |
      v
Detailed bill JSON
      |
      v
React Bill component
```

## 7. Frontend milestones

### F1 — Bootstrap
- Create Vite React TypeScript app
- Configure linting/formatting
- Configure environment variables
- Configure API client

### F2 — Layout
- App shell
- Navigation
- Responsive layout
- Reusable buttons/cards/tables

### F3 — Menu
- Fetch menu
- Search/filter
- Availability display
- Add to order

### F4 — Order
- Cart/order state
- Quantity changes
- Remove item
- Subtotal display

### F5 — Billing
- Call billing preview API
- Display pricing breakdown
- Display applied offers and reasons
- Display exact rupee/paisa values

### F6 — Management
- Menu CRUD
- Offer CRUD

### F7 — Testing
- Component tests
- API mocking
- Boundary cases
- Bill rendering tests

## 8. Definition of done

The frontend is done when a cashier can:

1. Open an order
2. Add available items
3. Change quantities
4. See the plain subtotal
5. Request calculation
6. See every discount/fee/tax component
7. See the exact final amount
8. Understand why an offer did or did not apply
