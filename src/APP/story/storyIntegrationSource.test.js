const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

function assertMatch(source, pattern, label) {
  if (!pattern.test(source)) throw new Error(`${label} 缺少 ${pattern}`);
}

function assertNotMatch(source, pattern, label) {
  if (pattern.test(source)) throw new Error(`${label} 不应包含 ${pattern}`);
}

const router = read('src/APP/界面.ts');
const app = read('src/APP/app.vue');
const story = read('src/APP/Story.vue');
const reader = read('src/APP/story/StoryReader.vue');
const entry = read('src/APP/components/StoryEntry.vue');
const item = read('src/APP/ItemDetail.vue');
const history = read('src/APP/History.vue');

assertMatch(router, /const Story = \(\) => import\('\.\/Story\.vue'\)/, '正文懒加载');
assertMatch(router, /path:\s*'\/story'/, '正文路由');
assertMatch(app, /createDefaultStorySession\(\)/, '根级会话');
assertMatch(app, /provideStorySession\(storySession\)/, '根级注入');
assertMatch(app, /<StoryEntry/, '中央正文入口');
assertMatch(app, /is-story-reader/, '正文 Pad class');
assertMatch(app, /max-width:\s*820px/, '正文最大宽度');
assertMatch(app, /aspect-ratio:\s*3\s*\/\s*4/, '正文竖版 Pad 比例');
assertMatch(entry, />正文</, '正文入口文案');
assertMatch(story, /StoryReader/, '正文阅读器');
assertMatch(reader, /submitPrompt/, '自由输入发送');
assertMatch(reader, /cancelGeneration/, '停止生成');
assertMatch(reader, /regenerate/, '重新生成');
assertMatch(reader, /rollbackFrom/, '回退');
assertMatch(item, /submitOrderToStory/, '套餐下单接入正文');
assertMatch(history, /submitOrderToStory/, '再次下单接入正文');
assertNotMatch(item, /\/trigger await=true/, '套餐下单旧 slash 链');
assertNotMatch(history, /\/trigger await=true/, '再次下单旧 slash 链');

console.log('story integration source contract passed');
