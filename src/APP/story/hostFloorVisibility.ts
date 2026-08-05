const STATIC_STYLE_ID = 'meituan-story-host-hide-style';
const DYNAMIC_STYLE_ID = 'meituan-story-host-hide-dynamic-style';
const HIDDEN_ATTR = 'data-meituan-story-host-hidden';
const OWNER_ATTR = 'data-meituan-story-hide-owner';
const HIDE_CSS = `
  visibility: hidden !important;
  pointer-events: none !important;
  overflow: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  border-top-width: 0 !important;
  border-bottom-width: 0 !important;
`;

export interface HostFloorVisibilityOptions {
  documents?: () => Document[];
  carrierMessageId?: () => number | null;
  nextMessageId?: () => number;
}

type MessageIdInput = number | null | undefined | Array<number | null | undefined>;

function defaultDocuments(): Document[] {
  const documents: Document[] = [];
  const push = (candidate: Document | null | undefined) => {
    if (candidate && candidate !== document && !documents.includes(candidate)) documents.push(candidate);
  };
  try {
    push(window.parent?.document);
  } catch {
    // Cross-origin hosts cannot be controlled.
  }
  try {
    push(window.top?.document);
  } catch {
    // Cross-origin hosts cannot be controlled.
  }
  return documents;
}

function defaultCarrierMessageId(): number | null {
  try {
    const id = Number(getCurrentMessageId());
    return Number.isFinite(id) && id >= 0 ? Math.trunc(id) : null;
  } catch {
    return null;
  }
}

function defaultNextMessageId(): number {
  try {
    return Math.max(0, Math.trunc(Number(getLastMessageId()))) + 1;
  } catch {
    return 1;
  }
}

function normalizeIds(input: MessageIdInput): Set<number> {
  const ids = new Set<number>();
  for (const value of Array.isArray(input) ? input : [input]) {
    const id = Number(value);
    if (Number.isFinite(id) && id >= 0) ids.add(Math.trunc(id));
  }
  return ids;
}

function selectorsFor(messageId: number): string[] {
  return [
    `#chat > .mes[mesid='${messageId}']`,
    `#chat .mes[mesid='${messageId}']`,
    `.mes[mesid='${messageId}']`,
    `#chat > .mes[data-message-index='${messageId}']`,
    `#chat .mes[data-message-index='${messageId}']`,
    `.mes[data-message-index='${messageId}']`,
    `.mes[data-message-id='${messageId}']`,
  ];
}

function listStoryHostMessageIds(documents: Document[]): number[] {
  const ids = new Set<number>();
  for (const doc of documents) {
    doc.querySelectorAll('iframe[id^="TH-message--"]').forEach(element => {
      const match = element.id.match(/^TH-message--(\d+)--/);
      if (!match) return;
      const id = Number(match[1]);
      if (Number.isFinite(id) && id >= 0) ids.add(Math.trunc(id));
    });
  }
  return Array.from(ids).sort((a, b) => a - b);
}

function ensureStyles(doc: Document): void {
  if (!doc.getElementById(STATIC_STYLE_ID)) {
    const style = doc.createElement('style');
    style.id = STATIC_STYLE_ID;
    style.textContent = `[${HIDDEN_ATTR}="true"] {${HIDE_CSS}}\n[${HIDDEN_ATTR}="true"] * { visibility: hidden !important; }`;
    doc.head?.appendChild(style);
  }
  if (!doc.getElementById(DYNAMIC_STYLE_ID)) {
    const style = doc.createElement('style');
    style.id = DYNAMIC_STYLE_ID;
    doc.head?.appendChild(style);
  }
}

