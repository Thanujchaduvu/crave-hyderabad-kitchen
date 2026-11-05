# Biryani Direct — Company A ordering and kitchen operations prototype

A Next.js 14 + TypeScript application for direct customer ordering, outlet menu availability, test-mode checkout, kitchen order handling, catering requests, and basic operational analytics.

## Stack

- Next.js 14 App Router + React + TypeScript
- PostgreSQL + Prisma ORM
- Socket.IO for live kitchen and customer order events
- Tailwind CSS + Lucide icons
- Mock UPI/card payment (no real money is collected)
- Rule-based AI-style preparation-time estimator (queue load, item complexity, Hyderabad peak hours)

## Local setup

1. Install Node.js 20+ and PostgreSQL.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and set both PostgreSQL URLs:

   ```bash
   cp .env.example .env
   ```

4. Generate Prisma Client and apply migrations:

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. Seed the demo outlets, menu, customer, kitchen users, and sample orders:

   ```bash
   npm run db:seed
   ```

   **Warning:** the seed script clears existing application records before inserting the demo data. Use only a disposable development database.

6. Start the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Demo routes

| Route | Purpose |
|---|---|
| `/` | Project landing page and portal links |
| `/menu` | Customer menu, outlet selection, cart and mock checkout |
| `/order/<order-id>` | Customer order status tracker |
| `/kitchen/kondapur` | Kondapur kitchen display |
| `/admin/cms` | Central menu and base-price management |
| `/admin/analytics` | Order, revenue, prep estimate and repeat-customer metrics |
| `/party-orders` | Customer catering request form |
| `/admin/party-orders` | Catering request review portal |

The seeded demo customer is `+919876543210`. This is a prototype identity lookup, not production authentication. Seeded outlet IDs are `kondapur`, `gachibowli-cloud-kitchen`, and `kukatpally`.

## Important prototype boundaries

- Payments are simulated and always use test-mode success. Do not use this as a live payment integration.
- The demo customer lookup and operational APIs are not protected by production authentication/authorization yet. Add verified login, role checks, rate limiting, and audit logging before deployment.
- Marketing consent defaults to off. The customer must actively opt in.
- Menu prices are GST-inclusive. The API extracts the included GST component at 5/105 of the displayed gross price.
- Outlet geolocation is requested only after the customer selects **Use my location**. Delivery eligibility is based on the configured straight-line radius, not road distance.
- Socket.IO is initialized through a Next.js Pages API endpoint and is intended for a persistent Node.js server. Serverless deployments that do not support long-lived WebSocket connections need a managed realtime service or a separate Socket.IO service.
- Food image paths in the sample seed data are placeholders. Add licensed product photography under `public/images/` before presenting the menu as production-ready.
- The prep-time estimator is a heuristic, not a trained machine-learning model. It should be calibrated against historical outlet data before being described as predictive AI in production.

## Core API routes

- `GET /api/outlets` — list outlets; optional `lat` and `lng` return distance and radius eligibility.
- `GET /api/menu?outletId=<id>` — active menu items and outlet stock state.
- `GET, POST /api/orders` — active outlet orders and mock checkout.
- `GET /api/orders/<id>` — order detail by database ID or order number.
- `PATCH /api/orders/<id>/status` — kitchen status transition.
- `POST /api/inventory/toggle` — outlet-level item availability.
- `GET, POST /api/party-orders` — catering request submission and review list.
- `PATCH /api/party-orders/<id>/status` — catering approval status.
- `GET /api/admin/menu` and `POST /api/admin/menu/update-prices` — central menu prices.
- `GET /api/admin/analytics` — database-backed dashboard metrics.
- `/api/socket` — Socket.IO connection endpoint.

## Validation

Run the TypeScript check with:

```bash
npx tsc --noEmit
```

A full production build also requires the platform-specific Next.js SWC binary. If dependency installation was copied from another operating system, reinstall dependencies on the target machine before running `npm run build`.
