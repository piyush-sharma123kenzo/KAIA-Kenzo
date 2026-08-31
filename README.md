# KAIA Technologies — Enterprise Multi-Brand Electronics Marketplace

A production-grade MERN multi-brand electronics marketplace platform featuring authentic manufacturer procurement, serialized IMEI barcode tracking, automated Indian GST B2B billing, transparent multi-brand order splitting, express carrier logistics, double-entry financial ledgers, and central platform administration.

---

## 1. System Architecture

```
                                  CUSTOMER BROWSER
                                         │
                         HTTPS (Cloudflare / Custom Domain)
                                         │
                                 REACT 18 FRONTEND
                                   (Vite / Tailwind)
                                         │
                                EXPRESS.JS REST API
                               (Node.js / Middleware)
                                         │
                ┌────────────────────────┼────────────────────────┐
                ↓                        ↓                        ↓
         MONGODB ATLAS                AWS S3                   RAZORPAY
       (Replica Cluster)        (Product Assets)          (Payment Gateway)
                │                        │                        │
                ├────────────────────────┼────────────────────────┘
                ↓                        ↓
        SHIPPING PROVIDER       TRANSACTIONAL EMAIL
     (Shiprocket / Blue Dart)   (SendGrid / AWS SES)
```

---

## 2. Core Subsystems

1. **Customer Storefront (`/`, `/products`, `/categories`, `/brands`, `/deals`, `/cart`, `/checkout`)**:
   - Live search suggestions with ReDoS protection.
   - Faceted brand, category, price, discount, and stock scarcity filters.
   - PIN code delivery serviceability engine (27,000+ PIN codes).
   - Unified shopping cart grouped visually by brand manufacturer depot.
   - 4-step checkout with corporate GSTIN validation (CGST/SGST/IGST tax calculation).

2. **Multi-Brand Order Splitting Engine**:
   - Single customer payment creates 1 Master Order (`KAIA-ORD-...`).
   - Automatically splits into child `SellerOrder` records per brand depot (`SO-ASUS-...`, `SO-SAMS-...`).
   - Proportional discount and tax allocation across brand orders.
   - Master order fulfillment status derivation (`pending_payment` $\rightarrow$ `processing` $\rightarrow$ `partially_shipped` $\rightarrow$ `delivered`).

3. **Brand Seller Workspace (`/brand/*`)**:
   - Private brand portal scoped strictly to authorized brand tenant IDs (`req.brand._id`).
   - Multi-warehouse inventory depot management with atomic stock adjustments.
   - Serial Number & IMEI packing station with duplicate barcode prevention.
   - Reverse logistics return inspection workbench.
   - Double-entry commission accounting ledger and payout settlement tracking.

4. **Central Admin Command Center (`/admin/*`)**:
   - Real-time marketplace GMV analytics and volume KPIs.
   - Brand onboarding approval and suspension controls.
   - Product catalog verification workflow (`Draft` $\rightarrow$ `Pending` $\rightarrow$ `Approved` $\rightarrow$ `Rejected`).
   - Review moderation, promo coupons, homepage slot configuration, and immutable audit logging.

---

## 3. Production Deployment Guide

### A. Environment Configuration
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure production variables:
   - `MONGO_URI`: MongoDB Atlas connection string with replica set.
   - `JWT_SECRET` & `JWT_REFRESH_SECRET`: Cryptographically random keys.
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Live Razorpay API keys.
   - `RAZORPAY_WEBHOOK_SECRET`: Secret from Razorpay Dashboard Webhooks.
   - `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: AWS IAM S3 credentials.
   - `FRONTEND_URL`: Production domain (e.g., `https://www.kaia-technologies.com`).

### B. Frontend Production Build
```bash
cd frontend
npm install
npm run build
```
The production bundle is generated in `frontend/dist/`.

### C. Backend Production Start
```bash
cd backend
npm install --production
node server.js
```

---

## 4. Webhook Endpoints

| Provider | Endpoint | Method | Security |
|---|---|---|---|
| **Razorpay Payments** | `https://api.kaia.tech/api/payments/webhook` | `POST` | HMAC-SHA256 signature verification via `X-Razorpay-Signature` |
| **Logistics Carrier** | `https://api.kaia.tech/api/shipping/webhook` | `POST` | Bearer token / shared secret validation |

---

## 5. Health Monitoring & Observability

- `GET /health`: Overall API service uptime and status.
- `GET /health/db`: MongoDB connection readiness.
- `GET /api/admin/system-health`: Admin deep health metrics (Memory, DB, Node runtime).

---

## 6. Rollback & Disaster Recovery

1. **Frontend Rollback**: Revert deployment commit on hosting provider (e.g. Vercel/Cloudflare Pages) to instantly serve the previous immutable build artifact.
2. **Backend Rollback**: Roll back container image tag in AWS ECS/Docker registry.
3. **Database Recovery**: Restore from point-in-time MongoDB Atlas continuous automated snapshots without data loss.
