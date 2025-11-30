import { DAILY_QUOTA } from './config';
import { QuotaState } from './types';

export type QuotaSnapshot = {
  used: number;
  limit: number;
  resetAt: string;
};

export function getUtcMidnight(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0));
}

export function createQuotaSnapshot(used: number, now = new Date()): QuotaSnapshot {
  const resetAt = getUtcMidnight(now).toISOString();
  return { used, limit: DAILY_QUOTA, resetAt };
}

export function computeQuotaState(used: number, now = new Date()): QuotaState {
  const snapshot = createQuotaSnapshot(used, now);
  const exceeded = used >= snapshot.limit;
  return { ...snapshot, exceeded };
}

export function isQuotaExpired(resetAt: string, now = new Date()): boolean {
  return new Date(resetAt).getTime() <= now.getTime();
}
