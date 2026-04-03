'use client';

import { useState } from 'react';
import PaymentLinkForm from '@/components/PaymentLinkForm';
import ARLog from '@/components/ARLog';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'form' | 'log'>('form');
  const [refreshLog, setRefreshLog] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                ⚡ PayForge
              </h1>
              <p className="text-xs text-gray-500">AR Payment Link Generator · Stripe</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'form'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Generate Link
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'log'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AR Log
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'form' ? (
          <PaymentLinkForm
            onLinkGenerated={() => setRefreshLog((r) => r + 1)}
          />
        ) : (
          <ARLog key={refreshLog} />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6 mt-4 border-t border-gray-200">
        <p className="text-xs text-center text-gray-400">
          PayForge · Powered by{' '}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            Stripe
          </a>
          {' '}· Internal tool — not for external distribution
        </p>
      </footer>
    </div>
  );
}
