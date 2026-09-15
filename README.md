# Restaurant Bill Manager

A restaurant billing and pricing application built with:

- Frontend: React
- Backend: Django + Django REST Framework
- Database: PostgreSQL (recommended; SQLite for local MVP is fine)
- Currency: INR, represented internally as integer paise

## Project goal

Build a billing application whose pricing engine can be trusted to calculate the exact final amount and explain every component of the bill.

## Development order

1. Requirements and pricing assumptions
2. Backend project setup
3. Pricing/domain models
4. Pricing engine
5. Pricing engine tests
6. REST APIs
7. React project setup
8. Menu and order UI
9. Offers UI
10. Bill breakdown UI
11. Integration testing
12. Documentation and final polish

## Core principle

Keep pricing logic out of React components and Django views.

React should request a bill calculation from the backend. The backend pricing engine should produce a deterministic, auditable result.

## Repository target structure

```text
restaurant-bill-manager/
├── frontend/
│   ├── PLAN.md
│   └── src/
├── backend/
│   ├── PLAN.md
│   └── apps/
├── docs/
│   └── PRICING_RULES.md
├── README.md
├── REASONING.md
└── AI_LOG.md
```

See `frontend/PLAN.md`, `backend/PLAN.md`, `docs/PRICING_RULES.md`, and
`REASONING.md` for the implementation roadmap and engineering decisions.

## Run the demo locally

Start the backend from `backend/`:

```bash
python3 manage.py seed_demo_data
python3 manage.py runserver 0.0.0.0:8000
```

Start the frontend from `frontend/`:

```bash
npm run dev -- --host 0.0.0.0
```

The frontend accepts prices in rupees and sends exact integer-paise values to
the backend API.

## Current cashier workflow

1. Start a new order and add available menu items.
2. Request a server-calculated bill preview.
3. Finalize the bill to open the payment screen.
4. Select the displayed payment method and record payment.
5. Return to a fresh new-order screen for the next customer.

The payment screen is currently static. Recording payment resets the local
frontend order state; payment persistence and gateway integration are not yet
connected to the backend.

## Frontend validation

Run these commands from `frontend/`:

```bash
npm test
npm run build
```
