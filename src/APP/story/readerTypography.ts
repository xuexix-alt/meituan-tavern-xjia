// 正文阅读排版设置：默认值、调节范围与 localStorage 持久化。
// StoryMessageBody 通过 var(--reader-font-size) / var(--reader-line-height) 引用。

export interface ReaderTypographySettings {
  /** 正文字号，单位 px */
  fontSize: number;
  /** 正文行高倍数，无单位 */
  lineHeight: number;
}

export const DEFAULT_READER_TYPOGRAPHY: ReaderTypographySettings = { fontSize: 15, lineHeight: 1.6 };

export const FONT_SIZE_RANGE = { min: 13, max: 20, step: 1 };
export const LINE_HEIGHT_RANGE = { min: 1.3, max: 2.2, step: 0.1 };

export const READER_FONT_SIZE_KEY = 'app-reader-font-size';
export const READER_LINE_HEIGHT_KEY = 'app-reader-line-height';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundLineHeight(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 从存储读取设置；缺失或非法时回落默认值，越界时 clamp 到范围。 */
export function loadReaderTypography(store: Pick<Storage, 'getItem'>): ReaderTypographySettings {
  const rawFont = store.getItem(READER_FONT_SIZE_KEY);
  const rawLine = store.getItem(READER_LINE_HEIGHT_KEY);
  // 键不存在时 getItem 返回 null，Number(null) 为 0 而非 NaN，需显式判空再转换。
  const font = rawFont === null ? NaN : Number(rawFont);
  const line = rawLine === null ? NaN : Number(rawLine);
  return {
    fontSize: Number.isFinite(font)
      ? clamp(Math.round(font), FONT_SIZE_RANGE.min, FONT_SIZE_RANGE.max)
      : DEFAULT_READER_TYPOGRAPHY.fontSize,
    lineHeight: Number.isFinite(line)
      ? clamp(roundLineHeight(line), LINE_HEIGHT_RANGE.min, LINE_HEIGHT_RANGE.max)
      : DEFAULT_READER_TYPOGRAPHY.lineHeight,
  };
}

/** 写入存储；值先 clamp 到范围并规范化，保证前后一致。 */
export function saveReaderTypography(settings: ReaderTypographySettings, store: Pick<Storage, 'setItem'>): void {
  store.setItem(
    READER_FONT_SIZE_KEY,
    String(clamp(Math.round(settings.fontSize), FONT_SIZE_RANGE.min, FONT_SIZE_RANGE.max)),
  );
  store.setItem(
    READER_LINE_HEIGHT_KEY,
    String(clamp(roundLineHeight(settings.lineHeight), LINE_HEIGHT_RANGE.min, LINE_HEIGHT_RANGE.max)),
  );
}

/** 将排版设置应用到 iframe 根元素，使 StoryMessageBody 的 var() 生效。 */
export function applyReaderTypography(settings: ReaderTypographySettings): void {
  const root = document.documentElement;
  root.style.setProperty('--reader-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--reader-line-height', String(settings.lineHeight));
}
