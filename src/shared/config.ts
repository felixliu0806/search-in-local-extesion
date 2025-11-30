import { LanguagePair, ModelId } from './types';

export const DEFAULT_HOTKEY = 'space x3';
export const TRIGGER_SEQUENCE = '   ';

export const SUPPORTED_LANGUAGE_PAIRS: LanguagePair[] = [
  { from: 'zh', to: 'en' },
  { from: 'ko', to: 'en' },
  { from: 'en', to: 'zh' },
];

export const DEFAULT_LANGUAGE_PAIR: LanguagePair = SUPPORTED_LANGUAGE_PAIRS[0];

export const SUPPORTED_MODELS: ModelId[] = ['gpt', 'deepseek'];
export const DEFAULT_MODEL: ModelId = 'gpt';

export const PHRASEBOOK_MAX_ITEMS = 50;
export const DAILY_QUOTA = 20;
