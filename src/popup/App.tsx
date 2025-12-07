import { useEffect, useState } from 'react';
import {
  DEFAULT_LANGUAGE_PAIR,
  DEFAULT_MODEL,
  SUPPORTED_LANGUAGE_PAIRS,
  SUPPORTED_MODELS,
} from '../shared/config';
import { LanguagePair, ModelId, QuotaState } from '../shared/types';
import { getSettings, saveSettings, getQuotaState } from '../storage';
import { getUserLanguagePreference } from '../shared/languagePreference';
import { getTranslations, UiTranslations } from '../content/i18n';

function formatPair(pair: LanguagePair): string {
  return `${pair.from} → ${pair.to}`;
}

export function App() {
  const [languagePair, setLanguagePair] = useState<LanguagePair>(DEFAULT_LANGUAGE_PAIR);
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [translations, setTranslations] = useState<UiTranslations>(getTranslations('en'));

  const loadData = async () => {
    const settings = await getSettings();
    setLanguagePair(settings.languagePair);
    setModel(settings.model);
    setQuota(await getQuotaState());
    
    // 获取用户语言偏好并设置翻译
    const languagePreference = await getUserLanguagePreference();
    setTranslations(getTranslations(languagePreference.nativeLanguage));
  };

  useEffect(() => {
    loadData();

    // 添加存储变化监听器，当配额更新时自动重新加载数据
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes['quota']) {
        loadData();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // 清理监听器
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleLanguageChange = async (pair: LanguagePair) => {
    setLanguagePair(pair);
    const settings = await getSettings();
    await saveSettings({ ...settings, languagePair: pair });
  };

  const handleModelChange = async (nextModel: ModelId) => {
    setModel(nextModel);
    const settings = await getSettings();
    await saveSettings({ ...settings, model: nextModel });
  };

  return (
    <div className="w-96 bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
        <h1 className="text-xl font-bold">{translations.popupTitle}</h1>
        <p className="text-sm text-blue-100 mt-1">{translations.popupDescription}</p>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Language Pair Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{translations.languagePair}</h2>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LANGUAGE_PAIRS.map((pair) => (
              <button
                key={formatPair(pair)}
                onClick={() => handleLanguageChange(pair)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  languagePair.from === pair.from && languagePair.to === pair.to
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-800 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm border border-gray-200'
                }`}
              >
                {formatPair(pair)}
              </button>
            ))}
          </div>
        </section>

        {/* Model Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{translations.model}</h2>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_MODELS.map((item) => (
              <button
                key={item}
                onClick={() => handleModelChange(item)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  model === item
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-800 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm border border-gray-200'
                }`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Quota Section */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{translations.quota}</h2>
          {quota ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{translations.today}</span>
                <span className="text-sm font-medium ${
                  quota.exceeded
                    ? 'text-red-600'
                    : 'text-gray-800'
                }">
                  {quota.used}/{quota.limit} {translations.limit}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    quota.exceeded
                      ? 'bg-red-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min((quota.used / quota.limit) * 100, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>UTC reset {new Date(quota.resetAt).toLocaleTimeString()}</span>
                {quota.exceeded && (
                  <span className="text-red-500 font-medium">{translations.quotaExceeded}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 text-center">{translations.loadingQuota}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
