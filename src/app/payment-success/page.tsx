'use client';

import { useEffect, useState } from 'react';

export default function PaymentSuccess() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Slight delay so the animation feels intentional
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div
        className={`max-w-md w-full text-center transition-all duration-700 ease-out ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Animated checkmark */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg">
              <svg
                className="w-14 h-14 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                  className={`transition-all duration-700 delay-300 ${
                    show ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </svg>
            </div>
            {/* Ripple rings */}
            <span className="absolute inset-0 rounded-full bg-emerald-300 opacity-20 animate-ping" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          Payment Received!
        </h1>
        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
          Thank you — your payment has been successfully processed.<br />
          A confirmation will be sent to your email shortly.
        </p>

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 text-left space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-emerald-500 text-xl mt-0.5">✓</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Payment confirmed</p>
              <p className="text-gray-500 text-sm">Your transaction is complete and secure.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-500 text-xl mt-0.5">✓</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Receipt on its way</p>
              <p className="text-gray-500 text-sm">Check your inbox for a payment receipt.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-500 text-xl mt-0.5">✓</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Account updated</p>
              <p className="text-gray-500 text-sm">Your balance has been cleared with our team.</p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-400">
          Questions? Contact us at{' '}
          <a href="mailto:ar@yourcompany.com" className="text-indigo-500 hover:underline">
            ar@yourcompany.com
          </a>
        </p>

        {/* Powered by */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-300">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
          </svg>
          <span>Secured by Stripe</span>
        </div>
      </div>
    </div>
  );
}
