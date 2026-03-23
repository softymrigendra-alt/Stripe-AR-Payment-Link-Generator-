import { z } from 'zod';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'AUD', 'CAD'] as const;

export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'AED ',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$',
};

export function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency as Currency] ?? currency + ' ';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const BUSINESSES = [
  { id: 'DENALI', name: 'Denali' },
  { id: 'BLINK', name: 'Blink Test' },
] as const;

export type BusinessId = (typeof BUSINESSES)[number]['id'];

export const paymentLinkSchema = z.object({
  business: z.enum(['DENALI', 'BLINK'], { required_error: 'Please select a business' }),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero'),
  currency: z.enum(CURRENCIES),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Please enter a valid email address'),
  customerPhone: z.string().optional(),
  description: z.string().min(1, 'Description / Invoice Ref is required'),
  expirationHours: z
    .number({ invalid_type_error: 'Expiration must be a number' })
    .int('Must be a whole number')
    .min(1, 'Expiration must be between 1 and 720 hours')
    .max(720, 'Expiration must be between 1 and 720 hours'),
  redirectUrl: z.string().url('Please enter a valid URL'),
});

export type PaymentLinkFormData = z.infer<typeof paymentLinkSchema>;
