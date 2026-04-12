# ⚡ PayForge — AR Payment Link Generator

> **Create. Send. Collect.** — Instant Stripe payment links, auto-emailed to customers with invoice attachments, expiry control, and real-time AR tracking.

**Live App:** [https://ar-payment-link.vercel.app](https://ar-payment-link.vercel.app)
**GitHub:** [softymrigendra-alt/Stripe-AR-Payment-Link-Generator-](https://github.com/softymrigendra-alt/Stripe-AR-Payment-Link-Generator-)

---

## Problem Statement

Accounts Receivable teams waste time manually generating payment requests, chasing customers over email, and tracking which invoices are paid, expired, or still outstanding. There is no single tool that handles link generation, delivery, and status tracking in one place — teams rely on spreadsheets, copy-pasted Stripe links, and manual follow-ups.

---

## Solution

PayForge gives the AR team a single interface to:
- Generate a **single-use, expiring Stripe Payment Link** in seconds
- **Auto-email it** to the payer with an optional invoice attachment
- Track every link in a persistent **AR Log** with live payment status

No manual steps, no Stripe dashboard navigation, no chasing.

---

## Product Thinking

**Target Users:** Accounts Receivable teams at small-to-mid businesses managing B2B invoice collections

**Key Pain Points:**
- Generating Stripe links requires navigating the Stripe dashboard — not AR-friendly
- No built-in way to set link expiry or attach invoices to payment emails
- Payment status tracking is scattered across Stripe, email threads, and spreadsheets

**Why this solution matters:**
- Reduces time-to-collect by removing manual steps between invoice and payment
- Keeps the AR team in control without needing Stripe access for every team member
- Centralises link status (ACTIVE / PAID / EXPIRED) in one searchable log

---

## Key Features

- **Multi-account support** — Separate Stripe keys for Denali and Blink business accounts
- **Single-use expiring links** — Links auto-expire between 1 and 720 hours; single payment enforced by Stripe
- **Auto-email with invoice attachment** — Payment link emailed directly to the payer with optional PDF/image invoice (up to 5 MB)
- **4-step form flow** — Input → Review → Generate → Confirmation, with full validation
- **Persistent AR Log** — Searchable, filterable log (by name, email, invoice ref, status) backed by Upstash Redis; auto-refreshes every 60 seconds
- **Webhook-driven status updates** — `checkout.session.completed` marks links PAID; `payment_intent.payment_failed` triggers retry emails (up to 3 attempts)
- **Manual override** — Mark any link as paid offline directly from the AR Log

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Payments | Stripe Payment Links API + Webhooks |
| Email | Nodemailer over SMTP (Ethereal for test, Gmail/any SMTP for prod) |
| Persistence | Upstash Redis (KV REST API) |
| Deployment | Vercel (auto-deploy on push to `main`) |

**Request flow:**
1. AR team fills form → API creates Stripe customer (deduped by email) + Payment Link
2. Link saved to Redis AR Log → email sent to payer with optional invoice attachment
3. Stripe webhook fires on payment → status updated to PAID; failure triggers retry email

---

## Impact & Metrics (Expected)

- **~80% reduction** in time to generate and send a payment request vs. manual Stripe dashboard workflow
- **Zero missed expirations** — links auto-expire; no manual cleanup needed
- **Full AR visibility** — every link, status, and payer in one searchable log across restarts and deployments

---

## Demo

**Live:** [https://ar-payment-link.vercel.app](https://ar-payment-link.vercel.app)

Test payment card: `4242 4242 4242 4242` · any future expiry · any CVC/ZIP

---

## Future Enhancements

- **Bulk upload** — CSV import to generate and email multiple payment links at once
- **Reminders** — Scheduled follow-up emails for unpaid links approaching expiry
- **Customer portal** — Self-serve view for payers to see outstanding and paid invoices
- **Analytics dashboard** — Collection rate, average days-to-pay, revenue by business account
- **Webhook retry visibility** — Expose failed payment retry history in the AR Log

---

## Deployment (Vercel)

The app auto-deploys on every push to `main`.

| Environment | URL |
|---|---|
| **Production** | https://ar-payment-link.vercel.app |
| **Vercel Dashboard** | https://vercel.com/softymrigendra-5494s-projects/ar-payment-link |

### Environment Variables

Set all variables under **Vercel → Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `STRIPE_KEY_DENALI` | Stripe secret key for Denali business |
| `STRIPE_KEY_BLINK` | Stripe secret key for Blink business |
| `STRIPE_WEBHOOK_SECRET_DENALI` | Stripe webhook signing secret for Denali |
| `STRIPE_WEBHOOK_SECRET_BLINK` | Stripe webhook signing secret for Blink |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (typically `587`) |
| `SMTP_SECURE` | `true` for port 465, `false` otherwise |
| `SMTP_USER` | SMTP username / email |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_FROM` | Sender email address |
| `AR_CC_EMAIL` | AR team email CC'd on every payment email |
| `COMPANY_NAME` | Company name shown in emails |
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST token |
| `NEXT_PUBLIC_DEFAULT_REDIRECT_URL` | Post-payment redirect URL shown to payer |

### Stripe Webhook Setup

Register the following endpoint in **Stripe Dashboard → Developers → Webhooks** for each business account:

```
https://ar-payment-link.vercel.app/api/webhooks/stripe
```

**Events to enable:**
- `checkout.session.completed` — marks link PAID + sends receipt email
- `payment_intent.payment_failed` — sends failure email + 3-attempt retry logic

### Redeploy Manually

```bash
vercel --prod
```

---

## Local Development

### Prerequisites

- **Node.js v20+** (via nvm)
- Stripe account — [dashboard.stripe.com](https://dashboard.stripe.com)
- `.env.local` configured (see below)

### Start the server

```bash
source ~/.nvm/nvm.sh
cd "/Users/mrigendrasingh/Claude/AR Payment link"
npm run dev
```

App runs at **http://localhost:3000**. Stop with `Ctrl + C`.

### `.env.local` Configuration

**Stripe** — enable Test mode in Stripe Dashboard → Developers → API Keys → copy Secret key:
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

**Email (test)** — uses [Ethereal](https://ethereal.email/messages) by default (no real emails sent):
```
# Test credentials (pre-configured)
SMTP_USER=tmniuil5opwauzhp@ethereal.email
SMTP_PASS=gMr7yvXv4MeVVsndrj
```

**Email (production)** — switch to real SMTP, e.g. Gmail:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password   # Gmail App Password, not your login password
SMTP_FROM=your@gmail.com
```

**Other:**
```
AR_CC_EMAIL=ar@yourcompany.com
COMPANY_NAME=Your Company
NEXT_PUBLIC_DEFAULT_REDIRECT_URL=https://your-redirect.com
```

---

## Using the App

1. **Generate Link tab** — fill in amount, currency, customer details, invoice ref, optional attachment, and expiry hours
2. **Review** the confirmation summary, then click **Confirm & Generate**
3. The app creates the Stripe link, saves it to the AR Log, and emails the payer automatically
4. **AR Log tab** — track all links; filter by status (ACTIVE / PAID / EXPIRED); copy links; manually mark as paid

---

## Project Structure

```
AR Payment link/
├── .env.local                  ← Local config (never commit)
├── src/
│   ├── app/
│   │   ├── page.tsx            ← Main UI (tab navigation)
│   │   └── api/
│   │       ├── generate-link/  ← POST: creates Stripe link + sends email
│   │       ├── ar-log/         ← GET/PATCH: reads and updates the log
│   │       └── webhooks/stripe ← Handles Stripe payment events
│   ├── components/
│   │   ├── PaymentLinkForm.tsx
│   │   ├── ConfirmationSummary.tsx
│   │   ├── GeneratedLinkOutput.tsx
│   │   └── ARLog.tsx
│   └── lib/
│       ├── stripe.ts
│       ├── email.ts
│       ├── ar-log.ts
│       └── validations.ts
```

---

## Common Issues

**Port 3000 already in use**
```bash
npm run dev -- -p 3001
```

**"Module not found" after pulling updates**
```bash
source ~/.nvm/nvm.sh && npm install
```

**Stripe error: "No API key provided"**
— Ensure `STRIPE_SECRET_KEY` starts with `sk_test_` and restart the dev server after editing `.env.local`

**Email not in Ethereal inbox**
— Wait a few seconds, refresh [ethereal.email/messages](https://ethereal.email/messages), and confirm `SMTP_USER`/`SMTP_PASS` match the test credentials above
