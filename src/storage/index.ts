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

export async function ensureMigrations(): Promise<void> {
  const version = (await chrome.storage.local.get(STORAGE_KEYS.schemaVersion))[STORAGE_KEYS.schemaVersion] as number | undefined;
  if (version === CURRENT_SCHEMA_VERSION) return;
  await chrome.storage.local.set({ [STORAGE_KEYS.schemaVersion]: CURRENT_SCHEMA_VERSION });
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  const stored = result[STORAGE_KEYS.settings] as Settings | undefined;
  if (stored) return stored;
  const defaults: Settings = {
    hotkey: TRIGGER_SEQUENCE,
    languagePair: DEFAULT_LANGUAGE_PAIR,
    model: DEFAULT_MODEL,
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: defaults });
  return defaults;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
}

export async function getQuotaState(now = new Date()): Promise<QuotaState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.quota);
  const stored = result[STORAGE_KEYS.quota] as StoredQuota | undefined;
  if (!stored) {
    const snapshot = createQuotaSnapshot(0, now);
    await chrome.storage.local.set({ [STORAGE_KEYS.quota]: snapshot });
    return computeQuotaState(0, now);
  }
  if (isQuotaExpired(stored.resetAt, now)) {
    const snapshot = createQuotaSnapshot(0, now);
    await chrome.storage.local.set({ [STORAGE_KEYS.quota]: snapshot });
    return computeQuotaState(0, now);
  }
  return computeQuotaState(stored.used, now);
}

export async function incrementQuota(count: number): Promise<QuotaState> {
  const now = new Date();
  const result = await chrome.storage.local.get(STORAGE_KEYS.quota);
  const stored = (result[STORAGE_KEYS.quota] as StoredQuota | undefined) ?? createQuotaSnapshot(0, now);
  const nextUsed = stored.used + count;
  const nextSnapshot = createQuotaSnapshot(nextUsed, now);
  await chrome.storage.local.set({ [STORAGE_KEYS.quota]: nextSnapshot });
  return computeQuotaState(nextUsed, now);
}

export async function getPhrasebook(): Promise<PhrasebookRecord[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.phrasebook);
  const stored = result[STORAGE_KEYS.phrasebook] as PhrasebookRecord[] | undefined;
  return stored ?? [];
}

export async function addPhrasebookEntries(entries: SentenceSuggestion[]): Promise<PhrasebookRecord[]> {
  const existing = await getPhrasebook();
  const timestamp = Date.now();
  const enriched = entries.map((entry, index) => ({
    ...entry,
    id: `${timestamp}-${index}`,
  }));
  const merged = [...enriched, ...existing].slice(0, PHRASEBOOK_MAX_ITEMS);
  await chrome.storage.local.set({ [STORAGE_KEYS.phrasebook]: merged });
  return merged;
}

export async function updatePhrasebookEntry(id: string, partial: Partial<PhrasebookRecord>): Promise<PhrasebookRecord[]> {
  const existing = await getPhrasebook();
  const updated = existing.map((item) => (item.id === id ? { ...item, ...partial } : item));
  await chrome.storage.local.set({ [STORAGE_KEYS.phrasebook]: updated });
  return updated;
}
