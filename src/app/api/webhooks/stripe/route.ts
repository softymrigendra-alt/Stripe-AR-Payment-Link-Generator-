import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateLogEntryByLinkId } from '@/lib/ar-log';

// Map each business to its webhook secret
const WEBHOOK_SECRETS: Record<string, string | undefined> = {
  BLINK: process.env.STRIPE_WEBHOOK_SECRET_BLINK,
  DENALI: process.env.STRIPE_WEBHOOK_SECRET_DENALI,
};

// Single Stripe instance just for signature verification (key unused for constructEvent)
const stripe = new Stripe('sk_test_placeholder', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Try each webhook secret until one verifies successfully
  let event: Stripe.Event | null = null;

  for (const secret of Object.values(WEBHOOK_SECRETS)) {
    if (!secret) continue;
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret);
      break;
    } catch {
      continue;
    }
  }

  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentLinkId = typeof session.payment_link === 'string'
      ? session.payment_link
      : session.payment_link?.id ?? null;

    if (paymentLinkId) {
      await updateLogEntryByLinkId(paymentLinkId, 'PAID');
    }
  }

  return NextResponse.json({ received: true });
}
