# Frontend Tasks Checklist - Restaurant Bill Manager

Check an item only when it is implemented and verified.

## F0 - Requirements and boundaries

- [x] Review the frontend plan and backend API contract
- [x] Confirm that React never calculates authoritative pricing
- [x] Confirm loading, error, empty, and unavailable-item states
- [x] Confirm INR display and integer-paise API handling

## F1 - Bootstrap

- [x] Create the Vite React TypeScript application
- [x] Configure development and production environment variables
- [x] Configure the API client and backend base URL
- [x] Configure React Router
- [x] Configure TanStack Query for server state
- [x] Configure linting, formatting, and frontend tests
- [x] Add a shared application error boundary

## F2 - Layout and navigation

- [x] Build the application shell
- [x] Add navigation for Dashboard, New Order, Menu, Offers, and Bills
- [x] Add responsive desktop and mobile layouts
- [x] Add reusable buttons, inputs, tables, cards, and status indicators
- [x] Add loading and error presentation components

## F3 - Menu browsing

- [x] Fetch menu items from the backend
- [x] Display name, category, price, and availability
- [x] Accept menu prices in rupees and convert exactly at the API boundary
- [x] Add search
- [x] Add category filtering
- [x] Prevent unavailable items from being added to an order
- [x] Handle empty menu results
- [x] Handle menu API failures

## F4 - Order workflow

- [x] Create the new-order screen
- [x] Add available menu items to the current order
- [x] Manage quantities
- [x] Remove order items
- [x] Select the order type
- [x] Display unit prices and line totals from backend data
- [x] Display the plain subtotal
- [x] Submit the order to the backend
- [x] Handle order validation errors

## F5 - Bill preview and finalization

- [x] Request bill preview from `/api/billing/preview/`
- [x] Display ordered items
- [x] Display subtotal
- [x] Display every applied discount and reason
- [x] Display discount total
- [x] Display packing charge
- [x] Display delivery fee
- [x] Display taxable amount
- [x] Display GST
- [x] Display the final amount
- [x] Display exact rupee and paise values from the API
- [x] Keep pricing formulas out of React
- [x] Add a finalize-bill action
- [x] Handle preview and finalization failures
- [x] Prevent duplicate finalization actions while a request is pending

## F6 - Menu management

- [x] List menu items
- [x] Create a menu item
- [x] Edit a menu item
- [x] Change a menu item price
- [x] Toggle availability
- [x] Delete a menu item when allowed by the backend
- [x] Add management form validation
- [x] Show mutation success and error states

## F7 - Offers management

- [x] List offers
- [x] Show active and inactive status
- [x] Show offer type and value
- [x] Accept fixed offer amounts in rupees and percentages as normal percentages
- [x] Show minimum order threshold
- [x] Show maximum discount cap
- [x] Create an offer
- [x] Edit an offer
- [x] Deactivate an offer
- [ ] Display validity dates
- [x] Do not reproduce offer eligibility formulas in React

## F8 - Dashboard and bills

- [x] Build the dashboard entry point for a new order
- [x] Show order history with in-progress, completed, and cancelled tabs
- [x] Show active order count on the dashboard
- [ ] Show recent bills
- [x] Show active offers
- [ ] Show today's order count/revenue when supported by the API
- [ ] Add bill detail view
- [ ] Handle dashboard empty and loading states

## F9 - Frontend tests

- [x] Test menu rendering and availability
- [x] Test search and category filtering
- [x] Test adding and changing order quantities
- [x] Test unavailable-item behavior
- [x] Test API loading and error states
- [x] Test bill breakdown rendering
- [x] Test applied-offer reasons
- [x] Test exact paise display
- [x] Test preview workflow with mocked APIs
- [ ] Add responsive layout checks for key screens
- [x] Run the complete frontend test suite

## F10 - Integration and definition of done

- [x] Connect the frontend to menu endpoints
- [x] Connect the frontend to order endpoints
- [x] Connect bill preview to the backend pricing engine
- [x] Connect bill finalization to persisted bills
- [x] Verify React contains no pricing formulas
- [ ] Test the full cashier workflow
- [ ] Test preview versus finalized bill consistency
- [ ] Test historical bills after menu changes
- [ ] Update frontend setup documentation
- [ ] Run linting, formatting, type checks, and tests
- [ ] Confirm a cashier can complete an order and understand every bill component
