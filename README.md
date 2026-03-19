# SP Dashboard — Success Payment

Payment management dashboard for hotels, restaurants and retail businesses. Multi-tenant application with customer, property, user, terminal, transaction and financial report management.

---

## Tech Stack

### Frontend
| Tool | Role |
|---|---|
| **React 18 + TypeScript** | UI framework |
| **Vite** | Bundler and dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | UI components (Dialog, Table, Select…) |
| **Recharts** | Charts (revenue, transactions, EOD) |
| **React Router v6** | SPA routing |
| **Axios** | API calls |
| **lucide-react** | Icons |

### Backend
| Tool | Role |
|---|---|
| **Node.js + Express** | REST API server |
| **PostgreSQL (pg)** | Relational database |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT authentication (access + refresh tokens) |
| **speakeasy + qrcode** | MFA TOTP (Google Authenticator) |
| **Resend** | Transactional emails (invitation, password reset) |
| **@upstash/redis** | Redis cache (TTL on transactions, terminals, dashboard) |

---

## Deployment Infrastructure

### Database — Supabase
- Managed PostgreSQL in the cloud
- Schema is automatically initialized on backend startup (`ensureSchema()`)
- Connection via **Connection Pooler** (port 6543) for IPv4 compatibility with Render
- URL: `postgresql://postgres.xxx:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres`

### Cache — Upstash Redis
- Serverless Redis, REST-compatible
- Used to cache lists (transactions, terminals, dashboard, customers)
- TTL: 1 min (dashboard), 5 min (transactions/terminals), 1h (customers)
- Automatic invalidation on every mutation (POST/PUT/DELETE)
- Graceful no-op if env vars are not set (dev-friendly)

### Backend — Render
- **Web Service** Node.js, Frankfurt region
- Build: `npm install` — Start: `node src/index.js`
- Root directory: `SuccessPaymentDashboard-main/backend`
- Auto-deploy on every push to `main`
- URL: `https://successpaymentdashboard.onrender.com`

### Frontend — Vercel
- Build: `npm run build` — Output: `dist/`
- SPA rewrites configured in `vercel.json`
- Environment variable to set: `VITE_API_URL=https://successpaymentdashboard.onrender.com/api`
- Deploy via CLI: `vercel` from the project root

### Emails — Resend
- Transactional emails (user invitation, password reset)
- Sender: `no-reply@success-payment.com`
- Falls back to console.log if `RESEND_API_KEY` is not set (local dev)

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET=...
JWT_REFRESH_SECRET=...
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
RESEND_API_KEY=re_...
EMAIL_FROM=no-reply@success-payment.com
APP_URL=https://your-frontend.vercel.app
PORT=4000
NODE_ENV=production
```

### Frontend (`.env.production`)
```env
VITE_API_URL=https://successpaymentdashboard.onrender.com/api
```

---

## Running Locally

```bash
# Frontend
npm install
npm run dev        # http://localhost:5173

# Backend
cd SuccessPaymentDashboard-main/backend
npm install
node src/index.js  # http://localhost:4000
```

Local database: Docker PostgreSQL or point `DATABASE_URL` to Supabase.

---

## Project Structure

```
├── src/
│   ├── pages/          # React pages (Dashboard, Transactions, Customers…)
│   ├── components/     # Reusable components (UI, Header, Sidebar…)
│   ├── context/        # React contexts (Auth, Language, CustomerFilter)
│   ├── services/       # API calls (authService, customerService…)
│   ├── layout/         # AppLayout, AppSidebar
│   └── lib/            # Permissions, utilities
├── SuccessPaymentDashboard-main/
│   └── backend/
│       └── src/
│           ├── index.js   # Express server + all routes
│           ├── db.js      # PostgreSQL pool
│           └── cache.js   # Upstash Redis helpers
├── vercel.json            # Vercel deployment config
└── SuccessPaymentDashboard-main/backend/render.yaml  # Render deployment config
```

---

## Roles & Permissions

| Role | Access |
|---|---|
| `super_admin` | Full access + customer management + SP Admin management |
| `sp_admin` | Full platform access except user creation |
| `hotel_manager` | Full access scoped to their customer |
| `financial_manager` | Full access scoped to their customer |
| `front_office_manager` | Transactions, EOD, reports, virtual terminal |
| `front_office_operator` | Read-only transactions |

---

## Key Features

- **Multi-tenant**: each customer only sees their own data
- **MFA**: TOTP via Google Authenticator + backup codes
- **i18n**: FR / EN language switcher (persisted in localStorage)
- **Redis cache**: optimized performance on list endpoints
- **Emails**: user invitation + password reset via Resend
- **Responsive**: mobile-first, tables with horizontal scroll
- **Reports**: revenue charts, EOD trend, day-of-week statistics
