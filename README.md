# Vendor — Small Venue Seating & Booking Platform

A full-stack web application that lets venue administrators design interactive seating layouts and manage bookings, while customers browse upcoming sessions, select seats on a live seat map, and pay securely online.

**Repository:** `https://github.com/chris-ma/Vendor.git`
**Branch:** `claude/venue-booking-platform-Z4v7U`

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | Prisma ORM — SQLite (local) / PostgreSQL (production) |
| Auth | NextAuth.js — credentials provider, JWT sessions |
| Payments | Stripe + `@stripe/react-stripe-js` |
| Email | Nodemailer (SMTP) |
| Styling | Tailwind CSS |
| Drag-and-drop | `@dnd-kit/core` + `@dnd-kit/utilities` |
| Icons | Lucide React |
| Validation | Zod |

---

## Features

### Admin
| Feature | Description |
|---|---|
| **Seating Layout Editor** | Drag-and-drop canvas (800×600). Place seats and tables, group into colour-coded sections, set prices per element. Save to database. |
| **Dashboard** | Stats cards (total bookings, revenue, upcoming sessions, active layouts) and a recent-bookings table. |
| **Sessions** | Create, edit, and cancel sessions. Assign a date, time, venue, and layout to each session. |
| **Bookings** | Full booking list with filters (session, payment status, booking status). View booking details, cancel bookings, export to CSV. |

### Customer
| Feature | Description |
|---|---|
| **Session Browser** | Grid of upcoming events with date, time, venue, and a "Book Now" call-to-action. |
| **Seat Selection** | Interactive seat map showing availability (green / red / grey). Multi-select with a live price cart sidebar. |
| **Checkout** | Stripe card payment with customer details form (name, email, optional phone). |
| **Confirmation** | Booking reference, seat list, total paid. Printable. Confirmation email sent automatically. |

---

## Data Models

```
User          — id, email, password (bcrypt), role
Venue         — id, name, description, address, logoUrl, primaryColor, emailTemplate
SeatingLayout — id, name, venueId, width, height → seats[], sections[]
Section       — id, name, color, pricingTier, layoutId → seats[]
Seat          — id, label, x, y, type (SEAT|TABLE), capacity, price, layoutId, sectionId
Session       — id, name, date, startTime, endTime, venueId, layoutId, status
Booking       — id, sessionId, customerName, customerEmail, customerPhone, totalAmount, status, paymentStatus, paymentIntentId → items[]
BookingItem   — id, bookingId, seatId, price
```

---

## File Structure

