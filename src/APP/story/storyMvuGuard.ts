const UPDATE_VARIABLE_OPEN_PATTERN = '<UpdateVariable\\b[^>]*>';
const UPDATE_VARIABLE_CLOSE_RE = /<\/UpdateVariable\s*>/i;
const UPDATE_COMMAND_RE = /_\.(?:set|insert|assign|remove|unset|delete|add|move)\s*\(/i;
const JSON_PATCH_TAG_RE = /<json_?patch\b/i;
const INIT_VARIABLE_RE = /<initvar\b[\s\S]*?<\/initvar\s*>/i;

export type MvuUpdateBlockValidator = (block: string, body: string) => boolean | Promise<boolean>;

export interface MvuSanitizeResult {
  text: string;
  removedBlocks: number;
}

export function hasRecognizedMvuUpdate(body: string): boolean {
  return UPDATE_COMMAND_RE.test(body) || JSON_PATCH_TAG_RE.test(body) || INIT_VARIABLE_RE.test(body);
}

export async function sanitizeMvuUpdateBlocks(
  source: string,
  validate: MvuUpdateBlockValidator = (_block, body) => hasRecognizedMvuUpdate(body),
): Promise<MvuSanitizeResult> {
  const text = String(source ?? '');
  let output = '';
  let cursor = 0;
  let removedBlocks = 0;
  let openMatch: RegExpExecArray | null;
  const openRe = new RegExp(UPDATE_VARIABLE_OPEN_PATTERN, 'gi');

  while ((openMatch = openRe.exec(text)) !== null) {
    const openStart = openMatch.index;
    const openEnd = openRe.lastIndex;
    const closeMatch = UPDATE_VARIABLE_CLOSE_RE.exec(text.slice(openEnd));

    output += text.slice(cursor, openStart);
    if (!closeMatch) {
      removedBlocks += 1;
      cursor = text.length;
      break;
    }

    const closeStart = openEnd + closeMatch.index;
    const closeEnd = openEnd + closeMatch.index + closeMatch[0].length;
    const block = text.slice(openStart, closeEnd);
    const body = text.slice(openEnd, closeStart);
    if (await validate(block, body)) {
      output += block;
    } else {
      removedBlocks += 1;
    }

    cursor = closeEnd;
    openRe.lastIndex = closeEnd;
  }

  output += text.slice(cursor);
  return { text: output, removedBlocks };
}
