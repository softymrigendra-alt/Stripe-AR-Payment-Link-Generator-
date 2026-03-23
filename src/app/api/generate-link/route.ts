import { NextRequest, NextResponse } from 'next/server';
import { paymentLinkSchema } from '@/lib/validations';
import { getOrCreateStripeCustomer, createPaymentLink } from '@/lib/stripe';
import { sendPaymentLinkEmail } from '@/lib/email';
import { addLogEntry } from '@/lib/ar-log';
import { ARLogEntry } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = paymentLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 1. Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      data.customerEmail,
      data.customerName,
      data.business,
      data.customerPhone
    );

    // 2. Create Stripe payment link
    const { url, id, expiresAt } = await createPaymentLink({
      business: data.business,
      amount: data.amount,
      currency: data.currency,
      customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      description: data.description,
      expirationHours: data.expirationHours,
      redirectUrl: data.redirectUrl,
    });

    const expiresAtDate = new Date(expiresAt * 1000);

    // 3. Create AR log entry
    const logEntry: ARLogEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      stripeLink: url,
      stripeLinkId: id,
      business: data.business,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      expiresAt: expiresAtDate.toISOString(),
      redirectUrl: data.redirectUrl,
      status: 'ACTIVE',
    };

    await addLogEntry(logEntry);

    // 4. Send payment link email (non-blocking — don't fail if email fails)
    let emailError: string | undefined;
    try {
      await sendPaymentLinkEmail({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        paymentLink: url,
        expiresAt: expiresAtDate,
        arCcEmail: process.env.AR_CC_EMAIL || '',
        companyName: process.env.COMPANY_NAME || 'Your Company',
      });
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Email delivery failed';
      console.error('Email send error:', err);
    }

    return NextResponse.json({
      success: true,
      link: url,
      linkId: id,
      expiresAt: expiresAtDate.toISOString(),
      logEntry,
      emailError,
    });
  } catch (err) {
    console.error('Generate link error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
