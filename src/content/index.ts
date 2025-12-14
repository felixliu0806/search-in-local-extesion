import { getUserLanguagePreference } from '../shared/languagePreference';
import { DEFAULT_LANGUAGE_PAIR } from '../shared/config';
import { LanguageFeedback } from '../shared/types';
import { getTranslations } from './i18n';

const BUTTON_ID = 'lla-caret-trigger';
const DEBOUNCE_MS = 800;
const LOG_PREFIX = '[LLA]';

let activeElement: HTMLElement | null = null;
let triggerButton: HTMLButtonElement | null = null;
let debounceTimer: number | null = null;
let lastEditableElement: HTMLElement | null = null;

// 婵犵數鍎戠徊钘壝洪敂鐐�宕查柛宀�鍋為崑銈夋煏婵炵偓娅嗛柣鎺曪拷璇ф嫹閵忥絾纭鹃柨鐔绘�勬�犳悂鐛�閿熶粙姊绘担鍦�婀介柛鏂跨灱閿熻姤鐔�閹风兘姊洪崫鍕舵嫹閿熶粙宕�閺夋埊鎷烽敓浠嬫偨閸涘﹥娅㈡繛瀵稿Т閿熸枻鎷锋俊鐐扮矙閹�姗�鎮欑捄杞版睏缂備礁锟藉�忔嫹閸濄儳锛濋梺鍛婂姈鐎笛咃拷姘筹拷鍕�绠鹃柨婵嗘噺缁�宀勬煕閹惧�哥畺閻庨潧銈搁弫鎾绘晸閿燂拷
let selectedTextInfo: {
  text: string;
  start: number;
  end: number;
} | null = null;

// 闂備浇宕垫慨鎶芥倿閿曪拷閿熷�愬灪閿熷�熷亹缁�濠勶拷骞垮劚閿熻棄锕ら悵姗�姊虹捄銊ユ瀺缂侊拷濞嗗繒鏆﹂柕澶涢檮閸庣喐绻濋棃娑氬⒊闁归�庡厴瀵�鍫曞箣閺冿拷閻庡�氭⒑閺傘儲娅呴柛鐕傛嫹缂備胶濮电敮锟犲蓟閳╁啯濯撮柛婵勫劚閳�鐢告⒑鐠恒劌鏋欐俊锟介崟锟介弫鎾绘寠婢舵稑浼愰梻鍌氭噺閿曘垽寮婚妸銉㈡�堟俊锟介懖鈺佸П濠电偞娼欓惃鐑藉疾閻樿尙鏆︽俊銈忔嫹闁跨喎锟芥劕鍔氭繛灞傚�栨穱濠冪�掔�ｏ拷閻撶喖鏌熼弶鍨�绨婚柟宄板槻閳藉�娾枎鎼达拷娑撱垹鈹戦悩锟介崹鐓庘枖濞戞�兼殾闁跨喍绮欓弻鐔兼晸閽樺）鏃堝川閿熺晫鐚惧�ュ�嬬厽婵★拷閾忕櫢绱為梺闈涙�楅敃锟介柡灞剧洴婵＄柉锟藉秵绂掑�婂牊鐓ユ繝鍨�鎸荤�氾拷
let lastSelectionInfo: { start: number; end: number } | null = null;

// 婵犵數鍎戠徊钘壝洪敂鐐�宕查柛宀�鍋為崑銈夋煏婵炵偓娅嗛柛瀣ㄥ姂閺屾洘绻涢崹锟介敓鑺ワ拷鍛�鍤屽Δ锝呭暞閻撴盯鏌涢妷锝呭�奸柨鐔虹崵閸愶拷閺嗭箓鏌＄仦璇插姕闁稿骸绉归弻娑㈠即閿熶粙骞忛柨瀣�绠鹃棅锟介敓浠嬪础閸愯�ф嫹閿熻姤绂掔�ｏ拷閻愬﹦鎲稿�ュ洦鏆滄俊銈呭暟绾惧ジ寮堕崼姘�娅呯�涙繈姊虹涵鍛�鑵归柛妤佸▕瀵�濠氬川閿熻棄锟芥澘瀚�瀵板嫭鎯旈垾宕囩暠婵犵數鍎戠徊钘壝洪悩璇茬�堟繝闈涙搐閿熻棄銈稿畷銊э拷娑櫳戝▍鏍�姊洪棃鈺傚�瑰┑鐘绘涧濡�娑㈠Χ閿熻棄鈹戦悙鑸靛涧缂佽弓绮欓幃妯衡攽鐎ｏ拷閸屻劑鏌熼幑鎰�鐓愰柨鐔诲Г閸旀瑩骞冮埡鍐ф勃闁稿本鐟﹀��锟介梻鍌欒兌缁�锟介悽锟介敓鐣岀磽閸屾稒鐨戠�碉拷瑜斿畷姗�鏁撴禒瀣�绠犳俊銈呮噹缁狅綁鏌熼悜妯烩拻闁跨喐鍨濈划娆撳蓟閻斿吋鈷愰柟甯�鎷风紒娑樼箳缁辨帡骞夌�ｏ拷鐎氾拷
let replacementTarget: {
  element: HTMLElement;
  selection: {
    start: number;
    end: number;
  };
} | null = null;

function persistReplacementTarget(target: typeof replacementTarget): void {
  replacementTarget = target;
  try {
    (window as any).__llaReplacementTarget = target;
    if (target?.element) {
      lastEditableElement = target.element;
    }
  } catch {
    // ignore persistence failures
  }
}

function log(message: string, data?: unknown): void {
  try {
    console.log(LOG_PREFIX, message, data ?? '');
  } catch {
    // ignore
  }
}

function captureSelectionSnapshot(element: HTMLElement | null): { text: string; start: number; end: number } | null {
  if (!element) return null;

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? element.value.length;
    const text =
      start !== end && element.value
        ? element.value.substring(start, end)
        : element.value || '';
    const finalStart = text ? start : 0;
    const finalEnd = text ? end : element.value.length;
    return {
      text,
      start: finalStart,
      end: finalEnd,
    };
  }

  if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!element.contains(range.commonAncestorContainer)) {
        return null;
      }
      const selectedText = selection.toString();
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const start = preCaretRange.toString().length;
      const end = start + selectedText.length;
      const baseText = element.textContent || '';
      const finalText = selectedText || baseText;
      const finalStart = selectedText ? start : 0;
      const finalEnd = selectedText ? end : finalText.length;
      return {
        text: finalText,
        start: finalStart,
        end: finalEnd,
      };
    }
    const fallback = element.textContent || '';
    if (fallback) {
      return {
        text: fallback,
        start: 0,
        end: fallback.length,
      };
    }
  }

  const textContent = element.textContent || '';
  if (textContent) {
    return {
      text: textContent,
      start: 0,
      end: textContent.length,
    };
  }

  return null;
}

