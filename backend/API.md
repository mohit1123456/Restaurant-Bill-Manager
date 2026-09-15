# Backend API

All endpoints are rooted at `/api/`.

## Demo data

From the `backend/` directory, run:

```bash
python3 manage.py seed_demo_data
```

The command creates or refreshes sample menu items, offers, orders, restaurant
settings, and a completed bill. It is safe to run repeatedly.

## Health

- `GET /api/health/`

## Menu

- `GET /api/menu/items/`
- `POST /api/menu/items/`
- `GET /api/menu/items/<id>/`
- `PATCH /api/menu/items/<id>/`
- `DELETE /api/menu/items/<id>/`

The user interface accepts and displays rupees, including values such as
`125.50`. The API transports `price_paise` as integer paise so calculations
remain exact. New orders reject unavailable menu items.

## Offers

- `GET /api/offers/`
- `POST /api/offers/`
- `GET /api/offers/<id>/`
- `PATCH /api/offers/<id>/`
- `DELETE /api/offers/<id>/`

The user interface accepts fixed discounts, thresholds, and caps in rupees.
The API transports fixed amounts in paise. Percentage discounts are entered as
normal percentages in the interface and transported as basis points, where
`1000` means `10%`.

## Orders

- `POST /api/orders/`
- `GET /api/orders/`
- `GET /api/orders/<id>/`
- `PATCH /api/orders/<id>/`

Create orders with `order_type` and nested `items` containing `menu_item` and
`quantity`. Valid status transitions are `draft -> confirmed -> completed`,
with cancellation allowed from `draft` or `confirmed`.

## Billing

- `POST /api/billing/preview/` with `{ "order_id": 1 }`
- `POST /api/billing/finalize/` with `{ "order_id": 1 }`
- `GET /api/billing/<order_id>/`

Preview returns a calculation breakdown without finalizing the order.
Finalization persists the bill and is idempotent for the same order.