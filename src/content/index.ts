import { DEFAULT_LANGUAGE_PAIR, DEFAULT_MODEL } from '../shared/config';
import { splitIntoSentences } from '../shared/sentence';
import { AnalyzeRequest, LanguagePair, ModelId, RuntimeMessage } from '../shared/types';

const BUTTON_ID = 'lla-caret-trigger';
const DEBOUNCE_MS = 600;
const BUTTON_OFFSET = 8;
const BUTTON_EDGE_MARGIN = 8;
const LOG_PREFIX = '[LLA]';

let activeElement: HTMLElement | null = null;
let languagePair: LanguagePair = DEFAULT_LANGUAGE_PAIR;
let model: ModelId = DEFAULT_MODEL;
let triggerButton: HTMLButtonElement | null = null;
let debounceTimer: number | null = null;

function log(message: string, data?: unknown): void {
  try {
    // eslint-disable-next-line no-console
    console.log(LOG_PREFIX, message, data ?? '');
  } catch {
    // ignore
  }
}

function isEditableElement(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (el.isContentEditable) return true;
  if (tag === 'textarea') return true;
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type;
    const unsupported = ['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'hidden'];
    return !unsupported.includes(type);
  }
  return false;
}

function findEditable(target: EventTarget | null): HTMLElement | null {
  let el = target as HTMLElement | null;
  while (el) {
    if (isEditableElement(el)) return el;
    const parent = el.parentElement;
    if (parent) {
      el = parent;
      continue;
    }
    const root = el.getRootNode();
    if (root && (root as ShadowRoot).host instanceof HTMLElement) {
      el = (root as ShadowRoot).host as HTMLElement;
      continue;
    }
    break;
  }
  return null;
}

function selectionInsideActive(editable: HTMLElement, selection: Selection | null): boolean {
  if (!selection || selection.rangeCount === 0) return false;
  const anchor = selection.anchorNode;
  if (!anchor) return false;
  if (editable.contains(anchor)) return true;
  const root = anchor.getRootNode();
  if (root && (root as ShadowRoot).host && editable.contains((root as ShadowRoot).host as Node)) return true;
  return false;
}

function getTextFromElement(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value;
  }
  return el.textContent ?? '';
}

function setTextToElement(el: HTMLElement, text: string): void {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  el.textContent = text;
}

function createTriggerButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.type = 'button';
  btn.textContent = '✨';
  btn.style.position = 'fixed';
  btn.style.zIndex = '2147483647';
  btn.style.padding = '6px 10px';
  btn.style.background = '#2563eb';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '999px';
  btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  btn.style.fontSize = '12px';
  btn.style.cursor = 'pointer';
  btn.style.userSelect = 'none';
  btn.style.display = 'none';
  btn.title = '查看优化表达';

  btn.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    triggerAnalysis();
    hideButton();
  });

  const mount = () => {
    if (!btn.isConnected && document.body) {
      document.body.appendChild(btn);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
  return btn;
}

function getTriggerButton(): HTMLButtonElement {
  if (triggerButton) return triggerButton;
  triggerButton = createTriggerButton();
  return triggerButton;
}

function getCaretRect(target: HTMLElement): DOMRect | null {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return getTextareaCaretRect(target);
  }
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(true);
  let rect = range.getBoundingClientRect();
  if (rect && rect.width === 0 && rect.height === 0) {
    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    range.insertNode(marker);
    rect = marker.getBoundingClientRect();
    marker.parentNode?.removeChild(marker);
    range.detach();
  }
  if (rect && rect.width === 0 && rect.height === 0) return null;
  log('caret rect (contenteditable)', rect);
  return rect;
}

function getTextareaCaretRect(el: HTMLInputElement | HTMLTextAreaElement): DOMRect | null {
  const start = el.selectionStart;
  if (start === null || start === undefined) return null;
  const style = window.getComputedStyle(el);
  const mirror = document.createElement('div');
  const rect = el.getBoundingClientRect();
  mirror.style.position = 'fixed';
  mirror.style.left = `${rect.left}px`;
  mirror.style.top = `${rect.top}px`;
  mirror.style.width = `${el.clientWidth}px`;
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.visibility = 'hidden';
  mirror.style.font = style.font;
  mirror.style.padding = style.padding;
  mirror.style.border = style.border;
  mirror.style.boxSizing = style.boxSizing;
  mirror.textContent = el.value.slice(0, start);
  const marker = document.createElement('span');
  marker.textContent = el.value.slice(start) || '\u200b';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const markerRect = marker.getBoundingClientRect();
  document.body.removeChild(mirror);
  log('caret rect (input/textarea)', markerRect);
  return markerRect;
}

function positionButton(rect: DOMRect): void {
  const btn = getTriggerButton();
  const btnWidth = btn.offsetWidth || 48;
  const btnHeight = btn.offsetHeight || 24;
  const top = rect.top + rect.height / 2 - btnHeight / 2;
  let left = rect.right + BUTTON_OFFSET;
  const maxLeft = window.innerWidth - btnWidth - BUTTON_EDGE_MARGIN;
  if (left > maxLeft) left = maxLeft;
  if (left < BUTTON_EDGE_MARGIN) left = BUTTON_EDGE_MARGIN;
  const finalTop = Math.max(top, BUTTON_EDGE_MARGIN);
  btn.style.top = `${finalTop}px`;
  btn.style.left = `${left}px`;
  log('positionButton', { top: btn.style.top, left: btn.style.left });
}