export function createHostFloorVisibilityController(options: HostFloorVisibilityOptions = {}) {
  const readDocuments = options.documents ?? defaultDocuments;
  const readCarrierMessageId = options.carrierMessageId ?? defaultCarrierMessageId;
  const readNextMessageId = options.nextMessageId ?? defaultNextMessageId;
  const hiddenIds = new Set<number>();
  const observedBodies = new WeakSet<HTMLElement>();
  const observers: MutationObserver[] = [];

  function rootsFor(messageId: number): HTMLElement[] {
    const roots = new Set<HTMLElement>();
    for (const doc of readDocuments()) {
      for (const selector of selectorsFor(messageId)) {
        doc.querySelectorAll(selector).forEach(element => {
          roots.add((element.closest('.mes') as HTMLElement | null) ?? (element as HTMLElement));
        });
      }
    }
    return Array.from(roots);
  }

  function syncDynamicStyles(): void {
    const selectors = Array.from(hiddenIds)
      .sort((a, b) => a - b)
      .flatMap(selectorsFor)
      .join(',\n');
    const css = selectors ? `${selectors} {${HIDE_CSS}}\n${selectors} * { visibility: hidden !important; }` : '';
    for (const doc of readDocuments()) {
      ensureStyles(doc);
      const style = doc.getElementById(DYNAMIC_STYLE_ID);
      if (style) style.textContent = css;
    }
  }

  function applyOne(messageId: number): void {
    for (const root of rootsFor(messageId)) {
      if (root.ownerDocument) ensureStyles(root.ownerDocument);
      root.setAttribute(HIDDEN_ATTR, 'true');
      root.setAttribute(OWNER_ATTR, 'true');
    }
  }

  function clearOne(messageId: number): void {
    for (const root of rootsFor(messageId)) {
      if (root.getAttribute(OWNER_ATTR) !== 'true') continue;
      root.removeAttribute(HIDDEN_ATTR);
      root.removeAttribute(OWNER_ATTR);
    }
  }

  function reapply(): void {
    syncDynamicStyles();
    hiddenIds.forEach(applyOne);
  }

  function ensureObservers(): void {
    if (typeof MutationObserver !== 'function') return;
    for (const doc of readDocuments()) {
      if (!doc.body || observedBodies.has(doc.body)) continue;
      const observer = new MutationObserver(reapply);
      observer.observe(doc.body, { childList: true, subtree: true });
      observedBodies.add(doc.body);
      observers.push(observer);
    }
  }

  function withoutCarrier(input: MessageIdInput): Set<number> {
    const ids = normalizeIds(input);
    // 一个聊天可能同时存在多个 APP 消息 iframe。每个 iframe 都各自运行
    // 这段脚本时，必须使用同一个宿主，否则 A 隐藏 B、B 隐藏 A，最终整段聊天会变成空白。
    const hostMessageIds = listStoryHostMessageIds(readDocuments());
    const carrier = hostMessageIds[0] ?? readCarrierMessageId();
    if (carrier !== null) ids.delete(carrier);
    return ids;
  }

  function apply(input: MessageIdInput): void {
    ensureObservers();
    const ids = withoutCarrier(input);
    ids.forEach(id => hiddenIds.add(id));
    syncDynamicStyles();
    ids.forEach(applyOne);
  }

  function replace(input: MessageIdInput): void {
    ensureObservers();
    const nextIds = withoutCarrier(input);
    const allIds = normalizeIds(input);
    // 清理旧实例遗留在唯一可见宿主上的标记，避免热重载或重复 iframe
    // 初始化后，宿主仍被前一套控制器保持为隐藏状态。
    allIds.forEach(id => {
      if (!nextIds.has(id)) clearOne(id);
    });
    Array.from(hiddenIds).forEach(id => {
      if (nextIds.has(id)) return;
      clearOne(id);
      hiddenIds.delete(id);
    });
    nextIds.forEach(id => hiddenIds.add(id));
    syncDynamicStyles();
    nextIds.forEach(applyOne);
  }

  function clear(input: MessageIdInput): void {
    normalizeIds(input).forEach(id => {
      clearOne(id);
      hiddenIds.delete(id);
    });
    syncDynamicStyles();
  }

  function reserve(): number {
    const id = readNextMessageId();
    apply(id);
    return id;
  }

  function destroy(): void {
    observers.splice(0).forEach(observer => observer.disconnect());
    clear(Array.from(hiddenIds));
  }

  return { apply, replace, clear, reserve, reapply, destroy };
}
