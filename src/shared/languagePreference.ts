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
  // 在极端情况下（扩展上下文失效或 chrome 未注入），直接返回默认值，避免抛错
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return toPreferenceFromPair(DEFAULT_LANGUAGE_PAIR);
  }

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

  // 最后回退到默认
  return toPreferenceFromPair(DEFAULT_LANGUAGE_PAIR);
}
