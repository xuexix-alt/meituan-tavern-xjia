import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('src', '美人团');
const requiredFiles = [
  'schema.ts',
  'index.yaml',
  '第一条消息/0.txt',
  '世界书/变量/initvar.yaml',
  '世界书/变量/变量列表.txt',
  '世界书/变量/变量更新规则.yaml',
  '世界书/变量/变量输出格式.yaml',
  '脚本/MVU/index.ts',
  '脚本/变量结构/index.ts',
  '界面/状态栏/App.vue',
  '界面/状态栏/global.css',
  '界面/状态栏/index.html',
  '界面/状态栏/index.ts',
  '界面/状态栏/store.ts',
];

for (const relativePath of requiredFiles) {
  assert.ok(existsSync(path.join(root, relativePath)), `美人团角色卡缺少 ${relativePath}`);
}

const schema = readFileSync(path.join(root, 'schema.ts'), 'utf8');
assert.match(schema, /export const Schema\s*=\s*z\.object\(/, 'schema.ts 必须导出 Zod Schema');
assert.doesNotMatch(schema, /registerMvuSchema/, 'schema.ts 不应注册运行时副作用');

const registration = readFileSync(path.join(root, '脚本/变量结构/index.ts'), 'utf8');
assert.match(
  registration,
  /import\s+\{\s*Schema\s*\}\s+from\s+['"]\.\.\/\.\.\/schema['"]/,
  '变量结构脚本必须复用角色卡 schema',
);
assert.match(registration, /waitGlobalInitialized\(['"]Mvu['"]\)/, '变量结构脚本必须等待 MVU 初始化');
assert.match(registration, /registerMvuSchema\(Schema\)/, '变量结构脚本必须注册 Schema');

const statusEntry = readFileSync(path.join(root, '界面/状态栏/index.ts'), 'utf8');
assert.match(statusEntry, /waitGlobalInitialized\(['"]Mvu['"]\)/, '状态栏必须等待 MVU 初始化');
assert.match(statusEntry, /stat_data/, '状态栏必须等待消息级 stat_data');

const cardConfig = readFileSync(path.join(root, 'index.yaml'), 'utf8');
const webpackConfig = readFileSync(path.resolve(root, '..', '..', 'webpack.config.ts'), 'utf8');
assert.match(cardConfig, /dist\/美人团\/界面\/状态栏\/index\.html/, '角色卡状态栏 URL 必须指向美人团产物');
assert.match(cardConfig, /dist\/美人团\/脚本\/变量结构\/index\.js/, '角色卡变量结构脚本 URL 必须指向美人团产物');
assert.ok(
  cardConfig.includes('https://testingcf.jsdelivr.net/gh/xuexix-alt/meituan-tavern-xjia/dist/美人团/界面/状态栏/index.html'),
  '角色卡界面 URL 必须指向当前仓库产物',
);
assert.ok(
  cardConfig.includes('https://testingcf.jsdelivr.net/gh/xuexix-alt/meituan-tavern-xjia/dist/美人团/脚本/变量结构/index.js'),
  '角色卡变量结构脚本 URL 必须指向当前仓库产物',
);
assert.doesNotMatch(cardConfig, /StageDog\/tavern_helper_template\/dist\/美人团/, '角色卡不能继续引用旧仓库产物');
assert.doesNotMatch(cardConfig, /角色卡名称/, '角色卡配置不能保留模板占位路径');
assert.match(webpackConfig, /scriptLoading:\s*['"]module['"]/, '前端界面产物必须以 module 脚本加载，才能执行内联 import');

console.log('美人团角色卡目录契约通过');
