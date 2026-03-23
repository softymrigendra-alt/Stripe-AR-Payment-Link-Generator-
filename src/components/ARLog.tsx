'use client';

import { useState, useEffect, useCallback } from 'react';
import { ARLogEntry } from '@/types';
import { formatAmount, BUSINESSES } from '@/lib/validations';
import { format, formatDistanceToNow } from 'date-fns';

function StatusBadge({ status }: { status: ARLogEntry['status'] }) {
  const styles = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    PAID: 'bg-blue-100 text-blue-700 border-blue-200',
    EXPIRED: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const dots = {
    ACTIVE: 'bg-green-500',
    PAID: 'bg-blue-500',
    EXPIRED: 'bg-gray-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
}

function CopyIconButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy payment link"
      className={`p-1.5 rounded-md transition-colors ${
        copied
          ? 'bg-green-50 text-green-600'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export default function ARLog() {
  const [entries, setEntries] = useState<ARLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ARLogEntry['status'] | 'ALL'>('ALL');
  const [businessFilter, setBusinessFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchEntries = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/ar-log');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AR log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchEntries, 60_000);
    return () => clearInterval(interval);
  }, [fetchEntries]);

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch('/api/ar-log', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'PAID' }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: 'PAID' } : e))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const matchesBusiness = businessFilter === 'ALL' || e.business === businessFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      e.customerName.toLowerCase().includes(q) ||
      e.customerEmail.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.stripeLinkId.toLowerCase().includes(q);
    return matchesStatus && matchesBusiness && matchesSearch;
  });

  // Stats
  const stats = {
    total: entries.length,
    active: entries.filter((e) => e.status === 'ACTIVE').length,
    paid: entries.filter((e) => e.status === 'PAID').length,
    expired: entries.filter((e) => e.status === 'EXPIRED').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AR Payment Log</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Track all generated payment links and their status.
            {!loading && (
              <span className="ml-2 text-gray-400">
                Last updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchEntries}
          disabled={loading}
          className="btn-secondary"
          title="Refresh"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50' },
            { label: 'Active', value: stats.active, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Paid', value: stats.paid, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Expired', value: stats.expired, color: 'text-gray-500', bg: 'bg-gray-50' },
          ].map((stat) => (
            <div key={stat.label} className={`card px-4 py-3 ${stat.bg}`}>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card px-4 py-3 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, invoice, or link ID…"
            className="input-field pl-9 py-2"
          />
        </div>

        {/* Business Filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBusinessFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              businessFilter === 'ALL'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          {BUSINESSES.map((b) => (
            <button
              key={b.id}
              onClick={() => setBusinessFilter(b.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                businessFilter === b.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['ALL', 'ACTIVE', 'PAID', 'EXPIRED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                statusFilter === s
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading AR log…
          </div>
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <div className="text-red-500 mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">{error}</p>
          <button onClick={fetchEntries} className="btn-secondary mt-3 text-xs">Retry</button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-gray-300 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">
            {entries.length === 0
              ? 'No payment links generated yet.'
              : 'No entries match your filters.'}
          </p>
          {entries.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Generate your first payment link using the form.
            </p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Invoice / Ref
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.map((entry) => {
                  const isExpired = entry.status === 'EXPIRED';
                  const expiresAt = new Date(entry.expiresAt);
                  const isExpiringSoon =
                    entry.status === 'ACTIVE' &&
                    expiresAt.getTime() - Date.now() < 2 * 3600 * 1000;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-gray-50 transition-colors ${isExpired ? 'opacity-60' : ''}`}
                    >
                      {/* Business */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {BUSINESSES.find((b) => b.id === entry.business)?.name ?? entry.business ?? '—'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-[150px]" title={entry.customerName}>
                          {entry.customerName}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-[150px]" title={entry.customerEmail}>
                          {entry.customerEmail}
                        </div>
                      </td>

                      {/* Invoice */}
                      <td className="px-4 py-3">
                        <span
                          className="text-gray-700 truncate max-w-[180px] block"
                          title={entry.description}
                        >
                          {entry.description}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatAmount(entry.amount, entry.currency)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={entry.status} />
                      </td>

                      {/* Expires */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-xs ${
                            isExpiringSoon
                              ? 'text-orange-600 font-medium'
                              : isExpired
                              ? 'text-gray-400 line-through'
                              : 'text-gray-500'
                          }`}
                          title={format(expiresAt, 'PPpp')}
                        >
                          {isExpired
                            ? format(expiresAt, 'd MMM yy')
                            : formatDistanceToNow(expiresAt, { addSuffix: true })}
                        </span>
                        {isExpiringSoon && (
                          <span className="ml-1 text-orange-400 text-xs">⚠</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="text-xs text-gray-400"
                          title={format(new Date(entry.createdAt), 'PPpp')}
                        >
                          {format(new Date(entry.createdAt), 'd MMM yy, HH:mm')}
                        </span>
                      </td>

                      {/* Link */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <a
                            href={entry.stripeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Open payment link"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <CopyIconButton text={entry.stripeLink} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        {entry.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleMarkPaid(entry.id)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                            title="Mark as paid"
                          >
                            Mark Paid
                          </button>
                        )}
                        {entry.status !== 'ACTIVE' && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-right">
            Showing {filteredEntries.length} of {entries.length} entries
          </div>
        </div>
      )}
    </div>
  );
}
