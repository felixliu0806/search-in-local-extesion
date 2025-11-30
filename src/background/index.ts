import { addPhrasebookEntries, ensureMigrations, getQuotaState, incrementQuota } from '../storage';
import { splitIntoSentences } from '../shared/sentence';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  ErrorResponse,
  RuntimeMessage,
  SentenceSuggestion,
} from '../shared/types';

chrome.runtime.onInstalled.addListener(async () => {
  await ensureMigrations();
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message?.type === 'analyze-text') {
    handleAnalyze(message as AnalyzeRequest)
      .then(sendResponse)
      .catch((error: unknown) => {
        const response: ErrorResponse = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        sendResponse(response);
      });
    return true;
  }
  return false;
});

async function handleAnalyze(request: AnalyzeRequest): Promise<AnalyzeResponse | ErrorResponse> {
  const sentences = splitIntoSentences(request.text);
  const currentQuota = await getQuotaState();
  if (currentQuota.exceeded) {
    return {
      type: 'error',
      message: 'Daily limit reached. Upgrade to continue.',
    };
  }

  const suggestions = await generateMockSuggestions(sentences);
  const updatedQuota = await incrementQuota(sentences.length);
  await addPhrasebookEntries(suggestions);

  const response: AnalyzeResponse = {
    type: 'analyze-result',
    suggestions,
    quota: updatedQuota,
  };
  return response;
}

async function generateMockSuggestions(sentences: string[]): Promise<SentenceSuggestion[]> {
  const now = new Date().toISOString();
  return sentences.map((sentence) => ({
    userInput: sentence,
    rewritten: sentence,
    explanation: 'Placeholder rewrite. Integrate model to improve.',
    focusPoints: [],
    intentTags: [],
    timestamp: now,
    favorited: false,
  }));
}
