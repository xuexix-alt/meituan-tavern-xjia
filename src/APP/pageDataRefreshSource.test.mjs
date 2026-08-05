import { readFile } from 'node:fs/promises';

for (const page of ['Service.vue', 'History.vue', 'Me.vue']) {
  const source = await readFile(new URL(`./${page}`, import.meta.url), 'utf8');
  if (!source.includes('Mvu.events.VARIABLE_UPDATE_ENDED')) {
    throw new Error(`${page} 必须监听 MVU 变量更新结束事件`);
  }
  if (!source.includes('onBeforeUnmount')) {
    throw new Error(`${page} 必须在卸载时清理 MVU 监听器`);
  }
}

console.log('APP page MVU refresh contract passed');
