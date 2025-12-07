import { addPhrasebookEntries, ensureMigrations, getQuotaState, incrementQuota, savePhrasebookEntry } from '../storage';
import { splitIntoSentences } from '../shared/sentence';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  ErrorResponse,
  RuntimeMessage,
  SentenceSuggestion,
  LanguageFeedback,
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
  } else if (message?.type === 'SAVE_TO_PHRASEBOOK') {
    handleSaveToPhrasebook(message.feedback)
      .then(sendResponse)
      .catch((error: unknown) => {
        const response: ErrorResponse = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        sendResponse(response);
      });
    return true;
  } else if (message?.type === 'OPEN_SIDE_PANEL') {
    // 打开标准侧边栏
    chrome.sidePanel.open({
      tabId: _sender.tab?.id,
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

async function handleSaveToPhrasebook(feedback: LanguageFeedback): Promise<{ success: boolean }> {
  console.log('[BACKGROUND] handleSaveToPhrasebook called with feedback:', feedback);
  
  // 创建短语簿条目
  const entry: SentenceSuggestion = {
    userInput: feedback.input,
    rewritten: feedback.suggestion,
    explanation: feedback.explanation.join(' '),
    focusPoints: feedback.focus_points.map(fp => ({
      source: fp.source,
      target: fp.target,
      reason: fp.reason,
    })),
    intentTags: [],
    timestamp: new Date().toISOString(),
    favorited: true,
  };
  
  await savePhrasebookEntry(entry);
  console.log('[BACKGROUND] Saved to phrasebook:', entry);
  
  return { success: true };
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
