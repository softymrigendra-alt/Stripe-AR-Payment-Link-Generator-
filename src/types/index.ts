export interface PaymentLinkFormData {
  business: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  expirationHours: number;
  redirectUrl: string;
}

export interface ARLogEntry {
  id: string;
  createdAt: string;
  stripeLink: string;
  stripeLinkId: string;
  business: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  currency: string;
  description: string;
  expiresAt: string;
  redirectUrl: string;
  status: 'ACTIVE' | 'PAID' | 'EXPIRED';
  generatedBy?: string;
}

export interface GenerateLinkResponse {
  success: boolean;
  link?: string;
  linkId?: string;
  expiresAt?: string;
  logEntry?: ARLogEntry;
  error?: string;
  emailError?: string;
}
