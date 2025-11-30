import { createApp } from 'vue';
import App from './App.vue';
import './index.scss';

$(() => {
  const mountPoint = document.getElementById('app');

  if (!mountPoint) {
    console.error('LingDong: Mount point #app not found!');
    return;
  }

  // ? 防重复挂载：若当前 iframe 内已存在 Vue 内容，则跳过
  if (mountPoint.hasChildNodes()) {
    console.log('[状态栏] 已存在，跳过重复加载');
    return;
  }

  const app = createApp(App);
  app.mount(mountPoint);

  console.log('LingDong: Vue App Mounted Successfully.');

  // 严格遵循规范：使用 pagehide 清理资源
  $(window).on('pagehide', () => {
    app.unmount();
    console.log('LingDong: Vue App Unmounted.');
  });
});
