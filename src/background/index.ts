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
  console.log('[BACKGROUND] handleAnalyze called with text:', request.text);
  
  // 不再按照句号拆分文本，直接使用整个文本
  const sentences = [request.text];
  console.log('[BACKGROUND] Using entire text as single sentence:', sentences);
  
  const currentQuota = await getQuotaState();
  console.log('[BACKGROUND] Current quota:', currentQuota);
  
  if (currentQuota.exceeded) {
    console.log('[BACKGROUND] Quota exceeded');
    return {
      type: 'error',
      message: 'Daily limit reached. Upgrade to continue.',
    };
  }

  const suggestions = await generateMockSuggestions(sentences);
  console.log('[BACKGROUND] Generated suggestions:', suggestions);
  
  const updatedQuota = await incrementQuota(sentences.length);
  console.log('[BACKGROUND] Updated quota:', updatedQuota);
  
  const phrasebook = await addPhrasebookEntries(suggestions);
  console.log('[BACKGROUND] Added to phrasebook, new phrasebook:', phrasebook);

  const response: AnalyzeResponse = {
    type: 'analyze-result',
    suggestions,
    quota: updatedQuota,
  };
  
  console.log('[BACKGROUND] Sending response:', response);
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
