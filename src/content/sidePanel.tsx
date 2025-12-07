import React, { useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { LanguageFeedback } from '../shared/types';
import { getTranslations, type UiTranslations } from './i18n';

export type SidePanelCallbacks = {
  onReplace: (suggestion: string) => void;
};

type SidePanelState = {
  open: boolean;
  loading: boolean;
  feedback?: LanguageFeedback;
  translations: UiTranslations;
};

const panelStyles = `
  .lla-panel {
    position: fixed;
    top: 16px;
    right: 0;
    width: 360px;
    max-height: calc(100vh - 32px);
    background: #fff;
    border-left: 1px solid #e5e7eb;
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'Inter', 'HarmonyOS Sans', system-ui, -apple-system, sans-serif;
  }
  .lla-panel.hidden {
    display: none;
  }
  .lla-panel-content {
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 12px;
    overflow-y: auto;
    max-height: calc(100vh - 96px);
  }
  .lla-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px 8px;
    border-bottom: 1px solid #f3f4f6;
  }
  .lla-panel-title {
    font-weight: 600;
    font-size: 14px;
    color: #111827;
  }
  .lla-panel-close {
    background: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    font-size: 12px;
  }
  .lla-panel-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .lla-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .lla-section-title {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
    font-weight: 600;
  }
  .lla-muted {
    margin: 0;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.5;
  }
  .lla-suggestion {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }
  .lla-focus-list {
    display: grid;
    gap: 8px;
  }
  .lla-focus-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 10px;
    background: #f9fafb;
  }
  .lla-focus-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .lla-tag {
    background: #e5e7eb;
    border-radius: 999px;
    padding: 2px 8px;
    font-size: 12px;
    color: #374151;
  }
  .lla-tag-strong {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .lla-arrow {
    color: #6b7280;
    font-size: 12px;
  }
  .lla-list {
    margin: 0;
    padding-left: 16px;
    color: #111827;
    font-size: 13px;
    display: grid;
    gap: 4px;
  }
  .lla-alt-list li {
    list-style-type: disc;
  }
  .lla-panel-actions {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #f3f4f6;
    background: #fff;
  }
  .lla-btn {
    flex: 1;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #111827;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    cursor: pointer;
  }
  .lla-btn-primary {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
  }
  .lla-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

type PanelProps = {
  open: boolean;
  loading: boolean;
  feedback?: LanguageFeedback;
  translations: UiTranslations;
  onReplace: () => void;
  onClose: () => void;
  onSave: () => void;
};

function SidePanel({
  open,
  loading,
  feedback,
  translations,
  onReplace,
  onClose,
  onSave,
}: PanelProps) {
  useEffect(() => {
    if (document.getElementById('lla-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'lla-panel-styles';
    style.textContent = panelStyles;
    document.head.appendChild(style);
  }, []);

  if (!open) return null;

  return (
    <div className="lla-panel" role="complementary" aria-label={translations.panelTitle}>
      <div className="lla-panel-header">
        <span className="lla-panel-title">{translations.panelTitle}</span>
        <button className="lla-panel-close" onClick={onClose}>
          {translations.close}
        </button>
      </div>

      <div className="lla-panel-content">
        <div className="lla-panel-body">
          {loading && <p className="lla-muted">{translations.loading}</p>}

          {!loading && feedback && (
            <>
              <section className="lla-section">
                <h3 className="lla-section-title">{translations.original}</h3>
                <p className="lla-muted">{feedback.input}</p>
              </section>

              <section className="lla-section">
                <h3 className="lla-section-title">{translations.suggestion}</h3>
                <p className="lla-suggestion">{feedback.suggestion}</p>
              </section>

              <section className="lla-section">
                <h3 className="lla-section-title">{translations.focus}</h3>
                <div className="lla-focus-list">
                  {feedback.focus_points.map((item) => (
                    <div className="lla-focus-card" key={`${item.source}-${item.target}`}>
                      <div className="lla-focus-row">
                        <span className="lla-tag">{item.source}</span>
                        <span className="lla-arrow">→</span>
                        <span className="lla-tag lla-tag-strong">{item.target}</span>
                      </div>
                      <p className="lla-muted">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="lla-section">
                <h3 className="lla-section-title">{translations.explanation}</h3>
                <ul className="lla-list">
                  {feedback.explanation.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>

              <section className="lla-section">
                <h3 className="lla-section-title">{translations.alternatives}</h3>
                <ul className="lla-list lla-alt-list">
                  {feedback.alternatives.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>

        <div className="lla-panel-actions">
          <button className="lla-btn lla-btn-primary" onClick={onReplace} disabled={!feedback}>
            {translations.replace}
          </button>
          <button className="lla-btn" onClick={onSave}>
            {translations.save}
          </button>
          <button className="lla-btn" onClick={onClose}>
            {translations.close}
          </button>
        </div>
      </div>
    </div>
  );
}

export class SidePanelController {
  private container: HTMLDivElement;
  private root: Root;
  private callbacks: SidePanelCallbacks;
  private state: SidePanelState;

  constructor(callbacks: SidePanelCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.id = 'lla-panel-root';
    document.body.appendChild(this.container);

    this.root = createRoot(this.container);
    this.state = {
      open: false,
      loading: false,
      translations: getTranslations('en'),
    };

    this.render();
  }

  showLoading(translations: UiTranslations): void {
    this.state = { open: true, loading: true, feedback: undefined, translations };
    this.render();
  }

  renderFeedback(feedback: LanguageFeedback, translations: UiTranslations): void {
    this.state = { open: true, loading: false, feedback, translations };
    this.render();
  }

  close(): void {
    this.state = { ...this.state, open: false };
    this.render();
  }

  private handleReplace(): void {
    if (this.state.feedback) {
      this.callbacks.onReplace(this.state.feedback.suggestion);
    }
  }

  private handleSave(): void {
    console.log('[LLA] Save to Phrasebook clicked');
  }

  private render(): void {
    this.root.render(
      <SidePanel
        open={this.state.open}
        loading={this.state.loading}
        feedback={this.state.feedback}
        translations={this.state.translations}
        onReplace={() => this.handleReplace()}
        onClose={() => this.close()}
        onSave={() => this.handleSave()}
      />
    );
  }
}
