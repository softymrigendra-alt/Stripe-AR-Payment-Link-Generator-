import Stripe from 'stripe';

const stripeConfig = {
  apiVersion: '2023-10-16' as const,
  maxNetworkRetries: 0,
  timeout: 8000,
  httpClient: Stripe.createFetchHttpClient(),
};

export function getStripeClient(business: string): Stripe {
  const keyMap: Record<string, string | undefined> = {
    DENALI: process.env.STRIPE_KEY_DENALI,
    BLINK: process.env.STRIPE_KEY_BLINK,
  };
  const key = keyMap[business] ?? process.env.STRIPE_SECRET_KEY!;
  return new Stripe(key, stripeConfig);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, stripeConfig);

export default stripe;

export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  business: string,
  phone?: string
): Promise<string> {
  const client = getStripeClient(business);
  const existing = await client.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }
  const customer = await client.customers.create({
    email,
    name,
    phone: phone || undefined,
  });
  return customer.id;
}

export async function createPaymentLink(params: {
  business: string;
  amount: number;
  currency: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  expirationHours: number;
  redirectUrl: string;
  generatedBy?: string;
}): Promise<{ url: string; id: string; expiresAt: number }> {
  const client = getStripeClient(params.business);

  // Create a one-time price for this specific payment
  const price = await client.prices.create({
    currency: params.currency.toLowerCase(),
    unit_amount: Math.round(params.amount * 100), // convert to cents
    product_data: {
      name: params.description,
    },
  });

  const expiresAt = Math.floor(Date.now() / 1000) + params.expirationHours * 3600;

  // Create the payment link (single-use)
  const paymentLink = await client.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    submit_type: 'pay',
    payment_intent_data: {
      metadata: {
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone || '',
        invoice_ref: params.description,
        generated_by: params.generatedBy || 'AR Team',
      },
      description: params.description,
    },
    after_completion: {
      type: 'redirect',
      redirect: { url: params.redirectUrl },
    },
    restrictions: {
      completed_sessions: { limit: 1 },
    },
    // Store expiry in metadata — use webhooks or scheduled jobs to deactivate
    metadata: {
      expires_at: expiresAt.toString(),
      customer_id: params.customerId,
      generated_by: params.generatedBy || 'AR Team',
    },
  });

  // Append prefilled_email so Stripe pre-populates the payer's email on checkout
  const url = `${paymentLink.url}?prefilled_email=${encodeURIComponent(params.customerEmail)}`;

  return {
    url,
    id: paymentLink.id,
    expiresAt,
  };
}
