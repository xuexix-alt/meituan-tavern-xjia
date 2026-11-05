import $ from 'jquery';

/** 只测宿主，不测 iframe 自身，避免渲染器的自动高度形成反馈循环。 */
export function getHostPanelHeight(
  chat: { top: number; bottom: number },
  viewport: { offsetTop: number; height: number },
): number | null {
  if (![chat.top, chat.bottom, viewport.offsetTop, viewport.height].every(Number.isFinite)) return null;
  const height = Math.floor(
    Math.min(chat.bottom, viewport.offsetTop + viewport.height) - Math.max(chat.top, viewport.offsetTop) - 12,
  );
  return height > 0 ? height : null;
}

/** 同源酒馆楼层使用宿主聊天高度；独立预览或跨域时沿用 CSS 比例。 */
export function observeHostPanelHeight(onHeight: (height: number) => void): () => void {
  let dispose = () => {};
  try {
    const frame = window.frameElement;
    const chat = frame ? $(frame).closest<HTMLElement>('#chat')[0] : undefined;
    const host = chat?.ownerDocument.defaultView;
    if (!frame || !chat || !host) return dispose;

    let active = true;
    let pending = 0;
    let alignmentFrame = 0;
    let alignRequested = false;
    let previous: number | null = null;
    const align = () => {
      alignmentFrame = 0;
      if (!active || !alignRequested || previous === null) return;
      const rect = frame.getBoundingClientRect();
      // 等渲染器把壳层的新高度同步到 iframe 后，再恢复原本可见的 APP 位置。
      if (Math.abs(rect.height - previous) > 4) return;
      const viewportTop = host.visualViewport?.offsetTop ?? 0;
      const top = Math.max(chat.getBoundingClientRect().top, viewportTop) + 6;
      chat.scrollTop += rect.top - top;
      alignRequested = false;
    };
    const scheduleAlignment = () => {
      if (active && alignRequested && !alignmentFrame) alignmentFrame = window.requestAnimationFrame(align);
    };
    const measure = () => {
      pending = 0;
      if (!active) return;
      const viewport = host.visualViewport;
      const height = getHostPanelHeight(chat.getBoundingClientRect(), {
        offsetTop: viewport?.offsetTop ?? 0,
        height: viewport?.height ?? host.innerHeight,
      });
      if (height !== null && height !== previous) {
        const frameRect = frame.getBoundingClientRect();
        const chatRect = chat.getBoundingClientRect();
        alignRequested = frameRect.bottom > chatRect.top && frameRect.top < chatRect.bottom;
        previous = height;
        onHeight(height);
        scheduleAlignment();
      }
    };
    const schedule = () => {
      if (active && !pending) pending = window.requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(() => {
      schedule();
      scheduleAlignment();
    });
    observer.observe(chat);
    observer.observe(frame);
    host.addEventListener('resize', schedule);
    host.document.addEventListener('scroll', schedule, true);
    host.visualViewport?.addEventListener('resize', schedule);
    host.visualViewport?.addEventListener('scroll', schedule);
    dispose = () => {
      active = false;
      observer.disconnect();
      window.cancelAnimationFrame(pending);
      window.cancelAnimationFrame(alignmentFrame);
      host.removeEventListener('resize', schedule);
      host.document.removeEventListener('scroll', schedule, true);
      host.visualViewport?.removeEventListener('resize', schedule);
      host.visualViewport?.removeEventListener('scroll', schedule);
    };
    measure();
  } catch {
    dispose();
    // 宿主不可访问时保留独立页面布局，不阻断 APP 初始化。
  }
  return dispose;
}
