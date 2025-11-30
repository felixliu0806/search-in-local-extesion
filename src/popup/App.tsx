import { useEffect, useState } from 'react';
import {
  DEFAULT_LANGUAGE_PAIR,
  DEFAULT_MODEL,
  SUPPORTED_LANGUAGE_PAIRS,
  SUPPORTED_MODELS,
} from '../shared/config';
import { LanguagePair, ModelId, PhrasebookRecord, QuotaState } from '../shared/types';
import { getSettings, saveSettings, getQuotaState, getPhrasebook } from '../storage';

function formatPair(pair: LanguagePair): string {
  return `${pair.from} → ${pair.to}`;
}

export function App() {
  const [languagePair, setLanguagePair] = useState<LanguagePair>(DEFAULT_LANGUAGE_PAIR);
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [phrasebook, setPhrasebook] = useState<PhrasebookRecord[]>([]);

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      setLanguagePair(settings.languagePair);
      setModel(settings.model);
      setQuota(await getQuotaState());
      setPhrasebook(await getPhrasebook());
    })();
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
    <div className="w-96 max-h-[480px] overflow-y-auto p-4 space-y-4 bg-white text-gray-900">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Language Assistant</h1>
        <p className="text-sm text-gray-600">三连空格触发，逐句建议与替换。</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">Language pair</h2>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGE_PAIRS.map((pair) => (
            <button
              key={formatPair(pair)}
              onClick={() => handleLanguageChange(pair)}
              className={`px-3 py-1 rounded border text-sm ${
                languagePair.from === pair.from && languagePair.to === pair.to
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
              }`}
            >
              {formatPair(pair)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">Model</h2>
        <div className="flex gap-2">
          {SUPPORTED_MODELS.map((item) => (
            <button
              key={item}
              onClick={() => handleModelChange(item)}
              className={`px-3 py-1 rounded border text-sm ${
                model === item
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-1">
        <h2 className="text-sm font-medium text-gray-700">Quota</h2>
        {quota ? (
          <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <span>
              {quota.used}/{quota.limit} per day (UTC reset {new Date(quota.resetAt).toLocaleTimeString()} )
            </span>
            {quota.exceeded && <span className="text-red-600">超限</span>}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Loading quota…</p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Phrasebook (latest)</h2>
          <span className="text-xs text-gray-500">{phrasebook.length} / 50</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded border-gray-200 p-2 bg-gray-50">
          {phrasebook.length === 0 && (
            <p className="text-sm text-gray-500">暂无记录，触发生成后会出现在这里。</p>
          )}
          {phrasebook.map((item) => (
            <div key={item.id} className="rounded bg-white border border-gray-200 p-2 shadow-sm">
              <p className="text-sm text-gray-800">{item.rewritten}</p>
              <p className="text-xs text-gray-500 truncate">{item.userInput}</p>
              <div className="text-[11px] text-gray-500 flex gap-2 pt-1">
                <span>{new Date(item.timestamp).toLocaleString()}</span>
                {item.favorited && <span>★</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
