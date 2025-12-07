export type LanguageCode = 'zh' | 'en' | 'ko';

export type LanguagePreference = {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
};

export type LanguagePair = {
  from: LanguageCode;
  to: LanguageCode;
};

export type ModelId = 'gpt' | 'deepseek';

export type SentenceSuggestion = {
  userInput: string;
  rewritten: string;
  explanation: string;
  focusPoints: FocusPoint[];
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

export type FocusPoint = {
  source: string;
  target: string;
  reason: string;
};

export type LanguageFeedback = {
  input: string;
  suggestion: string;
  focus_points: FocusPoint[];
  explanation: string[];
  alternatives: string[];
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

export type SaveToPhrasebookRequest = {
  type: 'SAVE_TO_PHRASEBOOK';
  feedback: LanguageFeedback;
};

export type OpenSidePanelRequest = {
  type: 'OPEN_SIDE_PANEL';
};

export type ReplaceTextRequest = {
  type: 'REPLACE_TEXT';
  suggestion: string;
  tabId?: number;
  frameId?: number;
};

export type ShowFeedbackRequest = {
  type: 'SHOW_FEEDBACK';
  feedback: LanguageFeedback;
  translations: any;
  frameId?: number;
};

export type ShowLoadingRequest = {
  type: 'SHOW_LOADING';
  translations: any;
  frameId?: number;
};

export type RuntimeMessage = 
  | AnalyzeRequest 
  | AnalyzeResponse 
  | ErrorResponse 
  | SaveToPhrasebookRequest
  | OpenSidePanelRequest
  | ReplaceTextRequest
  | ShowFeedbackRequest
  | ShowLoadingRequest;
