export type LanguageCode = 'zh' | 'en' | 'ko';

export type LanguagePair = {
  from: LanguageCode;
  to: LanguageCode;
};

export type ModelId = 'gpt' | 'deepseek';

export type SentenceSuggestion = {
  userInput: string;
  rewritten: string;
  explanation: string;
  focusPoints: string[];
  intentTags: string[];
  sourceUrl?: string;
  timestamp: string;
  favorited?: boolean;
};

export type PhrasebookRecord = SentenceSuggestion & {
  id: string;
};

export type AnalyzeRequest = {
  type: 'analyze-text';
  text: string;
  languagePair: LanguagePair;
  model: ModelId;
};

export type AnalyzeResponse = {
  type: 'analyze-result';
  suggestions: SentenceSuggestion[];
  quota: QuotaState;
};

export type QuotaState = {
  used: number;
  limit: number;
  resetAt: string;
  exceeded: boolean;
};

export type ErrorResponse = {
  type: 'error';
  message: string;
};

export type RuntimeMessage = AnalyzeRequest | AnalyzeResponse | ErrorResponse;