function updateSelectionCache(snapshot: { text: string; start: number; end: number } | null): void {
  if (!snapshot) return;
  selectedTextInfo = snapshot;
  lastSelectionInfo = { start: snapshot.start, end: snapshot.end };
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

  // 婵犵數濮伴崹鐓庘枖濞戞熬鎷峰�樼偓瀚归梻浣烘�㈤幏宄扳攽閳╁啯鏁゛dow DOM
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
  btn.textContent = '';
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
  btn.title = 'View suggestions';

  btn.addEventListener('pointerdown', (event) => {
    // Prevent focus stealing so the selection remains before click handler runs
    event.preventDefault();
    event.stopPropagation();
    const editable = findEditableElement() || activeElement || lastEditableElement;
    updateSelectionCache(captureSelectionSnapshot(editable));
  });

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
  // 婵犵數鍋犻幓锟界紓宥忔嫹濠电偛锟藉��绀嬬�碉拷閿熶粙鏌曢崼婵撴嫹婵犲嫬锟界偤姊洪崨濠勭畵閻庢熬鎷烽梺鍝勬�旈崡鎶藉箖濡�璺ㄧ杸闁规儳鐡ㄩ崕鎾绘⒑鐠恒劌鏋嶇紒锟藉▎蹇ユ嫹閼规澘鍚规俊鍙夊姇閳规垹锟斤綇鎷烽柣鎺戙偢閺屾盯鏁撴禒瀣�鏅稿ù鐘诧拷锟介崒銊╂煏閸�婵囧晽闁圭儤娲滈悿锟介梺鍝勫暞閹歌崵锟芥艾缍婇弻銊╂偄閸濆嫅銏＄箾閸涳拷閸ㄤ粙寮婚敓鐘茬＜婵炴垶锕�閹烽攱绂掔�ｏ拷閺呮悂鏌￠崒妯猴拷妤冨�曢崸妤佺厽闁挎繂鐗嗛崥褰掓煥閻旂�跨亰缂佽尙绮�缁旂喖宕奸妷銉ユ優閻熸粍妫冮獮鍡涘礃閿熻棄鐣烽悢鍏兼櫢闁兼亽鍎查崣蹇涙煕閿熶粙濡烽妷褝鎷锋径鎰�鐓ラ柣鏇炲�圭�氾拷
  const btnWidth = 36;
  const btnHeight = 32;

  // 闂傚倷绀侀崥瀣�宕曢幎钘夊簥闁艰壈缈版禍褰掓煕閵夛拷閹烽�庯拷瑙勬礃閿熻棄鎳庣粈鍐�鏌ㄩ悢鐑樻珪缂侊拷閸�婵堟殕闁告洩鎷烽柛搴℃捣缁辨帞锟斤綇鎷烽悘蹇撴嚇楠炲繘鎮滈懞銉у姷濠电偞鍨舵穱鐑樼珶濮楋拷閺岋綁鎮㈤崫銉﹀櫑濠碘槄鎷锋俊銈呭�ㄦ禍瑙勭箾閹存瑥鐏�闁稿骸绉归弻娑㈠即閿熶粙骞忔�嬪海纾界�广儱鎳忛崳鐣岀磼鏉堛劍锟藉啴寮�閹剧粯鏅搁柨鐕傛嫹
  const rect = activeElement.getBoundingClientRect();
  
  // 闂備浇宕垫慨宕囨�㈤妶鍥�锟芥劙寮撮姀鈥充患婵犵數濮甸懝鍓х不閺夊尅鎷烽姀锝呯厫闁告梹鐗滄禍鎼佹晝閿熶粙婀侀梺鎸庣箓閹虫劘鍊撮梻浣圭湽閸婃洖螞濠靛��鏋佺�广儱锟藉﹪鍞堕梺闈涢獜缁辨洟濡堕弻銉︾厽閹艰揪绲鹃弳锟介梺璺ㄥ枙婵�銈囩矙閹剧粯鍤屽Δ锝呭暞閸嬧剝绻涢崱妤冪�查柨鐔诲Г閿熻棄瀚ㄦ禍瑙勭箾閹存瑥鐏�闁哄拑鎷烽梻浣芥硶閸ｏ箓骞忛敓锟�
  let top: number;
  
  // 闂傚倷绀侀幖锟界紒澶屽厴閺佹捇鎸婃径濠忔嫹閿熺晫绱掓笟濠勭暤闁哄本绋栫粻娑㈠箻閾忥拷濞堝墎绱撴笟濠冨�归悗鐧告嫹闁跨喍绮欓幃锟介柛鎾楀嫬鐝伴梺鑲┿�嬮幏鐑芥煥閻斿墎鐭欓柨鐔绘�勭�涒晝锟芥熬鎷烽梻浣告啞閸斿繘寮插�婂啠鏋斿┑鐘崇�嶉悡娆戠磼鐎ｏ拷鐏忓懘骞忛悜钘夌疀闁跨喓鏅�娴滄悂鏁冮敓浠嬫箒闂佹寧绻傞幊鎰�鍊撮梻浣圭湽閸娧囧箯閿燂拷
  if (activeElement.tagName.toLowerCase() === 'input') {
    // 闂備浇锟藉弶鎹ｉ柡浣革拷姘�鏅搁柤鎭掑劤閵嗘帡鏌ら崷锟界粚鐠秔ut闂傚倷鐒︾�笛呯矙閹达箑瀚夐柨鐔剁矙閹�妤呭垂閿熺晫鍒掗幘璇茶摕闁挎洖鍊归弲绋棵归悩璇ф嫹閿熶粙宕归崒鐐寸厱閻忕偛澧介惌瀣�绱掗幘鍛�瀚归梻浣斤拷鑼�绠抽柛瀣�鐩�楠炲﹤锟姐儱锟藉��娈橀梺鐟帮拷绋匡拷鎾�骞忛悜鑺ワ拷鍐ㄢ槈濮樻瘷銊х磽閸屾氨孝闁绘�佹崌瀵�锟界�广儱娲ｅ▽锟介梺鍏肩ゴ閺呮繈骞夐敓钘夆攽閻愭潙鐏﹂柟鍛婃倐閺佹捇寮�閵堝棗锟藉綊姊洪崫鍕�锛旈柟椋庡厴濮婃椽宕ㄦ繝鍛�锟芥﹢鏌￠崼锟介幏鐑芥⒑缂佹﹫鎷烽崟锟介崥锟界紓渚婃嫹婵�妯垮煐閹�鐐烘偡濞嗗繐锟芥悂骞忛悜鑺ユ櫢闁跨噦鎷�
    top = rect.top + (rect.height - btnHeight) / 2;
  } else {
    // 闂備浇锟藉弶鎹ｉ柡浣革拷姘�鏅搁柤鎭掑劤閵嗘帡鏌ら崷锟界粣淇�xtarea闂傚倷绀侀幉锛勫垝瀹�鍕�鍤愰柨鐔剁矙閺屾稑鈻庨幋婵呭�曠紓浣稿�圭敮鈥筹拷锟介崐鐕傛嫹瀹ュ洦鏆滄俊銈呭暟绾惧ジ寮堕崼姘�娅呴柨鐔绘�勯敓钘夋啞閿熻姤鍔曢埞鎴狅拷锝忔嫹缂佺姵婢橀敓濮愬灱閸╂牠宕濋弽锟芥禍鎼佹晝閸屾稑锟界敻鎮峰▎蹇擄拷锟介柣鎿勬嫹缂傚倸鍊哥粔鎾�骞婂Ο铏规殾闁绘垼妫勬儫闂侀潧锟藉牆鍔ら柨鐔稿灊缁�渚�鍩ユ径鎰�绠荤紒娑滐拷鍕�锟藉綊鏌ㄩ悢鍓佺煓闁轰焦鎹囬幊鐐哄Ψ閵夆晛娈濈紓鍌欐祰妞村摜鎹㈤崟锟介崚鎺旓拷锝忔嫹闁归�庡█閹崇娀鏁撻懞銉р攳婵炶�ф嫹婵�濠冩そ閺佹挻绂掔�ｏ拷閺呮悂鏌ㄩ悤鍌涘��8px
    top = rect.bottom - btnHeight - 8;
  }

  let left = rect.right - btnWidth - 4;

  // 闂備浇锟借尙绠扮紒缁樺姇铻炴俊銈呮噺閸嬧晠鏌ｉ幇鑸靛�归梺鐟板槻閹冲酣鏁撴慨鎰�鍔氶柣妤�锕︾划濠囨晸娴犲��鈷戦柛锔兼嫹婵炲懌鍨介獮蹇撶暋閹佃櫕锟藉牓鏌熼幑鎰�纭鹃柛鏂匡拷锟介弻锛勶拷锝忔嫹闁哥噦鎷烽梺璺ㄥ枙婵�銈夋晸閽樺�涙嫹閿熶粙宕氶悧鍫㈢�鹃柛蹇曘�嬮幏鐑藉川閿熶粙宕橀敓浠嬫⒑閹肩偛鍔﹂柨鐔绘�勫ù鐑芥晸閽樺�涙嫹婵炴��閰ｅ畷鍫曞Ω瑜忛悾楣冩⒑娴兼瑧鐣遍柨鐔诲Г閸旀洜绮婚弶鍖℃嫹閵忥絽鐓愰柛鏃�鐗滄禍鎼佹晝閸屾稑浠�闂佹儳绻掗幊鎾诲几濞戞瑧绠鹃柛锟藉☉妯间痪濠电偟鍘х换姗�鐛�濮楋拷瀹曟﹢骞撻幒鎾圭发濠电姷锟芥ê澧查柨鐔告灮閹烽攱淇婇敓钘夛拷濠傜墛閺呮悂鏌﹀Ο鐚存嫹婵犲繑瀚归柡鍐ㄥ�荤粻鏂匡拷銏ｅ煐閸旀洟宕ｆ繝鍥ㄧ叆闁绘梻鍎ゅ▍鏇㈡煙閸欏�嬪唉鐎规洖宕�铻栭柨鐔烘櫕缁辩偤鏁撻敓锟�
  top += window.scrollY;
  left += window.scrollX;
  
  // 濠电姷鏁搁崕鎴犵礊閿熶粙鏌ㄩ悢璇残撶憸鏉垮暣閺佹捇鎮剧仦鎴掓�愰悗纰夋嫹闁跨喍绮欓弻鏇熷緞閸�婵嗗Б缂備胶濮撮悥濂稿箖鐟欏嫭濯撮悷娆忓��閸戯紕绱撻崒姘毙㈢紒澶婄埣閺佹捇宕愰悤鍌涘�归柛鏇�鎷烽柣鎿勬嫹缂傚倸鍊哥粔鎾�骞婅箛鏇犵煔闂侊拷瀹ュ懐鍔撮梺鍛婂壃閸涳拷閿熸枻鎷�
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
  
  const rawText = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement 
    ? activeElement.value 
    : activeElement.textContent;
  const text = typeof rawText === 'string' ? rawText : '';
  
  const hasText = text && typeof text === 'string' ? text.trim().length > 0 : false;
  log('showButton: checking text content', { textLength: text.length, hasText, element: activeElement.tagName });
  
  if (!hasText) {
    log('showButton: empty text, hiding button');
    hideButton();
    return;
  }
  
  const btn = getTriggerButton();
  log('showButton: showing button');
  positionButton();
  btn.style.display = 'inline-flex';
  
  // 闂佽�叉捣閿熻棄锟藉��锟藉綊姊虹捄銊ユ灆濠碉拷閵堝�婄疄闁靛ě宥嗗�归柨婵嗙箲鐎氬綊姊虹捄銊ユ灆婵★拷閸曪拷瀹曟劙骞栨担鐟板壃闂佺�跨灱閸嬫稓绮堥崒鐐寸厱闁规媽鍩栫�氬湱绱撴笟濠冨�归柣蹇曞仦閸庡磭娆㈤悙鍨�鍠愮�广儱锟藉��鍓�闂佽法鍠嶇划娆撳蓟濞戞ǚ鏋庨柟锟介崙銈嗗�归梺璇叉捣閿熻棄锟藉��锟斤拷
  resizeObserver.observe(activeElement);
}

