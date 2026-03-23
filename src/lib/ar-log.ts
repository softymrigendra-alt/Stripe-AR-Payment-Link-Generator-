import { Redis } from '@upstash/redis';
import { ARLogEntry } from '@/types';
import { getStripeClient } from '@/lib/stripe';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const LOG_KEY = 'ar-log-entries';

async function readLog(): Promise<ARLogEntry[]> {
  try {
    const data = await redis.get<ARLogEntry[]>(LOG_KEY);
    return data ?? [];
  } catch {
    return [];
  }
}

async function writeLog(entries: ARLogEntry[]): Promise<void> {
  await redis.set(LOG_KEY, entries);
}

export async function addLogEntry(entry: ARLogEntry): Promise<void> {
  const entries = await readLog();
  entries.unshift(entry);
  await writeLog(entries);
}

export async function getLogEntries(): Promise<ARLogEntry[]> {
  const entries = await readLog();
  const now = new Date();
  const newlyExpired: ARLogEntry[] = [];

  const updated = entries.map((e) => {
    if (e.status === 'ACTIVE' && new Date(e.expiresAt) < now) {
      newlyExpired.push(e);
      return { ...e, status: 'EXPIRED' as const };
    }
    return e;
  });

  if (newlyExpired.length > 0) {
    await writeLog(updated);
    // Deactivate expired links on Stripe so they can no longer be used
    await Promise.allSettled(
      newlyExpired.map((e) =>
        getStripeClient(e.business).paymentLinks.update(e.stripeLinkId, { active: false })
      )
    );
  }

  return updated;
}

export async function updateLogEntryStatus(id: string, status: ARLogEntry['status']): Promise<boolean> {
  const entries = await readLog();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  entries[idx].status = status;
  await writeLog(entries);
  return true;
}

export async function updateLogEntryByLinkId(stripeLinkId: string, status: ARLogEntry['status']): Promise<boolean> {
  const entries = await readLog();
  const idx = entries.findIndex((e) => e.stripeLinkId === stripeLinkId);
  if (idx === -1) return false;
  entries[idx].status = status;
  await writeLog(entries);
  return true;
}
