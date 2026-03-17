'use client';

import { useState } from 'react';
import { GenerateLinkResponse } from '@/types';
import { formatAmount } from '@/lib/validations';
import { format } from 'date-fns';

interface GeneratedLinkOutputProps {
  result: GenerateLinkResponse;
  onGenerateAnother: () => void;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
        copied
          ? 'bg-green-50 border-green-300 text-green-700'
          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
      }`}
      title={`Copy ${label ?? 'to clipboard'}`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function GeneratedLinkOutput({
  result,
  onGenerateAnother,
}: GeneratedLinkOutputProps) {
  if (!result.success || !result.link || !result.logEntry) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-red-100 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-red-800">Generation Failed</h2>
                <p className="text-sm text-red-600 mt-0.5">{result.error ?? 'An unexpected error occurred.'}</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 flex justify-end">
            <button type="button" onClick={onGenerateAnother} className="btn-secondary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const entry = result.logEntry;
  const expiryFormatted = format(new Date(result.expiresAt!), "EEE d MMM yyyy 'at' h:mm a");

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Success Banner */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 bg-green-50 border-b border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-green-800">Payment Link Generated!</h2>
              <p className="text-sm text-green-600 mt-0.5">
                {result.emailError
                  ? 'Link created, but email delivery failed (see below).'
                  : `Email sent to ${entry.customerEmail}`}
              </p>
            </div>
          </div>
        </div>

        {/* Link Display */}
        <div className="px-6 py-5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Payment Link
          </label>
          <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-indigo-700 font-mono truncate hover:underline"
              title={result.link}
            >
              {result.link}
            </a>
            <CopyButton text={result.link} label="link" />
          </div>

          {/* Amount + Expiry */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Amount</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatAmount(entry.amount, entry.currency)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg px-4 py-3">
              <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Expires</p>
              <p className="text-sm font-semibold text-red-700 mt-1 leading-tight">
                {expiryFormatted}
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">{entry.customerName}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{entry.customerEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">{entry.description}</span>
            </div>
          </div>

          {/* Stripe Link ID */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-400">Stripe ID:</span>
            <code className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-mono">
              {entry.stripeLinkId}
            </code>
            <CopyButton text={entry.stripeLinkId} label="Stripe ID" />
          </div>
        </div>

        {/* Email Warning */}
        {result.emailError && (
          <div className="mx-6 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-2">
              <svg className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-yellow-700">Email delivery failed</p>
                <p className="text-xs text-yellow-600 mt-0.5">{result.emailError}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  The payment link was created successfully. Please share it manually.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <a
            href={result.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Preview Link
          </a>
          <button
            type="button"
            onClick={onGenerateAnother}
            className="btn-primary w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Generate Another Link
          </button>
        </div>
      </div>
    </div>
  );
}
