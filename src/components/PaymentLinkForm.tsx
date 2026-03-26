'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentLinkSchema, CURRENCIES, BUSINESSES, formatAmount } from '@/lib/validations';
import { PaymentLinkFormData, GenerateLinkResponse, InvoiceAttachment } from '@/types';
import ConfirmationSummary from './ConfirmationSummary';
import GeneratedLinkOutput from './GeneratedLinkOutput';

type FormStep = 'form' | 'confirming' | 'generating' | 'success' | 'error';

interface PaymentLinkFormProps {
  onLinkGenerated?: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}

const EXPIRY_PRESETS = [
  { label: '2h', hours: 2 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '72h', hours: 72 },
  { label: '7d', hours: 168 },
];

export default function PaymentLinkForm({ onLinkGenerated }: PaymentLinkFormProps) {
  const [step, setStep] = useState<FormStep>('form');
  const [apiResult, setApiResult] = useState<GenerateLinkResponse | null>(null);
  const [confirmedData, setConfirmedData] = useState<PaymentLinkFormData | null>(null);
  const [invoiceAttachment, setInvoiceAttachment] = useState<InvoiceAttachment | null>(null);
  const [confirmedAttachment, setConfirmedAttachment] = useState<InvoiceAttachment | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PaymentLinkFormData>({
    resolver: zodResolver(paymentLinkSchema),
    defaultValues: {
      business: 'DENALI',
      currency: 'USD',
      expirationHours: 48,
      redirectUrl: process.env.NEXT_PUBLIC_DEFAULT_REDIRECT_URL ?? 'https://yourcompany.com/payment-success',
    },
  });

  const selectedCurrency = watch('currency');
  const expirationHours = watch('expirationHours');

  // Step 1 → Step 2: Show confirmation
  const onSubmit = (data: PaymentLinkFormData) => {
    setConfirmedData(data);
    setConfirmedAttachment(invoiceAttachment);
    setStep('confirming');
  };

  // Step 2 → Step 3: Generate link
  const onConfirm = async () => {
    if (!confirmedData) return;
    setStep('generating');

    try {
      const res = await fetch('/api/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...confirmedData, invoiceAttachment: confirmedAttachment }),
      });

      const data: GenerateLinkResponse = await res.json();
      setApiResult(data);

      if (data.success) {
        setStep('success');
        onLinkGenerated?.();
      } else {
        setStep('error');
      }
    } catch (err) {
      setApiResult({
        success: false,
        error: err instanceof Error ? err.message : 'Network error. Please try again.',
      });
      setStep('error');
    }
  };

  // Reset to form
  const handleGenerateAnother = () => {
    reset();
    setStep('form');
    setApiResult(null);
    setConfirmedData(null);
    setInvoiceAttachment(null);
    setConfirmedAttachment(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert('File size must be under 5MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setInvoiceAttachment({ name: file.name, type: file.type, data: base64, size: file.size });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setInvoiceAttachment(null);
  };

  // --- Success / Error State ---
  if (step === 'success' || step === 'error') {
    return (
      <GeneratedLinkOutput
        result={apiResult!}
        onGenerateAnother={handleGenerateAnother}
      />
    );
  }

  // --- Confirmation Step ---
  if (step === 'confirming' || step === 'generating') {
    return (
      <ConfirmationSummary
        data={confirmedData!}
        onConfirm={onConfirm}
        onEdit={() => setStep('form')}
        isGenerating={step === 'generating'}
        attachmentName={confirmedAttachment?.name}
      />
    );
  }

  // --- Main Form ---
  return (
    <div className="max-w-2xl mx-auto">
      {/* Page intro */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Generate Payment Link</h2>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to create a single-use Stripe payment link and auto-email it to the payer.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-5">

          {/* === BUSINESS SELECTOR === */}
          <div className="card px-6 py-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Business Account
            </h3>
            <div className="flex gap-3">
              {BUSINESSES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setValue('business', b.id as 'DENALI' | 'BLINK', { shouldValidate: true })}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                    watch('business') === b.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
            <FieldError message={errors.business?.message} />
          </div>

          {/* === AMOUNT & CURRENCY === */}
          <div className="card px-6 py-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Payment Amount
            </h3>

            <div className="flex gap-3">
              {/* Currency Selector */}
              <div className="w-32 shrink-0">
                <label className="label" htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  {...register('currency')}
                  className="input-field"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <FieldError message={errors.currency?.message} />
              </div>

              {/* Amount */}
              <div className="flex-1">
                <label className="label" htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <span className="text-gray-400 text-sm font-medium">
                      {selectedCurrency === 'AED' ? 'د.إ' :
                       selectedCurrency === 'INR' ? '₹' :
                       selectedCurrency === 'EUR' ? '€' :
                       selectedCurrency === 'GBP' ? '£' :
                       selectedCurrency === 'SGD' ? 'S$' :
                       selectedCurrency === 'AUD' ? 'A$' :
                       selectedCurrency === 'CAD' ? 'C$' : '$'}
                    </span>
                  </div>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className={`input-field pl-9 ${errors.amount ? 'input-field-error' : ''}`}
                  />
                </div>
                <FieldError message={errors.amount?.message} />
              </div>
            </div>
          </div>

          {/* === CUSTOMER DETAILS === */}
          <div className="card px-6 py-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Customer Details
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="label" htmlFor="customerName">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  {...register('customerName')}
                  className={`input-field ${errors.customerName ? 'input-field-error' : ''}`}
                />
                <FieldError message={errors.customerName?.message} />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="customerEmail">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="customerEmail"
                      type="email"
                      placeholder="billing@acme.com"
                      {...register('customerEmail')}
                      className={`input-field pl-9 ${errors.customerEmail ? 'input-field-error' : ''}`}
                    />
                  </div>
                  <FieldError message={errors.customerEmail?.message} />
                </div>

                <div>
                  <label className="label" htmlFor="customerPhone">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      id="customerPhone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      {...register('customerPhone')}
                      className="input-field pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === INVOICE DETAILS === */}
          <div className="card px-6 py-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Invoice / Reference
            </h3>

            <div>
              <label className="label" htmlFor="description">
                Invoice / Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                id="description"
                type="text"
                placeholder="e.g. INV-2024-0042 – Q3 Software Services"
                {...register('description')}
                className={`input-field ${errors.description ? 'input-field-error' : ''}`}
              />
              <FieldError message={errors.description?.message} />
              <p className="mt-1.5 text-xs text-gray-400">
                This will appear on the payment page and in the customer email.
              </p>
            </div>

            {/* File Attachment */}
            <div className="mt-4">
              <label className="label">
                Attach Invoice <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              {invoiceAttachment ? (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{invoiceAttachment.name}</p>
                    <p className="text-xs text-gray-500">{(invoiceAttachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm text-gray-500 group-hover:text-indigo-600 transition-colors">
                    Click to attach invoice (PDF, PNG, JPG — max 5MB)
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          {/* === LINK SETTINGS === */}
          <div className="card px-6 py-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Link Settings
            </h3>

            <div className="space-y-4">
              {/* Expiration */}
              <div>
                <label className="label" htmlFor="expirationHours">
                  Expires After <span className="text-red-500">*</span>
                </label>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {EXPIRY_PRESETS.map((preset) => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => setValue('expirationHours', preset.hours, { shouldValidate: true })}
                      className={`px-3 py-1 text-xs font-medium rounded-md border transition-all ${
                        expirationHours === preset.hours
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="expirationHours"
                    type="number"
                    min="1"
                    max="720"
                    placeholder="48"
                    {...register('expirationHours', { valueAsNumber: true })}
                    className={`input-field w-32 ${errors.expirationHours ? 'input-field-error' : ''}`}
                  />
                  <span className="text-sm text-gray-500">hours (1–720)</span>
                </div>
                <FieldError message={errors.expirationHours?.message} />
              </div>

              {/* Redirect URL — hidden, value set from env */}
              <input type="hidden" {...register('redirectUrl')} />
            </div>
          </div>

          {/* === SUBMIT === */}
          <div className="flex justify-end pt-1">
            <button type="submit" className="btn-primary px-8 py-3 text-base">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Review &amp; Confirm
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
