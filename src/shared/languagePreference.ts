import { DEFAULT_LANGUAGE_PAIR } from './config';
import type { LanguageCode, LanguagePair } from './types';

export type LanguagePreference = {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
};

function toPreferenceFromPair(pair: LanguagePair): LanguagePreference {
  return { nativeLanguage: pair.from, targetLanguage: pair.to };
}

export async function getUserLanguagePreference(): Promise<LanguagePreference> {
  try {
    const syncResult = await chrome.storage.sync.get('languagePreference');
    const stored = syncResult.languagePreference as Partial<LanguagePreference> | undefined;
    if (stored?.nativeLanguage && stored?.targetLanguage) {
      return stored as LanguagePreference;
    }
  } catch (error) {
    console.warn('Failed to read language preference from sync storage', error);
  }

  try {
    const localSettings = await chrome.storage.local.get('settings');
    const languagePair = (localSettings.settings as { languagePair?: LanguagePair } | undefined)?.languagePair;
    if (languagePair?.from && languagePair?.to) {
      return toPreferenceFromPair(languagePair);
    }
  } catch (error) {
    console.warn('Failed to read language pair from local storage', error);
  }

  return toPreferenceFromPair(DEFAULT_LANGUAGE_PAIR);
}