```
/
├── prisma/
│   ├── schema.prisma                        # Data models (PostgreSQL in prod, SQLite locally)
│   ├── seed.ts                              # Seeds admin user, venue, layout, 3 sessions
│   └── migrations/
│       └── 20260101000000_init/migration.sql
├── railway.toml                             # Railway deployment config
├── src/
│   ├── middleware.ts                        # Protects /admin/* — redirects to /login
│   ├── types/index.ts                       # Shared TypeScript interfaces
│   ├── lib/
│   │   ├── db.ts                            # Prisma client singleton
│   │   ├── auth.ts                          # NextAuth config (credentials + bcrypt)
│   │   ├── stripe.ts                        # Stripe client
│   │   ├── email.ts                         # sendBookingConfirmation() — HTML email
│   │   └── utils.ts                         # formatCurrency(), formatDate(), cn()
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Modal.tsx
│   │   ├── admin/
│   │   │   ├── SeatingLayoutEditor.tsx      # Drag-and-drop canvas editor
│   │   │   └── BookingTable.tsx             # Sortable, filterable bookings table
│   │   └── customer/
│   │       ├── SeatingMap.tsx               # Read-only interactive seat map
│   │       └── CheckoutForm.tsx             # Stripe CardElement + customer details
│   └── app/
│       ├── layout.tsx                       # Root layout (SessionProvider)
│       ├── page.tsx                         # → redirects to /sessions
│       ├── login/page.tsx                   # Admin login
│       ├── sessions/
│       │   ├── page.tsx                     # Customer: browse sessions
│       │   └── [id]/page.tsx                # Customer: seat map + cart
│       ├── checkout/page.tsx                # Customer: Stripe payment
│       ├── confirmation/page.tsx            # Customer: booking confirmed
│       ├── admin/
│       │   ├── layout.tsx                   # Dark sidebar nav
│       │   ├── page.tsx                     # Dashboard
│       │   ├── layouts/
│       │   │   ├── page.tsx                 # List / create / duplicate layouts
│       │   │   └── [id]/editor/page.tsx     # Layout editor page
│       │   ├── sessions/page.tsx            # Session management
│       │   └── bookings/page.tsx            # Booking management + CSV export
│       └── api/
│           ├── auth/[...nextauth]/route.ts
│           ├── venues/route.ts
│           ├── layouts/
│           │   ├── route.ts                 # GET list, POST create
│           │   └── [id]/route.ts            # GET, PUT (seats + sections), DELETE
│           ├── sessions/
│           │   ├── route.ts                 # GET list (upcoming filter), POST
│           │   └── [id]/
│           │       ├── route.ts             # GET, PUT, DELETE
│           │       └── seats/route.ts       # GET seats with booking status
│           ├── bookings/
│           │   ├── route.ts                 # GET (filters), POST create
│           │   └── [id]/route.ts            # GET, PATCH status, DELETE cancel
│           └── payments/
│               ├── create-intent/route.ts   # POST → Stripe PaymentIntent
│               └── webhook/route.ts         # Stripe webhook → confirm + email
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Key Routes

### Customer
| URL | Purpose |
|---|---|
| `/sessions` | Browse upcoming events |
| `/sessions/:id` | Select seats on interactive map |
| `/checkout?sessionId=…&seats=…` | Enter details and pay |
| `/confirmation?bookingId=…` | Booking confirmed |

### Admin
| URL | Purpose |
|---|---|
| `/login` | Admin sign-in |
| `/admin` | Dashboard — stats + recent bookings |
| `/admin/layouts` | List, create, duplicate, delete layouts |
| `/admin/layouts/:id/editor` | Drag-and-drop seating editor |
| `/admin/sessions` | Create and manage sessions |
| `/admin/bookings` | Full booking list, filters, CSV export |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (or `file:./dev.db` for local SQLite) |
| `NEXTAUTH_SECRET` | Random string — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full app URL e.g. `https://your-app.up.railway.app` |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` or `sk_live_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_…` or `pk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_…`) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually `587`) |
| `SMTP_USER` | SMTP username / email |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From address for confirmation emails |

---

## Quick Start (Local Dev)

**Prerequisites:** Node.js 18+, npm

```bash
# 1. Clone
git clone https://github.com/chris-ma/Vendor.git
cd Vendor
git checkout claude/venue-booking-platform-Z4v7U

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL="file:./dev.db" and fill in Stripe/SMTP keys

# 4. Set up database
npx prisma db push
npm run db:seed

# 5. Run
npm run dev
# Open http://localhost:3000
```

**Default admin credentials:** `admin@venue.com` / `admin123`

**Seed data included:**
- Venue: The Grand Venue (123 Main Street, NY)
- Layout: Standard Hall — 20 seats in 4 rows (A–D), Premium + Standard sections
- Sessions: Jazz Night Live (Apr 15), Acoustic Sessions (Apr 22), Comedy Showcase (May 1)

---

## Deploy to Railway

### 1. Create project
[railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select `chris-ma/Vendor` → branch `claude/venue-booking-platform-Z4v7U`.

### 2. Add PostgreSQL
In your project → **+ New** → **Database** → **PostgreSQL**.

### 3. Set environment variables
In your service's **Variables** tab:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `NEXTAUTH_URL` | `https://your-app.up.railway.app` |
| `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | `sk_live_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | from Stripe Dashboard (step 5) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | your SMTP provider |

### 4. Deploy
Railway auto-runs: `npm install` → `prisma generate` → `prisma migrate deploy` → `next build` → `npm start`.

### 5. Seed (first deploy only)
In the Railway service shell:
```bash
npm run db:seed
```

### 6. Configure Stripe webhook
Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**:
- URL: `https://your-app.up.railway.app/api/payments/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

---

## Stripe Test Cards

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 9995` | Payment declined |

Use any future expiry date and any 3-digit CVC.
