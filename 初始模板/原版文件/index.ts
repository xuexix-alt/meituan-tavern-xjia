import { createApp } from 'vue';
import router from './界面';
import app from './app.vue';

// 正确使用 jQuery 进行初始化（不是 DOMContentLoaded）
$(() => {
  toastr.success('界面加载成功！', '欢迎使用');
  createApp(app).use(router).mount('#app');
});

// 正确使用 jQuery 进行卸载时清理
$(window).on('pagehide', () => {
  toastr.info('界面已卸载', '再见');
});