function hideButton(): void {
  const btn = getTriggerButton();
  // 濠电姷锟芥ɑ锟藉嫰骞忛悜鑺ョ叆闁绘柨澧庨惌娆戯拷纰夋嫹濠电姵鑹惧敮闂佹寧娲╅幏鐑芥煟閿曪拷閿熻姤纰嶉埛鎴︽煛閸屾ê锟芥牜锟芥艾缍婂�婃椽宕�閸曪拷閿熻姤鎮傞獮蹇涙倻閼恒儳鍘卞┑锟藉Ο鍝勨挃闁伙綁浜堕弻娑㈠箣閿熺晫妲愰弴鐘筹拷鎰板箳閺囩姷鏉稿┑鐐村灦閻熼亶骞忛悜鑺ユ櫜濠㈣泛锟斤拷閻у嫰妫呴敓浠嬪炊閵夈儱濮㈢紓渚婃嫹濠㈣埖鍔栭埛鎴︽煥閻斿墎鐭欑�规洖缍婇弫鎾寸�掔�ｏ拷閸屻劑鏌曢崼婵撴嫹鐎ｏ拷閸樻帡鎮楅獮鍨�鍔氶柟閿嬪灴楠炲繐鐣＄敮锟介幏鐑藉Ψ閵壯冣叡濠电偛鐗嗛悥濂稿蓟閿濆�嬫櫢濞寸姴锟斤拷閺呮悂鏌ㄩ悤鍌涘��
  if (btn.style.display === 'none') {
    return;
  }
  
  // 濠电姷鏁搁崕鎴犵礊閿熶粙鏌ㄩ悢璇残撶憸鏉垮暣閺佹捇鎮剧仦鎴掓埛闂佺懓鍤栭幏鐑芥⒑閸涘﹤濮ч柟椋庡厴閺屸剝鎷呴棃娑虫嫹濠靛棴鎷烽敓鑺ョ�掔�ｏ拷闁卞洭鏌ｉ弮鍫熶氦缂佽鲸宀稿Λ鍛存晸娴犲��鐐婇柨鐔剁矙閺佹捇鎸婃径娑欏�归柨鐔烘櫕缁�鍫熷緞婵炴帒缍婇幃鈺呮晸娴犲��纾块柟纰夋嫹缂侊拷濮樿埖鍤嬮柛锟介敓鑺ョ�嶉妶澶嬬厱濠电姴瀚�閺嬫盯鏌涢妶鍛�宕眎deButton闂備浇宕甸崑鐐烘偄閿熶粙鏌熸�嬪骸鍘撮柟锟介崷锟介敓鏂ょ秶閹风兘鏌涢悢璺哄祮鐎碉拷閿熶粙鏌曢崼婵撴嫹鐎ｏ拷閸擄拷闂備礁鎲″ú鈺呭箯閻戣姤鍋ㄩ柨鐔剁矙閺佹挻绂掔�ｏ拷閻撴洟鏌曟径娑欏�归梺鐟板殩閹凤拷
  const stackTrace = new Error().stack;
  log('hideButton: hiding button', { stackTrace: stackTrace?.split('\n') });
  btn.style.display = 'none';

  // 闂傚倷鑳堕敓钘夊皡閹风兘鏁撻悾灞藉灊鐎广儱锟藉��娅㈡繝纰夋嫹闁瑰府鎷烽柣蹇涗憾閺屻劑鎮㈢紒姗堟嫹閸曪拷瀹曟劙骞栨担鐟板壃闂佺�跨灱閸嬫稓绮堥崒鐐寸厱闁规媽鍩栫�氬湱绱撴笟濠冨�归柣蹇曞仦閸庡磭娆㈤悙鍨�鍠愮�广儱锟藉��鍓�闂佽法鍠嶇划娆撳蓟濞戞ǚ鏋庨柟锟介崙銈嗗�归梺璇叉捣閿熻棄锟藉��锟斤拷
  if (activeElement) {
    resizeObserver.unobserve(activeElement);
  }
  
  // 闂傚倷绀侀幉锟犳偡闁�宥呯��闂佸灝锟斤拷缁犻箖鏌熼幑鎰�鐝�闁搞倕娲︾换娑㈠川閿熶粙鏌婇敐澶婅摕闁告冻鎷风�垫澘瀚�瀵板嫭鎯旈垾宕囩暠婵犵數鍎戠徊钘壝洪悩璇茬�堟繝闈涙搐閿熻棄銈稿畷銊э拷娑櫳戝▍鏍�鏌ｈ箛鏇炰哗闁稿��鍔欓幃宄扳攽閸モ晝锟介箖鏌熼幑鎰�鐝�闁搞倕娲︾换娑㈠川閿熶粙鏌婇敐鍜冩嫹閿熶粙骞橀敓浠嬬嵁閹帮拷閹�鏃堝灳瀹曞洤鎼搁梻鍌欒兌閸庣敻寮查敓浠嬫煙妞嬪骸鍘撮柡灞革拷绛规嫹閵夈儳绠查悗姘炬嫹
  selectedTextInfo = null;
  // replacementTarget 婵犵數鍋炲�兼瑩宕ョ�ｏ拷閹虫繈骞嗚�濋懓鍧楁煥閻斿墎鐭欓柡宀嬬節瀹曞爼濡搁妷锟介幏鐤�锟藉秹鎮鹃悜鑺ュ殤闁跨喍绮欓弫鎾绘偩鐏炴儳娈岄梺鍝勭墳閹风兘姊洪幖鐐插�界�癸拷缁嬭法鏆﹂柕澶涢檮閸庣喖鏌曡箛銉﹀�归梺璺ㄥ枙濡�鍕�鏁撻懞銉э拷宥夊煕閺冨牊鐓ラ柣鏇炲�圭�氾拷
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
  const runtimeReady = hasRuntimeMessaging();
  if (!runtimeReady) {
    log('handleTriggerClick: runtime unavailable, abort', {
      hasChrome: typeof chrome !== 'undefined',
      hasRuntime: !!chrome?.runtime,
      hasSendMessage: typeof chrome?.runtime?.sendMessage === 'function',
      runtimeId: chrome?.runtime?.id,
    });
    return;
  }
  if (!activeElement) {
    log('handleTriggerClick: no active element');
    return;
  }

  updateSelectionCache(captureSelectionSnapshot(activeElement));

  let text: string = '';
  let selectedText: string = '';
  let start: number = 0;
  let end: number = 0;
  // 娣囷拷婢讹拷 chrome.runtime.getFrameId 缁�璇茬�烽柨娆掞拷锟介敍灞煎▏閻�銊ц��閸ㄥ��鏌囩懛锟�
  const frameId = typeof (chrome.runtime as any).getFrameId === 'function'
    ? (chrome.runtime as any).getFrameId()
    : 0;


  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    start = activeElement.selectionStart || 0;
    end = activeElement.selectionEnd || 0;
    selectedText = activeElement.value.substring(start, end);
    const finalText = selectedText || activeElement.value;
    const finalStart = selectedText ? start : 0;
    const finalEnd = selectedText ? end : activeElement.value.length;
    text = finalText;
    log('handleTriggerClick: input/textarea element', {
      start: finalStart,
      end: finalEnd,
      selectedText,
      textLength: finalText.length,
    });
    selectedTextInfo = {
      text: finalText,
      start: finalStart,
      end: finalEnd,
    };
    lastSelectionInfo = { start: finalStart, end: finalEnd };
  } else if (activeElement.isContentEditable) {
    const cachedSelection = selectedTextInfo;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selectedText = selection.toString();
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(activeElement);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      start = preCaretRange.toString().length;
      end = start + selectedText.length;
    } else if (cachedSelection) {
      selectedText = cachedSelection.text;
      start = cachedSelection.start;
      end = cachedSelection.end;
    }
    const baseText = activeElement.textContent;
    const finalText = typeof baseText === 'string' ? (selectedText || baseText) : (selectedText || '');
    const finalStart = selectedText ? start : cachedSelection?.start ?? 0;
    const finalEnd = selectedText ? end : cachedSelection?.end ?? finalText.length;
    text = finalText;
    log('handleTriggerClick: contenteditable element', {
      selectedText,
      textLength: finalText.length,
      start: finalStart,
      end: finalEnd,
    });
    selectedTextInfo = {
      text: finalText,
      start: finalStart,
      end: finalEnd,
    };
    lastSelectionInfo = { start: finalStart, end: finalEnd };
  } else {
    text = activeElement.textContent || '';
    log('handleTriggerClick: other element', { textLength: text.length });
    selectedTextInfo = {
      text,
      start: 0,
      end: text.length,
    };
    lastSelectionInfo = { start: 0, end: text.length };
  }

  // 鍦ㄥ彂閫佹秷鎭�鍓嶅厛淇濆瓨鏇挎崲鐩�鏍囷紙鏃犻�夊尯鍒欎娇鐢ㄥ叏鏂囪寖鍥达級
  if (activeElement) {
    const selectionForSave =
      selectedTextInfo && selectedTextInfo.text.length > 0
        ? selectedTextInfo
        : {
            text,
            start: 0,
            end: typeof text === 'string' ? text.length : 0,
          };
    persistReplacementTarget({
      element: activeElement,
      selection: {
        start: selectionForSave.start,
        end: selectionForSave.end,
      },
    });
    log('handleTriggerClick: saved replacement target', {
      element: activeElement.tagName,
      selection: replacementTarget?.selection,
      frameId,
    });
  }

  if (typeof text !== 'string' || !text.trim()) {
    log('handleTriggerClick: empty text, returning');
    return;
  }

  log('handleTriggerClick: sending text for analysis', {
    selectedText: !!selectedText,
    textLength: text.length,
    fullText: text,
    selectedTextInfo,
    frameId,
  });

  // 闁诲海鎳撶紞濠囧极婵犲啫绶為柛鏇�鎷烽柟锟芥繝鍥ㄦ櫖婵�姗堟嫹闁跨喕妫勯崐褰掓倶婢跺��鈻斿┑鐘辫兌閻熸捇鏌￠崒姘�鎼愰柕鍥ㄥ灴瀵�锟介柛锟介敓鐣屾�愬┑瀣�鐐婇柣鎰�灏ㄩ幏鐑芥晸娴犲��绀嗗ù鐓庯拷绋跨�￠柣鐘遍檷閸婃盯鏁撻弬銈嗗�归柣鐔峰殩閹风兘鎮楃喊澶嬪��
  let languagePreference;
  try {
    languagePreference = await getUserLanguagePreference();
  } catch (e) {
    log('handleTriggerClick: fallback to default language pair due to error', e);
    languagePreference = {
      nativeLanguage: DEFAULT_LANGUAGE_PAIR.from,
      targetLanguage: DEFAULT_LANGUAGE_PAIR.to,
    };
  }
  const translations = getTranslations(languagePreference.nativeLanguage || DEFAULT_LANGUAGE_PAIR.from);

  // 闂傚倷鑳堕幊鎾绘倶濮樿泛绠伴柛婵勫劜閿熻姤鍔欓獮瀣�鏁冮敓浠嬪礃閿熶粙姊洪幖鐐插妧闁告劏鏅濊ぐ鎻掆攽閻愬瓨灏伴柣銊︾矒瀹曞崬鈻庨幋婵嬬崕闂傚倷绀侀幖锟界紒瀣�瀚伴獮蹇涙晸閿燂拷
  await chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });

  // 闂傚倷绀侀幉锛勫枈瀹ュ�婂瀭闁规儼妫勯悿楣冩煠缁嬭法浠涚紓宥呮喘閹�宄扳枎韫囨搫鎷烽敓浠嬫煕閳轰緤鎷烽幇锟介悡鏇熺箾閸℃ê濮囬柣蹇旀尦閺屻劑鎮㈢粙璺ㄤ喊缂備緤鎷峰ù锝堬拷鍕�寮块梺缁樺姇閻°劍鎱ㄥ�婂牊鐓熼柨婵嗘嚀鐎氭壆绮�閹达附鈷戦柣褍鎲＄�氬綊姊虹捄銊ユ珢闁瑰嚖鎷�
  chrome.runtime.sendMessage({
    type: 'SHOW_LOADING',
    translations,
    frameId,
  });

  const requestPayload = {
    input: text,
    nativeLanguage: languagePreference.nativeLanguage,
    targetLanguage: languagePreference.targetLanguage,
  };

  try {
    // ????????????????????????
    if (activeElement) {
      const selectionForSave =
        (selectedTextInfo && selectedTextInfo.text.length > 0)
          ? selectedTextInfo
          : {
              start: 0,
              end:
                activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement
                  ? activeElement.value.length
                  : (activeElement.textContent || '').length,
            };
      persistReplacementTarget({
        element: activeElement,
        selection: {
          start: selectionForSave.start,
          end: selectionForSave.end,
        },
      });
      log('handleTriggerClick: saved replacement target', {
        element: activeElement.tagName,
        selection: replacementTarget?.selection,
        frameId,
      });
    }

    const feedback = await requestLanguageFeedback(requestPayload);
    // 闂傚倷绀侀幉锛勫枈瀹ュ�婂瀭闁规儼妫勯悿楣冩煠缁嬭法浠涚紓宥呮喘閹�宄扳枎韫囨搫鎷烽敓浠嬫煕閳轰緤鎷烽幇锟介悡鏇熺箾閸℃ê濮囬柣蹇旀尦閺屻劑鎮㈢粙璺ㄤ喊缂備緤鎷峰ù锝夋交閹风兘鏁撴禒瀣�鍤嶉柕澶涙嫹缂佽鲸妫冮弻娑㈡晸娴犲��鍋勯柛娑橈拷蹇斿�归柛锟介弴鐔哄幍闂佽皫鍐╁暈閻庢艾缍婂�婃椽骞愭惔锝傛�堥梺闂寸串閹风兘鏌ｆ惔锛勪粵闁挎洏鍨归悾鐑藉Ψ閳哄倹娅㈡繛瀵稿Т閿熸枻鎷烽柛灞诲姂閺岋綁寮�閸�锟藉▓鈺呮煙閻戞枻鎷锋惔锟介幏鐑芥晲韫囨柨锟藉綊姊虹捄銊ユ灆婵★拷閸曪拷閺佹捇鎸婃径娑欏�归幖绮癸拷宕囩暠婵犵數鍎戠徊钘壝洪悩璇茬�堟繝闈涙搐閿熻棄銈搁弫鎾绘晸閿燂拷
    chrome.runtime.sendMessage({
      type: 'SHOW_FEEDBACK',
      feedback,
      translations,
      originalText: selectedTextInfo?.text || text,
      selection: selectedTextInfo ? {
        start: selectedTextInfo.start,
        end: selectedTextInfo.end
      } : undefined,
      frameId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('handleTriggerClick: failed to get feedback', { error: errorMessage });
  } finally {
    // 婵犵數鍋為崹鍫曞箰閸濄儳鐭撻柡澶嬪煀閼板潡鏌ㄩ悢鍓佺煓鐎碉拷閸�鏇炵厸闁稿本绮嶉崳浼存⒑闂堚晝鍒伴柛銏＄叀婵℃挳骞掑Δ锟藉�告繈鎮楀☉娆欐嫹閻撳海绉� replacementTarget闂傚倷鐒︾�笛呯矙閹达附鍤愰柨鐔烘櫕閹叉悂骞庢繝鍌涘�勯柍閿嬫礋閺岀喓鏁�閿熶粙骞忛柨瀣╃箚闁跨喕妫勯悾婵嬪礋閿熺晫绮婚弶鍖℃嫹閵忥絽鐓愰柛鏃�鐗滄禍鎼佹晸閿燂拷
    // replacementTarget 闂備礁婀遍崢褔鎮洪妸銉庢稒绗熼敓浠嬪极閹惧瓨鍙忛柟甯�鎷烽柛鏃�姘ㄩ幉鎼佸箮婵犲倹鎼愰柟鐟扮埣閺屾洘绻濊箛娑欙拷锟界紓浣稿�搁惌鍌炲蓟閻旇偐宓侀柛锟介敓浠嬫倶閳哄懏鐓熼柨婵嗙箲鐎氬綊姊绘担鐑樺殌闁宦板姂瀹曟繈寮撮姀鐘电暫濠德板�ч幏鐑芥煏閸℃ê娴�鐎规洏鍔庨敓鑺ョ⊕閿熺晫鍘х紞锟�
    setTimeout(() => {
      log('handleTriggerClick: hiding button after delay, replacementTarget remains', {
        hasTarget: !!replacementTarget
      });
      // 闂傚倷绀侀幉锟犳偡闁�宥呯��闁绘垼濮ら埛鎺楁煕濞戣櫕瀚归梺鍛婃⒐閿氶摶鐐碉拷鐧告嫹闁告洩鎷风紒鐘虫緲閿熷�愬灱閸╂牠宕濋弽锟芥禍鎼佹晝閸屾稓鍙嗗┑鐐村灦閿氶柨鐔诲Г濮婅崵鍒掗敓钘夛拷銏ｆ硾閿熻棄灏呴幏鐑藉箳濡わ拷瀹告繈鎮楀☉娆欐嫹閻撳海绉� replacementTarget
      const btn = getTriggerButton();
      btn.style.display = 'none';
      if (activeElement) {
        resizeObserver.unobserve(activeElement);
      }
    }, 100);
  }
}

function handleInput(): void {
  const editable = findEditableElement();
  if (editable) {
    activeElement = editable;
    lastEditableElement = editable;
    log('handleInput: set active and lastEditable', {
      tag: editable.tagName,
      isContentEditable: editable.isContentEditable,
    });
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
    lastEditableElement = editable;
    selectedTextInfo = null;
    lastSelectionInfo = null;
    log('handleFocusIn: set active and lastEditable', {
      tag: editable.tagName,
      isContentEditable: editable.isContentEditable,
    });
    debounceShowButton();
  }
}

function handleFocusOut(event: FocusEvent): void {
  const nextTarget = event.relatedTarget as HTMLElement | null;
  // If focus moves to the trigger button, keep the active element so clicks still work
  if (nextTarget && nextTarget.id === BUTTON_ID) {
    return;
  }
  
  // 闂傚倷绀侀幉锟犳偡闁�宥呯��闂佸灝锟斤拷缁犻箖鏌熼幑鎰�鐝�闁搞倕娲︾换娑㈠川閿熻棄锟芥﹫绠撴俊鐢稿箛閺夎法锟藉�氭煕閹帮拷閿熺獤鍕�锟藉綊鏌ｅΟ鍖℃嫹娴ｈ姤锟斤綁骞忛悩璇茬�甸柟鐧告嫹婵°倕鎳忛悡鏇㈢叓閸ャ劍灏�闁哄棛鍠撶槐鎺楁晸閽樺�屾殕闁告洩鎷锋俊鐐垫櫕閿熺晫娅㈤幏鐑芥煕閺団�崇厫閻庢氨鎳撻敓濮愬灱濞夋盯鏁撻挊澶愶拷鎼佺嵁閿熻棄鈹戦悜鍥╁埌婵炶尙濞�瀹曟粌鈹戦崶褝鎷锋總绋垮窛閻庢稒蓱濞呮牠鏌ｈ箛鏇炰哗闁稿��鍔欓幃宄扳攽閸モ晝锟介箖鏌熼幑鎰�鐝�闁搞倕娲︾换娑㈠川閿熶粙鏌婇敐鍜冩嫹閿熶粙骞橀敓浠嬬嵁閹帮拷閹�鏃堝灳瀹曞洤鎼搁梻鍌欒兌閸庣敻寮查敓浠嬫煙妞嬪骸鍘撮柡灞革拷绛规嫹閵夈儳绠查悗姘炬嫹
  activeElement = null;
  
  // 闂備浇宕垫慨鎾�鏁撻弬銈嗗�归梺鍝ュ枍閸楀啿锟斤拷閿熶粙鏌ㄩ悢铏癸拷鎱絛eButton闂傚倷鐒︾�笛呯矙閹寸偟闄勯柡鍐ㄥ�哥欢銈囩磼鐠哄搫鍔甦eButton闂傚倷鑳剁划锟界紒锟藉�ュ拑鎷烽姀鈭讹拷闁挎洏鍨介弫鎾绘寠婢跺棙锟藉牓鏌熼幆褏锛嶇亸蹇曠磽娴ｄ粙鍝烘繝銏★耿婵℃挳骞掑Δ锟藉�告繈鎮楀☉娆欐嫹閻撳海绉箁eplacementTarget
  hideButton();
  
  // replacementTarget 婵犵數鍋炲�兼瑩宕ョ�ｏ拷閹虫繈骞嗚�濋懓鍧楁煥閻斿墎鐭欓柡宀嬬節瀹曞爼濡搁妷锟介幏鐤�锟藉秹鎮鹃悜鑺ュ殤闁跨喍绮欓弫鎾绘偩鐏炴儳娈岄梺鍝勭墳閹风兘姊洪幖鐐插�界�癸拷缁嬭法鏆﹂柕澶涢檮閸庣喖鏌曡箛銉﹀�归梺璺ㄥ枙濡�鍕�鏁撻懞銉э拷宥夊煕閺冨牊鐓ラ柣鏇炲�圭�氾拷
  log('handleFocusOut: element lost focus, replacementTarget remains', {
    hasTarget: !!replacementTarget
  });
}

function handleSelectionChange(): void {
  const editable = findEditableElement();
  if (!editable) return;
  updateSelectionCache(captureSelectionSnapshot(editable));
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
      // 婵犵數濮烽敓鑺ワ公閹风兘宕樼拠褎瀚圭憸鐗堝笚閸婅泛锟姐垼鍩栭崝鏍�宕愰悜鑺ョ厽闁绘柨鎲＄欢鍙夋叏閿濆拑韬�闁哄矉缍佹俊鎼佸Ψ閵夛拷閹风兘鏁撻懞銉ょ箚闁告瑥锟藉本鎲欓梺闈涙处閸旀瑩鐛�濮楋拷瀹曟�兼嫚瑜庣�氬綊鏌ｅΟ鍖℃嫹娴ｈ姤锟斤綁骞忛悩璇茬�甸柟鐧告嫹婵°倕鎳忛悡鏇㈢叓閸ャ劍灏�闁哄棛鍠撶槐鎺楁晸閽樺�屾殕闁告洩鎷烽柡鍜冩嫹闂佽�茬箳閸嬬娀宕戦幇鐗堝仭婵犻潧锟斤拷閳锋帡鏌涢妷鈺傛暠閻庢艾缍婇弻锝夋偄閸涘﹦锛涚紓浣藉煐瀹�绋跨暦閹惰棄绠瑰ù锝呮啞閿熻姤锕㈤弻锝呂旈敓浠嬫偋婵犲洤鐓濋柡鍐ㄥ�荤壕濂告煥閻斿墎鐭欓柟锟藉�婂吘鐔兼惞鐟欏嫧鏋庨梻鍌氬�烽悞锕傚几婵犳艾绠�闁跨噦鎷�
      if (activeElement === editable) {
        log('handleClick: clicked on active editable element, returning');
        return;
      }
      log(
        'handleClick: clicked on new editable element, updating activeElement and showing button'
      );
      activeElement = editable;
      lastEditableElement = editable;
      log('handleClick: updated active and lastEditable', {
        tag: editable.tagName,
        isContentEditable: editable.isContentEditable,
      });
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
        : '我很喜欢这个产品';

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
        ]
      };

      log('requestLanguageFeedback: resolved mock feedback');
      resolve(feedback);
    }, 500);
  });
}

