import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateLogEntryByLinkId, getLogEntryByLinkId, incrementFailureCount } from '@/lib/ar-log';
import { sendReceiptEmail, sendPaymentFailedEmail } from '@/lib/email';
import { getStripeClient } from '@/lib/stripe';

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
      const entry = await updateLogEntryByLinkId(paymentLinkId, 'PAID');
      if (entry) {
        try {
          await sendReceiptEmail({
            customerName: entry.customerName,
            customerEmail: entry.customerEmail,
            description: entry.description,
            amount: entry.amount,
            currency: entry.currency,
            paidAt: new Date(),
            companyName: process.env.COMPANY_NAME || 'Your Company',
            arCcEmail: process.env.AR_CC_EMAIL || '',
          });
        } catch (err) {
          console.error('Receipt email error:', err);
        }
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const meta = paymentIntent.metadata;
    const failureReason = paymentIntent.last_payment_error?.message ?? 'Unknown error';

    // Find the log entry via the checkout session's payment link
    const sessions = await new Stripe(
      meta.business === 'DENALI' ? process.env.STRIPE_KEY_DENALI! : process.env.STRIPE_KEY_BLINK!,
      { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() }
    ).checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 });

    const session = sessions.data[0];
    const paymentLinkId = session
      ? (typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id)
      : null;

    const entry = paymentLinkId ? await getLogEntryByLinkId(paymentLinkId) : null;

    if (entry) {
      try {
        const result = await incrementFailureCount(entry.stripeLinkId);
        if (!result) return NextResponse.json({ received: true });

        if (result.expired) {
          // 3 failures reached — deactivate on Stripe
          await getStripeClient(entry.business).paymentLinks.update(entry.stripeLinkId, { active: false });
        }

        await sendPaymentFailedEmail({
          customerName: entry.customerName,
          customerEmail: entry.customerEmail,
          description: entry.description,
          amount: entry.amount,
          currency: entry.currency,
          failureReason,
          retryLink: entry.stripeLink,
          attemptsLeft: result.expired ? 0 : 3 - (result.entry.failureCount ?? 0),
          companyName: process.env.COMPANY_NAME || 'Your Company',
          arCcEmail: process.env.AR_CC_EMAIL || '',
        });
      } catch (err) {
        console.error('Payment failed email error:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