function showButtonNearCaret(): void {
  if (!activeElement) return;
  const text = getTextFromElement(activeElement);
  if (!text || text.trim().length === 0) {
    hideButton();
    return;
  }
  let rect = getCaretRect(activeElement);
  if (!rect) {
    const fallback = activeElement.getBoundingClientRect();
    rect = new DOMRect(fallback.right, fallback.bottom, 0, 0);
    log('fallback rect used', rect);
  }
  const btn = getTriggerButton();
  positionButton(rect);
  btn.style.display = 'inline-flex';
  log('showButtonNearCaret');
}

function hideButton(): void {
  const btn = getTriggerButton();
  btn.style.display = 'none';
  log('hideButton');
}

function scheduleButton(target: HTMLElement): void {
  activeElement = target;
  if (debounceTimer) window.clearTimeout(debounceTimer);
  log('scheduleButton', { tag: target.tagName, hasContent: !!getTextFromElement(target)?.trim() });
  debounceTimer = window.setTimeout(() => {
    if (!activeElement || !activeElement.isConnected) {
      log('scheduleButton skipped (detached)');
      return;
    }
    showButtonNearCaret();
  }, DEBOUNCE_MS);
}

function handleInput(event: Event): void {
  const editable = findEditable(event.target);
  if (!editable) return;
  const text = getTextFromElement(editable);
  if (text && text.trim().length > 0) {
    scheduleButton(editable);
  } else {
    hideButton();
  }
  log('handleInput', { tag: (editable as HTMLElement).tagName, length: text.length });
}

function handleFocusIn(event: FocusEvent): void {
  const editable = findEditable(event.target);
  if (!editable) return;
  activeElement = editable;
  const text = getTextFromElement(editable);
  if (text && text.trim().length > 0) {
    scheduleButton(editable);
  } else {
    hideButton();
  }
  log('handleFocusIn', { tag: editable.tagName, length: text?.length ?? 0 });
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    hideButton();
    return;
  }
  if (debounceTimer) window.clearTimeout(debounceTimer);
  hideButton();
}

function handleFocusOut(event: FocusEvent): void {
  if (activeElement === event.target) {
    hideButton();
    activeElement = null;
    if (debounceTimer) window.clearTimeout(debounceTimer);
    log('handleFocusOut');
  }
}

function handleClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  const btn = triggerButton;
  if (btn && target && (btn === target || btn.contains(target))) return;
  const editable = findEditable(event.target);
  if (editable) {
    activeElement = editable;
    const text = getTextFromElement(editable);
    if (text && text.trim().length > 0) {
      scheduleButton(editable);
    }
    log('handleClick editable', { tag: editable.tagName, length: text?.length ?? 0 });
    return;
  }
  hideButton();
  log('handleClick outside');
}

function handleSelectionChange(): void {
  if (!activeElement) return;
  const sel = document.getSelection();
  if (!selectionInsideActive(activeElement, sel)) {
    hideButton();
    return;
  }
  const text = getTextFromElement(activeElement);
  if (!text || text.trim().length === 0) {
    hideButton();
    return;
  }
  if (debounceTimer) window.clearTimeout(debounceTimer);
  log('handleSelectionChange', { tag: activeElement.tagName });
  debounceTimer = window.setTimeout(() => {
    showButtonNearCaret();
  }, DEBOUNCE_MS);
}

async function triggerAnalysis(): Promise<void> {
  if (!activeElement) return;
  const text = getTextFromElement(activeElement);
  const sentences = splitIntoSentences(text);
  if (!sentences.length) return;
  const request: AnalyzeRequest = {
    type: 'analyze-text',
    text,
    languagePair,
    model,
  };
  try {
    const response = (await chrome.runtime.sendMessage(request)) as RuntimeMessage;
    if (response && response.type === 'analyze-result') {
      const combined = response.suggestions.map((s) => s.rewritten).join(' ');
      setTextToElement(activeElement, combined);
    }
    if (response && response.type === 'error') {
      console.warn('Analysis failed:', response.message);
    }
  } catch (error) {
    console.error('Message send failed', error);
  }
}

async function hydrateSettings(): Promise<void> {
  try {
    const stored = await chrome.storage.local.get(['settings']);
    if (stored.settings) {
      languagePair = stored.settings.languagePair || DEFAULT_LANGUAGE_PAIR;
      model = stored.settings.model || DEFAULT_MODEL;
    }
  } catch (error) {
    console.warn('Failed to load settings, using defaults', error);
  }
}

document.addEventListener('input', handleInput, true);
document.addEventListener('focusin', handleFocusIn, true);
document.addEventListener('keydown', handleKeydown, true);
document.addEventListener('focusout', handleFocusOut, true);
document.addEventListener('click', handleClick, true);
document.addEventListener('selectionchange', handleSelectionChange);

hydrateSettings();
log('content script loaded');