function replaceActiveElementText(suggestion: string): void {
  if (!replacementTarget) {
    const persisted = (window as any).__llaReplacementTarget as { element: HTMLElement; selection: { start: number; end: number } } | null;
    if (persisted?.element) {
      replacementTarget = persisted;
      lastEditableElement = persisted.element;
    }
  }

  // 婵犵數鍋炲�兼瑩宕ョ�ｏ拷閺佸��姊洪崨濞氭垹绮欓幒妤�绠�闁告冻鎷烽柟鐟板�版俊鎼佹晜閼恒儻鎷烽姀锛勭�鹃柨婵嗘噺婢跺嫮绱掔拠鎻掞拷鍧楀箖濞诧拷婵℃悂鍩￠崒姘�澹勯梻浣告啞濞测晠骞忛柨瀣�绠鹃悗娑欙拷鍏煎垱濡ょ姷鍋為崹鎸庢叏閿熶粙鏌曡箛銉х？闁绘稏鍎靛�婃椽宕�閸曪拷瀛濆┑鐐存綑鐎氾拷婵″弶鍔曢埞鎴狅拷锝忔嫹缂侊拷閸岀偞鐓犻柛婵勫劵閹烽攱寰勭�ｏ拷閿熻棄缍婇弻宥夊Ψ閿曪拷缁插�氭煃鐠囪尙绠婚柡宀嬬秮閺佹挻绂掔�ｏ拷鎯熼梺鎸庢⒐閸ㄦ繄鍒掗敓浠嬫⒒娴ｅ憡鍟為柤鐟板⒔閼洪亶鎳栭埡鍐ㄥ触闂佸搫锟藉��鐏嶉柡瀣�閰ｉ弻宥夊Ψ閵夈儲姣愰柣鐘辨祰鐏忔瑧妲愰幘璇茬＜婵炴垶鑹鹃埛濠勭磽娴ｆ枻鎷风憴鍕�锟藉綊姊绘担鐚存嫹鐠恒劎锟戒即鏌涢悢绋匡拷鍡欏垝閸�銉︽櫢闁跨噦鎷�
  let targetElement =
    replacementTarget?.element || activeElement || lastEditableElement;
  
  log('replaceActiveElementText: attempting to replace text', {
    hasReplacementTarget: !!replacementTarget,
    hasActiveElement: !!activeElement,
    hasLastEditable: !!lastEditableElement,
    lastSelectionInfo,
    suggestion: suggestion,
  });
  
  // 婵犵數濮烽敓鑺ワ公閹风兘宕樼拠褎瀚圭憸鐗堝笚閸婅泛锟姐垼娉涢惌澶愬箯瀹勬壋妲堟繛鍜冩嫹闁跨喍绮欓弻娑氾拷锝忔嫹缂佸�婄秺楠炲棝宕橀敓钘夌暦閻斿吋鏅稿ù鐘诧拷锟介崒銊╂煙閹规劕鐓愰柨鐔诲Г閸旀瑩骞冮埡鍛�绠甸柟鐑樺灦閿熷�愬劜缁绘繈濮�閳ュ啿濮告俊鐐茬摠閹�鍌氾拷锟介弻銉ノㄩ柍杞拌兌閿熸枻缍侀弻鈥筹拷銉ョ箰閿熻棄娲�閹�宄扳攽鐎ｏ拷閻撴洘绻涢崱妯兼噭閻庢艾婀辩槐鎾诲磼濮橈拷閿熻棄缍婇幃褔鎮欓崹锟介敓濮愬灲閺佹挻绂掔�ｏ拷閻撱儲绻涢幋鐑囨嫹閸�锟介敓鎴掑嵆閺岋綁濡搁妷銉㈡寖闂佸綊锟藉骸鈻堢�碉拷閹撅拷婵�锟介柣妯硷拷瑙勫�归柕蹇嬪�栭悡娑㈡煕鐏炲墽鈽夐柨鐔稿灊缁�娆撴偘閿熶粙鐓�閸ャ劎鈽夐柣锟藉Δ鍛�鐓ラ柣鏇炲�圭�氾拷
  if (
    targetElement &&
    (!targetElement.isConnected || !isEditableElement(targetElement))
  ) {
    log('replaceActiveElementText: stored target is stale, refinding editable');
    targetElement = findEditableElement();
  }
  
  if (!targetElement) {
    // 闂傚倷鐒﹂幃鍫曞磿閹惰棄纾婚柕鍫濓拷瀣�娅㈤梺鍝勫�堕崐鏍�锟芥艾缍婂�婃椽宕�閸曪拷婢ф洟鏌熺涵閿嬪�归梻浣虹《閺呮粓鏁撻挊澶嬪櫤闁哄拑鎷锋繝纰夋嫹婵�妤�鐗婄�氬綊姊哄Ч鍥у�煎�⒀傜矙楠炲繘鎮╃拠鎻掑祮闂佺粯鏌ㄩ幖锟界�碉拷閵娾晜鈷戦柛锔兼嫹闁轰焦鎮傚畷鎴﹀箻閻愭枻鎷烽幒妤佸殝闁革拷閿熻姤绂嶉妶澶嬬厵閻庢稒锟借偐鐓�闂佸疇锟借尙绠婚柡宀嬬秮閺佹挻绂掔�ｏ拷鎯熼梺闈浤涢崨锟介弳锟介梻鍌欑劍閻�褰掑礉瀹�锟介敓鑺ョ啲閹风兘鎮峰�婂嫬锟界晫浜稿▎鎴烇拷鎰板箻鐠囨彃鍞ㄩ梺璺ㄥ枔閺咃拷婵炲棎鍨介弫鎾寸�掔�ｏ拷閻撴洟鐓�閸ャ劍灏�闁哄棛鍠撶槐鎺楁晸娴犲��鏅搁柨鐕傛嫹
    log('replaceActiveElementText: no active element or replacement target, trying to find editable element');
    
    // 闂備浇锟借尙绠扮紒缁樺灩閹广垽宕卞☉娆忓墾闂佽法鍠嶇划娆撳蓟閻旂厧鍨傞柨鐔剁矙瀹曟洟骞庨挊澶嬫К閻庣櫢鎷烽柛鎰剁細濮规�呮⒑鐟欏嫬鍔ら柛鐔锋健閺佹捇鎮剧仦鍙�锝夋煏閸パ冿拷浼村箖娴犲��宸濆┑鐘插暔閿熻棄鍟�缁绘盯骞嬮悙鏉戠�嶉梺鎸庢穿缁犳垿鍩㈤幘璇茬�ｉ柨鏃囨�勯敓钘夋健閺屻劑寮�閿熶粙宕曢搹锟界粋鎺楁晸娴犲��鈷戠紒瀣�娉曠粻浼存煕閻旂�匡拷鍡欏垝閸�婵堟殕闁告洩鎷风紒鐙呯秮閺屸�筹拷銉ュ暙婵¤棄霉閻樼�硅�跨�碉拷閸�鏇炵厸闁稿本姘ㄦ禒鐓庘攽閻愯尙澧涢柛銊ョ仢閻ｇ兘鏁愭径瀣�娅㈤梺浼欑到閻�鑲╁�曟禒瀣�鐓涚�广儱绻戠�氬湱绱撴担鏂ゆ嫹鐟欏嫬锟藉綊姊绘担鐚存嫹鐠恒劎锟戒即鏌涢悢绋匡拷鍡欏垝閸�銉︽櫢闁跨噦鎷�
    const focusElement = document.activeElement;
    if (focusElement && focusElement instanceof HTMLElement && isEditableElement(focusElement)) {
      log('replaceActiveElementText: found focused editable element', { element: focusElement.tagName });
      return replaceTextInElement(focusElement, suggestion, null);
    }
    
    log('replaceActiveElementText: no editable element found');
    return;
  }

  // ???? replacementTarget??????????????
  let targetLength = 0;
  if (targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement) {
    targetLength = targetElement.value.length;
  } else if (targetElement.isContentEditable) {
    targetLength = (targetElement.textContent || '').length;
  }
  const rawSelection = replacementTarget?.selection || selectedTextInfo || lastSelectionInfo || null;
  const normalizedSelection = isFiniteSelection(rawSelection) ? normalizeSelection(rawSelection, targetLength) : null;
  const useSelection =
    normalizedSelection &&
    targetLength > 0 &&
    !(normalizedSelection.start === 0 && normalizedSelection.end === targetLength)
      ? normalizedSelection
      : null;
  log('replaceActiveElementText: using selection', useSelection);

  
  // 婵犵數鍋犻幓锟界紓宥忔嫹濠电偛锟藉��绀嬬�碉拷閿熶粙鏌曢崼婵囷拷娆戠礊閸ワ拷閺屾稑鈽夐搹锟界�氳�勭節绾板�嬪�归梺璺ㄥ枍缁�娆撳蓟濞戙垹绠ｉ柨婵嗘啗閹剧粯鐓涢柛鈩冪懃閺嬫垶绻涢懝甯�鎷峰ù瀣�锟藉牊绻濇繝鍐ㄥ�堥悗姘�缍婇幃姗�鎮欓棃娑楀�曠紓浣稿�搁惌鍌炲蓟閻斿吋鍎岄柛娑橈工閿熸枻鎷�
  replaceTextInElement(targetElement, suggestion, useSelection);
}

