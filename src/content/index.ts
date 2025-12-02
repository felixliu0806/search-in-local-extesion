import { DEFAULT_LANGUAGE_PAIR, DEFAULT_MODEL } from '../shared/config';
import {
  AnalyzeRequest,
  LanguagePair,
  ModelId,
  SentenceSuggestion,
} from '../shared/types';

const BUTTON_ID = 'lla-caret-trigger';
const DEBOUNCE_MS = 800;
const BUTTON_EDGE_MARGIN = 8;
const LOG_PREFIX = '[LLA]';

let activeElement: HTMLElement | null = null;
let languagePair: LanguagePair = DEFAULT_LANGUAGE_PAIR;
let model: ModelId = DEFAULT_MODEL;
let triggerButton: HTMLButtonElement | null = null;
let debounceTimer: number | null = null;

function log(message: string, data?: unknown): void {
  try {
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
    const unsupported = [
      'button',
      'submit',
      'reset',
      'checkbox',
      'radio',
      'file',
      'hidden',
    ];
    return !unsupported.includes(type);
  }
  return false;
}

function findEditableElement(): HTMLElement | null {
  let el: Element | null = document.activeElement;

  // 处理shadow DOM
  while (el && (el as HTMLElement).shadowRoot) {
    const shadowActive = (el as HTMLElement).shadowRoot?.activeElement;
    if (!shadowActive || shadowActive === el) break;
    el = shadowActive;
  }

  if (el instanceof HTMLElement && isEditableElement(el)) {
    return el;
  }

  return null;
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
  btn.style.width = '36px';
  btn.style.height = '32px';
  btn.style.textAlign = 'center';
  btn.style.lineHeight = '32px';
  btn.title = '查看优化表达';

  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleTriggerClick();
  });

  if (document.body) {
    document.body.appendChild(btn);
  }
  
  return btn;
}

function getTriggerButton(): HTMLButtonElement {
  if (!triggerButton) {
    triggerButton = createTriggerButton();
  }
  return triggerButton;
}

function positionButton(): void {
  if (!activeElement) return;
  
  const btn = getTriggerButton();
  // 使用固定尺寸，避免每次重新计算导致的抖动
  const btnWidth = 36;
  const btnHeight = 32;
  
  // 获取元素相对于视口的位置
  const rect = activeElement.getBoundingClientRect();
  
  // 计算按钮位置（相对于视口）
  let top: number;
  
  // 根据元素类型调整按钮位置
  if (activeElement.tagName.toLowerCase() === 'input') {
    // 对于input，按钮垂直居中对齐，上下留同样空白
    top = rect.top + (rect.height - btnHeight) / 2;
  } else {
    // 对于textarea和其他元素，按钮定位在右下角，离底部8px
    top = rect.bottom - btnHeight - 8;
  }
  
  let left = rect.right - btnWidth - 4;
  
  // 确保按钮在视窗内
  const maxLeft = window.innerWidth - btnWidth - BUTTON_EDGE_MARGIN;
  if (left > maxLeft) left = maxLeft;
  if (left < BUTTON_EDGE_MARGIN) left = BUTTON_EDGE_MARGIN;
  if (top < BUTTON_EDGE_MARGIN) top = BUTTON_EDGE_MARGIN;
  
  // 添加日志记录定位信息
  log('Positioning button', {
    elementRect: rect,
    btnWidth,
    btnHeight,
    calculatedTop: top,
    calculatedLeft: left,
    finalTop: top,
    finalLeft: left,
    activeElement: activeElement.tagName || 'null'
  });
  
  btn.style.top = `${top}px`;
  btn.style.left = `${left}px`;
}

function showButton(): void {
  if (!activeElement) {
    log('showButton: no active element');
    return;
  }
  
  const text = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement 
    ? activeElement.value 
    : activeElement.textContent || '';
  
  log('showButton: checking text content', { textLength: text.length, hasText: !!text.trim(), element: activeElement.tagName });
  
  if (!text.trim()) {
    log('showButton: empty text, hiding button');
    hideButton();
    return;
  }
  
  const btn = getTriggerButton();
  log('showButton: showing button');
  positionButton();
  btn.style.display = 'inline-flex';
  
  // 开始观察元素大小变化
  resizeObserver.observe(activeElement);
}

function hideButton(): void {
  const btn = getTriggerButton();
  log('hideButton: hiding button');
  btn.style.display = 'none';

  // 停止观察元素大小变化
  if (activeElement) {
    resizeObserver.unobserve(activeElement);
  }
}

function debounceShowButton(): void {
  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    if (activeElement) {
      showButton();
    }
  }, DEBOUNCE_MS);
}

