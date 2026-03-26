'use client';

import { PaymentLinkFormData } from '@/types';
import { formatAmount } from '@/lib/validations';
import { format, addHours } from 'date-fns';

interface ConfirmationSummaryProps {
  data: PaymentLinkFormData;
  onConfirm: () => void;
  onEdit: () => void;
  isGenerating: boolean;
  attachmentName?: string;
}

function SummaryRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 font-medium w-40 shrink-0">{label}</span>
      <span className={`text-sm text-right text-gray-900 font-medium break-all ${valueClass ?? ''}`}>
        {value}
      </span>
    </div>
  );
}

export default function ConfirmationSummary({
  data,
  onConfirm,
  onEdit,
  isGenerating,
  attachmentName,
}: ConfirmationSummaryProps) {
  const expiresAt = addHours(new Date(), data.expirationHours);
  const formattedExpiry = format(expiresAt, "EEE d MMM yyyy 'at' h:mm a");

  return (
    <div className="max-w-xl mx-auto">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Confirm Payment Link Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Please review carefully before generating. A payment email will be sent immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 py-4">
          {/* Amount Hero */}
          <div className="text-center py-4 mb-4 bg-indigo-50 rounded-lg">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Amount to Collect</p>
            <p className="text-3xl font-bold text-indigo-700">
              {formatAmount(data.amount, data.currency)}
            </p>
            <p className="text-xs text-indigo-400 mt-1">{data.currency}</p>
          </div>

          {/* Details */}
          <div>
            <SummaryRow label="Customer Name" value={data.customerName} />
            <SummaryRow label="Customer Email" value={data.customerEmail} />
            {data.customerPhone && (
              <SummaryRow label="Phone" value={data.customerPhone} />
            )}
            <SummaryRow label="Invoice / Reference" value={data.description} />
            {attachmentName && (
              <SummaryRow label="Attachment" value={attachmentName} />
            )}
            <SummaryRow
              label="Link Expires"
              value={`${formattedExpiry} (${data.expirationHours}h)`}
              valueClass="text-red-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onEdit}
            disabled={isGenerating}
            className="btn-secondary w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Details
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isGenerating}
            className="btn-primary w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate &amp; Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