// 闂備礁鎼�閿熻棄锕︽晶鏇㈡煙閸愭彃锟解晠骞堥妸鈺傛櫢濞寸姴锟斤拷閻撴洟鏌熸潏鍓у埌鐞氭岸姊洪崫鍕�锟芥盯宕伴弽锟藉��锟界�广儱鎷戦幏宄帮拷妤�鐗婄�氱懓鈹戦悪鍛�瀚归梺璺ㄥ枍缁�娆撳蓟閻旇櫣鐭欓柟绋垮�╅幃娆撴⒑娴兼瑧绉�缂佺姵鐗曢悾宄拔旈崨锟界粈鍐�鏌ㄩ悢鐑樻珪缂侊拷閸�锟芥禒锕傚礈瑜夐弸鏍�姊虹捄銊ユ瀺缂侊拷濞嗗骏鎷烽敓浠嬪箻閿熶粙鐛�閹帮拷閹�鏃堝灳瀹曞洤鎼搁梻鍌欑�侀幖锟介柛濠勶拷妫垫椽鏁冮敓浠嬫晝閵忋倖鏅搁柨鐕傛嫹

function isTextInputLike(element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement {
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }
  if (element instanceof HTMLInputElement) {
    const type = (element.type || 'text').toLowerCase();
    const supportedTypes = ['text', 'search', 'email', 'url', 'password', 'number', 'tel'];
    return supportedTypes.includes(type);
  }
  return false;
}