async function handleTriggerClick(): Promise<void> {
  if (!activeElement) {
    log('handleTriggerClick: no active element');
    return;
  }

  let text: string;
  let selectedText: string = '';

  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    // 对于input和textarea元素，使用selectionStart和selectionEnd获取选中的文本
    const start = activeElement.selectionStart || 0;
    const end = activeElement.selectionEnd || 0;
    selectedText = activeElement.value.substring(start, end);
    text = selectedText || activeElement.value;
    log('handleTriggerClick: input/textarea element', {
      start,
      end,
      selectedText,
      textLength: text.length,
    });
  } else if (activeElement.isContentEditable) {
    // 对于contenteditable元素，使用window.getSelection()获取选中的文本
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selectedText = selection.toString();
    }
    text = selectedText || activeElement.textContent || '';
    log('handleTriggerClick: contenteditable element', {
      selectedText,
      textLength: text.length,
    });
  } else {
    // 对于其他元素，使用文本内容
    text = activeElement.textContent || '';
    log('handleTriggerClick: other element', { textLength: text.length });
  }

  if (!text.trim()) {
    log('handleTriggerClick: empty text, returning');
    return;
  }

  log('handleTriggerClick: sending text for analysis', {
    selectedText: !!selectedText,
    textLength: text.length,
    fullText: text,
  });

  const request: AnalyzeRequest = {
    type: 'analyze-text',
    text,
    languagePair,
    model,
  };

  log('handleTriggerClick: created request object', { request });

  try {
    log('handleTriggerClick: sending message to background', {
      requestType: request.type,
      text: request.text,
    });
    // 使用setTimeout避免同步隐藏按钮导致消息通道关闭
    const response = await chrome.runtime.sendMessage(request);
    log('handleTriggerClick: received response from background', {
      type: response?.type,
    });

    if (response && response.type === 'analyze-result') {
      log('handleTriggerClick: received analyze-result response', {
        suggestionCount: response.suggestions.length,
      });
      const combined = response.suggestions
        .map((s: SentenceSuggestion) => s.rewritten)
        .join(' ');
      const finalText = combined || text;

      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        log('handleTriggerClick: updating input/textarea value');
        activeElement.value = finalText;
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (activeElement.isContentEditable) {
        log('handleTriggerClick: updating contenteditable text');
        activeElement.textContent = finalText;
      }
    } else if (response && response.type === 'error') {
      log('handleTriggerClick: received error response', {
        message: response.message,
      });
    }
  } catch (error) {
    log('handleTriggerClick: error sending message to background', {
      error: error instanceof Error ? error.message : String(error),
    });
    console.error('Analysis failed:', error);
  } finally {
    // 在finally块中隐藏按钮，确保无论是否成功都会执行
    setTimeout(() => {
      log('handleTriggerClick: hiding button after delay');
      hideButton();
    }, 100);
  }
}

function handleInput(): void {
  const editable = findEditableElement();
  if (editable) {
    activeElement = editable;
    debounceShowButton();
  } else {
    activeElement = null;
    hideButton();
  }
}

function handleFocusIn(): void {
  const editable = findEditableElement();
  if (editable) {
    activeElement = editable;
    debounceShowButton();
  }
}

function handleFocusOut(event: FocusEvent): void {
  const nextTarget = event.relatedTarget as HTMLElement | null;
  // If focus moves to the trigger button, keep the active element so clicks still work
  if (nextTarget && nextTarget.id === BUTTON_ID) {
    return;
  }
  activeElement = null;
  hideButton();
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    hideButton();
  }
}

function handleClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const btn = getTriggerButton();

  log('handleClick: event triggered', {
    target: target.tagName,
    targetId: target.id,
    btnContainsTarget: btn?.contains(target),
    eventPhase: event.eventPhase,
  });

  if (btn && !btn.contains(target)) {
    const editable = findEditableElement();
    if (editable) {
      // 如果点击的是当前活动元素，不需要重新显示按钮
      if (activeElement === editable) {
        log('handleClick: clicked on active editable element, returning');
        return;
      }
      log(
        'handleClick: clicked on new editable element, updating activeElement and showing button'
      );
      activeElement = editable;
      debounceShowButton();
    } else {
      log('handleClick: clicked on non-editable element, hiding button');
      hideButton();
    }
  } else {
    log('handleClick: clicked on trigger button, not hiding');
  }
}

async function loadSettings(): Promise<void> {
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

// 初始化事件监听
document.addEventListener('input', handleInput, true);
document.addEventListener('focusin', handleFocusIn, true);
document.addEventListener('focusout', handleFocusOut, true);
document.addEventListener('keydown', handleKeydown, true);
document.addEventListener('click', handleClick, true);

// 监听滚动事件，直接更新按钮位置
window.addEventListener(
  'scroll',
  () => {
    if (
      activeElement &&
      triggerButton &&
      triggerButton.style.display !== 'none'
    ) {
      log('scroll event: updating button position');
      positionButton();
    }
  },
  true
);

// 监听窗口大小变化
window.addEventListener(
  'resize',
  () => {
    if (
      activeElement &&
      triggerButton &&
      triggerButton.style.display !== 'none'
    ) {
      log('resize event: updating button position');
      positionButton();
    }
  },
  true
);

// 监听元素大小变化
const resizeObserver = new ResizeObserver((entries) => {
  if (
    activeElement &&
    triggerButton &&
    triggerButton.style.display !== 'none'
  ) {
    for (const entry of entries) {
      if (entry.target === activeElement) {
        log('resize observer: updating button position');
        positionButton();
        break;
      }
    }
  }
});

// 加载设置
loadSettings();

log('Language Learning Assistant content script loaded');
