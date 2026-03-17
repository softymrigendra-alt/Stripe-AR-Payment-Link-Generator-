# AR Payment Link Generator

A Next.js web app for the **Accounts Receivable team** to generate single-use, expiring Stripe Payment Links and automatically email them to payers.

---

## Prerequisites

- **Node.js v20+** — installed via nvm (already set up on this machine)
- **Stripe account** (free) — [dashboard.stripe.com](https://dashboard.stripe.com)
- `.env.local` configured (see below)

---

## Starting the Server

Every time you open a new terminal, run:

```bash
# 1. Activate Node.js (required — Node is installed via nvm)
source ~/.nvm/nvm.sh

# 2. Go to the project directory
cd "/Users/mrigendrasingh/AR Payment link"

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**

> To stop the server, press `Ctrl + C` in the terminal.

---

## Environment Configuration (`.env.local`)

Before using the app, open `.env.local` in the project root and fill in the values below.

### Stripe (required to generate links)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → sign in / sign up free
2. Enable **Test mode** (toggle in the top-right corner)
3. Go to **Developers → API Keys**
4. Copy the **Secret key** (`sk_test_...`)
5. Paste it into `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

> Use `sk_test_...` keys for testing. Switch to `sk_live_...` only for real payments in production.

### Email (SMTP)

The current test setup uses **Ethereal** — a fake inbox that captures emails without delivering them to real recipients. No configuration needed for testing.

**To view captured test emails:**
- URL: [https://ethereal.email/messages](https://ethereal.email/messages)
- Login: `tmniuil5opwauzhp@ethereal.email`
- Password: `gMr7yvXv4MeVVsndrj`

**To switch to real email delivery (e.g. Gmail):**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password        # Gmail App Password (not your login password)
SMTP_FROM=your@gmail.com
```

> For Gmail: enable 2-Step Verification → go to myaccount.google.com/apppasswords → generate an App Password.

### Other settings

```
AR_CC_EMAIL=ar@yourcompany.com              # AR team address CC'd on every email
COMPANY_NAME=Your Company                   # Appears in email signature
NEXT_PUBLIC_DEFAULT_REDIRECT_URL=https://...  # Page shown to payer after payment
```

---

## Using the App

### Step 1 — Open the app

Navigate to **http://localhost:3000** in your browser.

The app has two tabs at the top:
- **Generate Link** — create a new payment link
- **AR Log** — view all previously generated links

---

### Step 2 — Fill in the payment form

| Field | What to enter |
|---|---|
| **Amount** | Payment amount (e.g. `2500.00`). Must be greater than 0. |
| **Currency** | Select from dropdown — defaults to USD |
| **Customer Name** | Full name of the payer |
| **Customer Email** | Payer's email — the link will be sent here automatically |
| **Customer Phone** | Optional |
| **Description / Invoice Ref** | Invoice number or reason for payment (e.g. `INV-2024-089`) |
| **Expiration (Hours)** | How long the link stays active — between 1 and 720 hours |
| **Post-Payment Redirect URL** | URL the payer sees after paying — pre-filled from config |

All fields are validated before you can proceed.

---

### Step 3 — Review the confirmation summary

After clicking **Continue to Review**, you will see a summary:

```
Customer    : John Doe (john@example.com)
Amount      : USD 2,500.00
Invoice Ref : INV-2024-089
Expires In  : 48 hours  (by Mon 18 Mar 2026, 10:00 AM UTC)
Redirect To : https://example.com/payment-success
Auto-Email  : Will be sent to john@example.com
```

Click **Confirm & Generate** to proceed, or **Edit** to go back.

---

### Step 4 — Link is generated and emailed

The app will:
1. Look up or create a Stripe customer for the payer's email (no duplicates)
2. Create a one-time Stripe Payment Link (single-use, with expiry)
3. Save the link to the AR Log
4. Automatically email the link to the payer

The output screen shows:

```
Payment Link Generated & Emailed Successfully!

Link      : https://buy.stripe.com/test_xxxxxxx
Payer     : John Doe (john@example.com)
Amount    : USD 2,500.00
Ref       : INV-2024-089
Expires   : Mon 18 Mar 2026, 10:00 AM UTC
Email Sent: john@example.com
```

Use the **Copy Link** button to copy the URL manually if needed.

---

### Step 5 — Complete a test payment

1. Open the generated link in a browser
2. Use Stripe's test card details:

| Field | Value |
|---|---|
| Card number | `4242 4242 4242 4242` |
| Expiry | Any future date (e.g. `12/30`) |
| CVC | Any 3 digits (e.g. `123`) |
| ZIP | Any 5 digits (e.g. `10001`) |

3. After payment, you will be redirected to the configured redirect URL
4. The link becomes invalid — any second attempt is blocked by Stripe

---

### Viewing Emails (Test Mode)

Go to [https://ethereal.email/messages](https://ethereal.email/messages) and log in with the test credentials above. All emails sent during testing appear here — click any message to see the full HTML email with the payment link button.

---

### AR Log Tab

The **AR Log** shows every link generated in this session and across restarts. Features:
- **Status badges** — `ACTIVE` (green), `PAID` (blue), `EXPIRED` (gray)
- **Copy Link** — copy the Stripe URL to clipboard
- **Mark as Paid** — manually mark a link as paid (e.g. if paid offline)
- **Search** — filter by customer name, email, or invoice ref
- **Filter by status** — show only ACTIVE / PAID / EXPIRED links
- Auto-refreshes every 60 seconds; expired links update automatically

---

## Project Structure

```
AR Payment link/
├── .env.local                  ← Your configuration (never commit this)
├── ar-log.json                 ← Auto-created; stores all generated links
├── src/
│   ├── app/
│   │   ├── page.tsx            ← Main UI (tab navigation)
│   │   └── api/
│   │       ├── generate-link/  ← POST: creates Stripe link + sends email
│   │       └── ar-log/         ← GET/PATCH: reads and updates the log
│   ├── components/
│   │   ├── PaymentLinkForm.tsx       ← 4-step form flow
│   │   ├── ConfirmationSummary.tsx   ← Review screen
│   │   ├── GeneratedLinkOutput.tsx   ← Success screen
│   │   └── ARLog.tsx                 ← Log table
│   └── lib/
│       ├── stripe.ts           ← Stripe API calls
│       ├── email.ts            ← Email sending
│       ├── ar-log.ts           ← File-based log persistence
│       └── validations.ts      ← Zod form schema
```

---

## Common Issues

**Port 3000 already in use**
```bash
# Run on a different port
npm run dev -- -p 3001
```

**"Module not found" errors after pulling updates**
```bash
source ~/.nvm/nvm.sh
npm install
```

**Stripe error: "No API key provided"**
- Make sure `STRIPE_SECRET_KEY` in `.env.local` starts with `sk_test_` and is not the placeholder value
- Restart the dev server after editing `.env.local`

**Email not appearing in Ethereal inbox**
- Wait a few seconds and refresh [ethereal.email/messages](https://ethereal.email/messages)
- Check that `SMTP_USER` and `SMTP_PASS` in `.env.local` match the Ethereal credentials above