function isRichEditorElement(element: HTMLElement): boolean {
  if (!element.isContentEditable) return false;
  if (element.closest('[data-lexical-editor]')) return true;

  // const keywords = ['lexical', 'draftjs', 'draft', 'prosemirror', 'quill', 'slate'];
  // let node: HTMLElement | null = element;
  // while (node) {
  //   const className = typeof node.className === 'string' ? node.className.toLowerCase() : '';
  //   const dataTokens = Object.values(node.dataset || {}).join(' ').toLowerCase();
  //   const tokens = `${className} ${dataTokens}`;
  //   if (keywords.some((keyword) => tokens.includes(keyword))) {
  //     return true;
  //   }
  //   node = node.parentElement;
  // }

  return false;
}

function isPlainContentEditable(element: HTMLElement): boolean {
  return element.isContentEditable && !isRichEditorElement(element);
}

function isFiniteSelection(selection: { start: number; end: number } | null | undefined): selection is { start: number; end: number } {
  return (
    !!selection &&
    Number.isFinite((selection as { start: number; end: number }).start) &&
    Number.isFinite((selection as { start: number; end: number }).end)
  );
}

function normalizeSelection(selection: { start: number; end: number } | null, maxLength: number): { start: number; end: number } {
  const length = Math.max(0, maxLength);
  if (!isFiniteSelection(selection)) {
    return { start: 0, end: length };
  }

  const safeStart = Math.max(0, Math.min(selection.start, length));
  const safeEnd = Math.max(safeStart, Math.min(selection.end, length));
  return { start: safeStart, end: safeEnd };
}

