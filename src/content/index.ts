import { getUserLanguagePreference } from '../shared/languagePreference';
import { LanguageFeedback } from '../shared/types';
import { getTranslations } from './i18n';

const BUTTON_ID = 'lla-caret-trigger';
const DEBOUNCE_MS = 800;
const BUTTON_EDGE_MARGIN = 8;
const LOG_PREFIX = '[LLA]';

let activeElement: HTMLElement | null = null;
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
  btn.style.position = 'absolute';
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

  // 将定位转换为文档坐标，保证按钮跟随输入框而不是视口
  top += window.scrollY;
  left += window.scrollX;
  
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
  // 检查按钮是否已经隐藏，避免重复调用
  if (btn.style.display === 'none') {
    return;
  }
  
  // 添加调用栈日志，以便追踪hideButton被调用的原因
  const stackTrace = new Error().stack;
  log('hideButton: hiding button', { stackTrace: stackTrace?.split('\n') });
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

  const languagePreference = await getUserLanguagePreference();
  const translations = getTranslations(languagePreference.nativeLanguage);

  // 打开标准侧边栏
  await chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });

  // 向侧边栏发送加载状态
  chrome.runtime.sendMessage({
    type: 'SHOW_LOADING',
    translations,
  });

  const requestPayload = {
    input: text,
    nativeLanguage: languagePreference.nativeLanguage,
    targetLanguage: languagePreference.targetLanguage,
  };

  try {
    const feedback = await requestLanguageFeedback(requestPayload);
    // 向侧边栏发送反馈数据
    chrome.runtime.sendMessage({
      type: 'SHOW_FEEDBACK',
      feedback,
      translations,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('handleTriggerClick: failed to get feedback', { error: errorMessage });
  } finally {
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

type LanguageRequestPayload = {
  input: string;
  nativeLanguage: string;
  targetLanguage: string;
};

function requestLanguageFeedback(payload: LanguageRequestPayload): Promise<LanguageFeedback> {
  log('requestLanguageFeedback: sending mock payload', payload);

  return new Promise((resolve) => {
    setTimeout(() => {
      const suggestion = payload.targetLanguage === 'en'
        ? 'I really love this product.'
        : '我很喜欢这个产品。';

      const feedback: LanguageFeedback = {
        input: payload.input,
        suggestion,
        focus_points: [
          {
            source: '很喜欢',
            target: 'really love',
            reason: "比 'like very much' 更自然",
          },
        ],
        explanation: [
          '“really love” 比 “like very much” 更口语化。',
          '表达感情色彩更强，适合社交场景。',
        ],
        alternatives: [
          "I'm a huge fan of this product.",
          'I absolutely adore this product.',
        ],
      };

      log('requestLanguageFeedback: resolved mock feedback');
      resolve(feedback);
    }, 500);
  });
}

function replaceActiveElementText(suggestion: string): void {
  if (!activeElement) {
    log('replaceActiveElementText: no active element');
    return;
  }

  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    activeElement.value = suggestion;
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  if (activeElement.isContentEditable) {
    activeElement.textContent = suggestion;
    return;
  }

  log('replaceActiveElementText: unsupported element type', activeElement.tagName);
}

// 初始化事件监听
document.addEventListener('input', handleInput, true);
document.addEventListener('focusin', handleFocusIn, true);
document.addEventListener('focusout', handleFocusOut, true);
document.addEventListener('keydown', handleKeydown, true);
document.addEventListener('click', handleClick, true);

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === 'REPLACE_TEXT') {
    replaceActiveElementText(message.suggestion);
    return true;
  }
  return false;
});

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

log('Language Learning Assistant content script loaded');
