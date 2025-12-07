import { useEffect, useState } from 'react';
import type { LanguageFeedback } from '../shared/types';
import { getTranslations, type UiTranslations } from '../content/i18n';

type SidePanelState = {
  loading: boolean;
  feedback?: LanguageFeedback;
  translations: UiTranslations;
  tabId?: number;
  frameId?: number;
};

export function App() {
  const [state, setState] = useState<SidePanelState>({
    loading: false,
    translations: getTranslations('en'),
    tabId: undefined,
    frameId: undefined,
    feedback: {
      input: 'I very like this product, it is very good and I want to buy it very much.',
      suggestion: 'I really love this product, it is excellent and I want to purchase it badly.',
      focus_points: [
        {
          source: 'very like',
          target: 'really love',
          reason: "More natural and expressive than 'very like'",
        },
        {
          source: 'very good',
          target: 'excellent',
          reason: "Stronger positive adjective that better emphasizes quality",
        },
        {
          source: 'buy',
          target: 'purchase',
          reason: "More formal and appropriate for product evaluation contexts",
        },
        {
          source: 'very much',
          target: 'badly',
          reason: "More colloquial way to express strong desire",
        },
      ],
      explanation: [
        '"really love" is more conversational than "like very much".',
        'Stronger emotional expression, suitable for social scenarios.',
        'Using varied vocabulary makes the expression more rich and engaging.',
        'Formal and informal vocabulary should be used appropriately based on context.',
      ],
      alternatives: [
        "I'm a huge fan of this product and can't wait to purchase it.",
        'I absolutely adore this excellent product and want to buy it immediately.',
        'This product is fantastic - I really want to get my hands on it.',
      ],
    },
  });

  useEffect(() => {
    // 监听来自内容脚本的消息
    const handleMessage = (message: any, sender: chrome.runtime.MessageSender, _sendResponse: (response?: any) => void) => {
      if (message.type === 'SHOW_FEEDBACK') {
        setState((prev) => ({
          loading: false,
          feedback: message.feedback,
          translations: message.translations,
          tabId: sender.tab?.id ?? prev.tabId,
          frameId: message.frameId ?? sender.frameId ?? prev.frameId,
        }));
      } else if (message.type === 'SHOW_LOADING') {
        setState((prev) => ({
          loading: true,
          feedback: undefined,
          translations: message.translations,
          tabId: sender.tab?.id ?? prev.tabId,
          frameId: message.frameId ?? sender.frameId ?? prev.frameId,
        }));
      } else if (message.type === 'CLOSE_PANEL') {
        setState(prev => ({
          ...prev,
          feedback: undefined,
        }));
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleReplace = () => {
    if (state.feedback) {
      const sendReplaceMessage = (tabId: number) => {
        const targetFrameId = state.frameId ?? 0;
        console.log('[SidePanel] sending REPLACE_TEXT to tab', {
          tabId,
          frameId: targetFrameId,
          hasFeedback: !!state.feedback,
        });
        const message = {
          type: 'REPLACE_TEXT',
          suggestion: state.feedback!.suggestion,
          frameId: targetFrameId,
        };

        const callback = () => {
          if (chrome.runtime.lastError) {
            console.warn('[SidePanel] sendMessage lastError', chrome.runtime.lastError.message, {
              tabId,
              frameId: targetFrameId,
            });
          }
        };

        chrome.tabs.sendMessage(tabId, message, { frameId: targetFrameId }, callback);
      };

      if (state.tabId !== undefined) {
        sendReplaceMessage(state.tabId);
        return;
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const targetTabId = tabs[0]?.id;
        if (targetTabId !== undefined) {
          sendReplaceMessage(targetTabId);
        }
      });
    }
  };

  const handleSave = () => {
    if (state.feedback) {
      // 向背景脚本发送保存请求
      chrome.runtime.sendMessage({
        type: 'SAVE_TO_PHRASEBOOK',
        feedback: state.feedback,
      });
    }
  };

  return (
    <div className="w-full h-full p-4 space-y-4 bg-white text-gray-900">
      <div className="space-y-2">
        {state.loading && <p className="text-sm text-gray-500">{state.translations.loading}</p>}

        {!state.loading && state.feedback && (
          <>
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">{state.translations.original}</h3>
              <p className="text-sm text-gray-600">{state.feedback.input}</p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">{state.translations.suggestion}</h3>
              <p className="text-lg font-bold text-gray-800">{state.feedback.suggestion}</p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">{state.translations.focus}</h3>
              <div className="space-y-2">
                {state.feedback.focus_points.map((item) => (
                  <div key={`${item.source}-${item.target}`} className="rounded bg-gray-50 border border-gray-200 p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-gray-200 text-xs rounded-full text-gray-700">{item.source}</span>
                      <span className="text-gray-500 text-sm">→</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-xs rounded-full text-blue-700">{item.target}</span>
                    </div>
                    <p className="text-xs text-gray-600">{item.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">{state.translations.explanation}</h3>
              <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                {state.feedback.explanation.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">{state.translations.alternatives}</h3>
              <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                {state.feedback.alternatives.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          </>
        )}

        {!state.loading && !state.feedback && (
          <p className="text-sm text-gray-500">{state.translations.noContent}</p>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button 
          onClick={handleReplace}
          disabled={!state.feedback}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded border border-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state.translations.replace}
        </button>
        <button 
          onClick={handleSave}
          disabled={!state.feedback}
          className="flex-1 px-3 py-2 bg-white text-gray-800 text-sm rounded border border-gray-300 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state.translations.save}
        </button>
      </div>
    </div>
  );
}

export default App;