function getRangeFromOffsets(root: HTMLElement, selection: { start: number; end: number }): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let currentOffset = 0;
  let startNode: Node | null = null;
  let endNode: Node | null = null;
  let startOffset = 0;
  let endOffset = 0;

  let node = walker.nextNode();
  while (node) {
    const textLength = node.textContent?.length ?? 0;
    const nodeStart = currentOffset;
    const nodeEnd = currentOffset + textLength;

    if (!startNode && selection.start >= nodeStart && selection.start <= nodeEnd) {
      startNode = node;
      startOffset = selection.start - nodeStart;
    }

    if (!endNode && selection.end >= nodeStart && selection.end <= nodeEnd) {
      endNode = node;
      endOffset = selection.end - nodeStart;
    }

    currentOffset = nodeEnd;
    if (startNode && endNode) {
      break;
    }
    node = walker.nextNode();
  }

  if (!startNode || !endNode) {
    return null;
  }

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

function dispatchReplacementEvents(element: HTMLElement, suggestion: string): void {
  element.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      data: suggestion,
      inputType: 'insertReplacementText',
    })
  );
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function replaceInTextInput(element: HTMLInputElement | HTMLTextAreaElement, suggestion: string, selectionInfo: { start: number; end: number } | null): void {
  const { start, end } = normalizeSelection(selectionInfo, element.value.length);
  const originalLength = element.value.length;
  const prefix = element.value.slice(0, start);
  const suffix = element.value.slice(end);

  element.focus();
  element.setSelectionRange(start, end);
  element.value = `${prefix}${suggestion}${suffix}`;

  const caretPosition = prefix.length + suggestion.length;
  element.setSelectionRange(caretPosition, caretPosition);

  log('replaceTextInElement: text input replacement', { start, end, caretPosition, originalLength });
  dispatchReplacementEvents(element, suggestion);
}

