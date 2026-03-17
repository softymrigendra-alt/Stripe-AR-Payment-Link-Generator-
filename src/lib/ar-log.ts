import fs from 'fs';
import path from 'path';
import { ARLogEntry } from '@/types';

const LOG_FILE = path.join(process.cwd(), 'ar-log.json');

function readLog(): ARLogEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const data = fs.readFileSync(LOG_FILE, 'utf-8');
    return JSON.parse(data) as ARLogEntry[];
  } catch {
    return [];
  }
}

function writeLog(entries: ARLogEntry[]): void {
  fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export function addLogEntry(entry: ARLogEntry): void {
  const entries = readLog();
  entries.unshift(entry); // newest first
  writeLog(entries);
}

export function getLogEntries(): ARLogEntry[] {
  const entries = readLog();
  const now = new Date();
  let dirty = false;

  const updated = entries.map((e) => {
    if (e.status === 'ACTIVE' && new Date(e.expiresAt) < now) {
      dirty = true;
      return { ...e, status: 'EXPIRED' as const };
    }
    return e;
  });

  // Persist the status updates back to disk
  if (dirty) {
    writeLog(updated);
  }

  return updated;
}

export function updateLogEntryStatus(id: string, status: ARLogEntry['status']): boolean {
  const entries = readLog();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  entries[idx].status = status;
  writeLog(entries);
  return true;
}
