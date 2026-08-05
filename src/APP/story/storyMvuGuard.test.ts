import { sanitizeMvuUpdateBlocks } from './storyMvuGuard';

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

async function testDropsAnalysisOnlyBlock(): Promise<void> {
  const source = `<content>正文仍然保留</content>
<UpdateVariable>
  <Analysis>拒绝执行变量更新。</Analysis>
</UpdateVariable>`;
  const result = await sanitizeMvuUpdateBlocks(source);

  assertEqual(result.removedBlocks, 1, '删除无效更新块');
  assertEqual(result.text.includes('<content>正文仍然保留</content>'), true, '保留正文主体');
  assertEqual(result.text.includes('<UpdateVariable>'), false, '移除无效更新标签');
}

async function testKeepsRecognizedCommandBlock(): Promise<void> {
  const source = `<content>正文</content>
<UpdateVariable>
  <Analysis>更新余额</Analysis>
  _.set('经济.账户余额', 100);
</UpdateVariable>`;
  const result = await sanitizeMvuUpdateBlocks(source);

  assertEqual(result.removedBlocks, 0, '保留有效更新块');
  assertEqual(result.text, source, '有效更新块原样保留');
}

async function testKeepsZodCompatiblePatchBlock(): Promise<void> {
  const source = `<content>正文</content>
<UpdateVariable>
  <json_patch>
    [{"op":"replace","path":"/经济/账户余额","value":100}]
  </json_patch>
</UpdateVariable>`;
  const result = await sanitizeMvuUpdateBlocks(source);

  assertEqual(result.removedBlocks, 0, '保留 Zod 兼容 JSON Patch');
  assertEqual(result.text, source, 'JSON Patch 更新块原样保留');
}

async function testDropsUnclosedBlock(): Promise<void> {
  const result = await sanitizeMvuUpdateBlocks('<content>正文</content>\n<UpdateVariable>_.set(\'x\', 1);');

  assertEqual(result.removedBlocks, 1, '删除未闭合更新块');
  assertEqual(result.text, '<content>正文</content>\n', '未闭合块不吞掉正文前内容');
}

async function testHonorsParserRejection(): Promise<void> {
  const source = `<UpdateVariable>_.set('x', 1);</UpdateVariable>`;
  const result = await sanitizeMvuUpdateBlocks(source, async () => false);

  assertEqual(result.removedBlocks, 1, '删除预检失败更新块');
  assertEqual(result.text, '', '预检失败后不写入更新命令');
}

void Promise.resolve()
  .then(testDropsAnalysisOnlyBlock)
  .then(testKeepsRecognizedCommandBlock)
  .then(testKeepsZodCompatiblePatchBlock)
  .then(testDropsUnclosedBlock)
  .then(testHonorsParserRejection)
  .then(() => console.log('story MVU guard contract passed'));