function replaceInPlainContentEditable(element: HTMLElement, suggestion: string, selectionInfo: { start: number; end: number } | null): void {
  const selection = window.getSelection();
  const textLength = (element.textContent || '').length;
  const normalized = normalizeSelection(selectionInfo, textLength);
  const rangeFromOffsets = getRangeFromOffsets(element, normalized);
  const range = rangeFromOffsets ?? document.createRange();

  element.focus();

  if (!rangeFromOffsets) {
    range.selectNodeContents(element);
  }

  range.deleteContents();
  const textNode = document.createTextNode(suggestion);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);

  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }

  log('replaceTextInElement: plain contenteditable replacement', {
    selection: normalized,
    usedRangeFromOffsets: !!rangeFromOffsets,
  });
  dispatchReplacementEvents(element, suggestion);
}

function replaceInRichEditor(element: HTMLElement, suggestion: string, selectionInfo: { start: number; end: number } | null): void {
  const selection = window.getSelection();
  const textLength = (element.textContent || '').length;
  const normalized = normalizeSelection(selectionInfo, textLength);

  element.focus();

  if (selection) {
    selection.removeAllRanges();
    const rangeFromOffsets = getRangeFromOffsets(element, normalized);
    if (rangeFromOffsets) {
      selection.addRange(rangeFromOffsets);
    } else {
      const fullRange = document.createRange();
      fullRange.selectNodeContents(element);
      selection.addRange(fullRange);
    }
  }

  const beforeInput = new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertReplacementText',
    data: suggestion,
  });

  const shouldProceed = element.dispatchEvent(beforeInput);
  if (!shouldProceed) {
    log('replaceTextInElement: beforeinput prevented by rich editor');
    return;
  }

  element.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      inputType: 'insertReplacementText',
      data: suggestion,
    })
  );
  element.dispatchEvent(new Event('change', { bubbles: true }));
  log('replaceTextInElement: synthetic input dispatched for rich editor', { selection: selectionInfo ? normalized : 'all' });
}

function replaceTextInElement(element: HTMLElement, suggestion: string, selection: { start: number; end: number } | null) {
  const isRichEditor = isRichEditorElement(element);
  log('replaceTextInElement: start', {
    elementTag: element.tagName,
    isContentEditable: element.isContentEditable,
    isRichEditor,
    hasSelection: !!selection,
  });

  if (isTextInputLike(element)) {
    replaceInTextInput(element, suggestion, selection);
    persistReplacementTarget(null);
    return;
  }

  if (isRichEditor) {
    replaceInRichEditor(element, suggestion, selection);
    persistReplacementTarget(null);
    return;
  }

  if (isPlainContentEditable(element)) {
    replaceInPlainContentEditable(element, suggestion, selection);
    persistReplacementTarget(null);
    return;
  }

  element.textContent = suggestion;
  dispatchReplacementEvents(element, suggestion);
  persistReplacementTarget(null);
}

function hasRuntimeMessaging(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && typeof chrome.runtime.sendMessage === 'function';
}

document.addEventListener('input', handleInput, true);
document.addEventListener('focusin', handleFocusIn, true);
document.addEventListener('focusout', handleFocusOut, true);
document.addEventListener('selectionchange', handleSelectionChange, true);
document.addEventListener('keydown', handleKeydown, true);
document.addEventListener('click', handleClick, true);

// 闂傚倷鑳堕崕鐢稿疾濠婂牆鍨傞柣銏�锟借法鐣炬繝銏ｅ煐閸旀洜鐥�瑜旈弻鏇熷緞閸�婵嗭拷鍏肩箾閸�鐔哥凡闁靛棙甯掗敓鑺ワ公閹风兘鏌涢埄鍐�鎳呯憸浼寸畺濮婃椽宕�閸曪拷瀛濈紓浣虹帛鐢�鎺楀煝閹捐�茬�ｆ繝闈涘暞閿熻棄鐗撻弻娑㈡晸娴犲��鍋勯柛鎾茶兌閿熸枻鎷�
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, _sendResponse: (response?: any) => void) => {
  if (message.type === 'REPLACE_TEXT') {
  log('onMessage: REPLACE_TEXT received', {
    fromFrameId: sender.frameId,
    messageFrameId: (message as any).frameId,
    hasTarget: !!replacementTarget,
    hasActive: !!activeElement,
    hasLastEditable: !!lastEditableElement,
    selection: replacementTarget?.selection || selectedTextInfo || lastSelectionInfo,
  });
    replaceActiveElementText(message.suggestion);
    // Explicitly call sendResponse to prevent "message port closed" error
    _sendResponse();
    return false;
  }
  return false;
});

// 闂傚倷鑳堕崕鐢稿疾濠婂牆鍨傞柣銏�锟借法鐣炬繝銏ｆ硾閿熻棄绻戠�氱懓鈹戦悩鎻掓殺濠㈣�劽�閳规垿鏁撴禒瀣�鐓涢柛灞剧玻閹峰嘲锟姐儱娴勯幏鐑芥晲閸屾稒鐝曢梺璺ㄥ枎閿熻姤鍔曢悘鏌ユ煛娴ｅ摜孝闁伙絾绻堥弫鎾绘寠婢规繃妞藉畷绋课旈敓鐣岀不閹惰姤鐓忓�㈣埖鐩�濡撅拷缂備焦鎷濋幏鐑芥⒒娴ｅ憡鎯堥柛濠勭帛閺呰泛螖閸愭寧瀚归柛锟介敓鐣屽垝閹捐�茶摕闁挎洖鍊归弲鎼佹煠閹�鎺戝姕濠碉拷鐎甸潻鎷烽獮鍨�鍔氭繛灞傚姂瀵�鎼佹晸閿燂拷
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

// 闂傚倷鑳堕崕鐢稿疾濠婂牆鍨傞柣銏�锟借法鐣炬繝銏ｆ硾閻�濂告偝缂佹ü绻嗛柕鍫濈箲鐎氬綊鎮峰�婂懎锟芥�冪矙閹烘埊鎷烽弶鍨�锟斤拷闁跨喕妫勭粔褰掑箚閸愶拷閺佹挻绂掔�ｏ拷閻撴洘绻涢崱妯哄帶闁跨喍绮欓幃妤冨枈婢跺��锟斤拷
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

// 闂傚倷鑳堕崕鐢稿疾濠婂牆鍨傞柣銏�锟借法鐣炬繝銏ｅ煐閸旀洜绮堥崒鐐寸厱闁规媽鍩栫�氬湱绱撴笟濠冨�归柣蹇曞仦閸庡磭娆㈤悙鍨�鍠愮�广儱锟藉��鍓�闂佽法鍠嶇划娆撳蓟濞戞ǚ鏋庨柟锟介崙銈嗗�归梺璇叉捣閿熻棄锟藉��锟斤拷
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
