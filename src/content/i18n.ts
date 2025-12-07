import en from '../../i18n/en.json';
import zh from '../../i18n/zh.json';

export type UiTranslations = {
  panelTitle: string;
  original: string;
  suggestion: string;
  focus: string;
  explanation: string;
  alternatives: string;
  replace: string;
  save: string;
  close: string;
  loading: string;
  noContent: string;
  popupTitle: string;
  popupDescription: string;
  languagePair: string;
  model: string;
  quota: string;
  quotaExceeded: string;
  loadingQuota: string;
  phrasebook: string;
  noPhrasebookEntries: string;
  today: string;
  limit: string;
};

type TranslationMap = Record<string, UiTranslations>;

const translations: TranslationMap = {
  en,
  zh,
};

export function getTranslations(languageCode: string): UiTranslations {
  return translations[languageCode] ?? translations.en;
}
