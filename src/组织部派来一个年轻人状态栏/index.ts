import { createApp } from 'vue';
import App from './App.vue';
import './index.scss';

$(() => {
  const mountPoint = document.getElementById('app');

  // ✅ 防重复挂载：检查是否已经加载过状态栏
  if (sessionStorage.getItem('status_bar_loaded')) {
    console.log('[状态栏] 已存在，跳过重复加载');
    return;
  }

  if (mountPoint) {
    const app = createApp(App);
    app.mount(mountPoint);

    // ✅ 标记为已加载
    sessionStorage.setItem('status_bar_loaded', 'true');

    console.log('LingDong: Vue App Mounted Successfully.');

    // 严格遵循规范：使用 pagehide 清理资源
    $(window).on('pagehide', () => {
      app.unmount();
      console.log('LingDong: Vue App Unmounted.');
      // ✅ 清理标记
      sessionStorage.removeItem('status_bar_loaded');
    });
  } else {
    console.error('LingDong: Mount point #app not found!');
  }
});
