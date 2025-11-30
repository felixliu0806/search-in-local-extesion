import {
  DEFAULT_LANGUAGE_PAIR,
  DEFAULT_MODEL,
  TRIGGER_SEQUENCE,
  PHRASEBOOK_MAX_ITEMS,
} from '../shared/config';
import { LanguagePair, ModelId, PhrasebookRecord, QuotaState, SentenceSuggestion } from '../shared/types';
import { computeQuotaState, createQuotaSnapshot, isQuotaExpired } from '../shared/quota';

const STORAGE_KEYS = {
  settings: 'settings',
  quota: 'quota',
  phrasebook: 'phrasebook',
  schemaVersion: 'schemaVersion',
};

const CURRENT_SCHEMA_VERSION = 1;

export type Settings = {
  hotkey: string;
  languagePair: LanguagePair;
  model: ModelId;
};

export type StoredQuota = {
  used: number;
  resetAt: string;
};

type Schema = {
  [STORAGE_KEYS.settings]: Settings;
  [STORAGE_KEYS.quota]: StoredQuota;
  [STORAGE_KEYS.phrasebook]: PhrasebookRecord[];
  [STORAGE_KEYS.schemaVersion]: number;
};

async function getFromStorage<T extends keyof Schema>(key: T): Promise<Schema[T] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as Schema[T] | undefined;
}

async function setToStorage<T extends keyof Schema>(key: T, value: Schema[T]): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function ensureMigrations(): Promise<void> {
  const version = (await getFromStorage(STORAGE_KEYS.schemaVersion)) ?? 0;
  if (version === CURRENT_SCHEMA_VERSION) return;
  // Placeholder for future schema changes; currently no-op beyond version stamp.
  await setToStorage(STORAGE_KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
}

export async function getSettings(): Promise<Settings> {
  const stored = await getFromStorage(STORAGE_KEYS.settings);
  if (stored) return stored;
  const defaults: Settings = {
    hotkey: TRIGGER_SEQUENCE,
    languagePair: DEFAULT_LANGUAGE_PAIR,
    model: DEFAULT_MODEL,
  };
  await setToStorage(STORAGE_KEYS.settings, defaults);
  return defaults;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setToStorage(STORAGE_KEYS.settings, settings);
}

export async function getQuotaState(now = new Date()): Promise<QuotaState> {
  const stored = await getFromStorage(STORAGE_KEYS.quota);
  if (!stored) {
    const snapshot = createQuotaSnapshot(0, now);
    await setToStorage(STORAGE_KEYS.quota, snapshot);
    return computeQuotaState(0, now);
  }
  if (isQuotaExpired(stored.resetAt, now)) {
    const snapshot = createQuotaSnapshot(0, now);
    await setToStorage(STORAGE_KEYS.quota, snapshot);
    return computeQuotaState(0, now);
  }
  return computeQuotaState(stored.used, now);
}

export async function incrementQuota(count: number): Promise<QuotaState> {
  const now = new Date();
  const stored = (await getFromStorage(STORAGE_KEYS.quota)) ?? createQuotaSnapshot(0, now);
  const nextUsed = stored.used + count;
  const nextSnapshot = createQuotaSnapshot(nextUsed, now);
  await setToStorage(STORAGE_KEYS.quota, nextSnapshot);
  return computeQuotaState(nextUsed, now);
}

export async function getPhrasebook(): Promise<PhrasebookRecord[]> {
  return (await getFromStorage(STORAGE_KEYS.phrasebook)) ?? [];
}

export async function addPhrasebookEntries(entries: SentenceSuggestion[]): Promise<PhrasebookRecord[]> {
  const existing = await getPhrasebook();
  const timestamp = Date.now();
  const enriched = entries.map((entry, index) => ({
    ...entry,
    id: `${timestamp}-${index}`,
  }));
  const merged = [...enriched, ...existing].slice(0, PHRASEBOOK_MAX_ITEMS);
  await setToStorage(STORAGE_KEYS.phrasebook, merged);
  return merged;
}

export async function updatePhrasebookEntry(id: string, partial: Partial<PhrasebookRecord>): Promise<PhrasebookRecord[]> {
  const existing = await getPhrasebook();
  const updated = existing.map((item) => (item.id === id ? { ...item, ...partial } : item));
  await setToStorage(STORAGE_KEYS.phrasebook, updated);
  return updated;
}
