import { createApp } from 'vue';
import App from './App.vue';
import './index.scss';

$(() => {
  const mountPoint = document.getElementById('app');
  if (mountPoint) {
    const app = createApp(App);
    app.mount(mountPoint);

    console.log('LingDong: Vue App Mounted Successfully.');

    // 严格遵循规范：使用 pagehide 清理资源
    $(window).on('pagehide', () => {
      app.unmount();
      console.log('LingDong: Vue App Unmounted.');
    });
  } else {
    console.error('LingDong: Mount point #app not found!');
  }
});
