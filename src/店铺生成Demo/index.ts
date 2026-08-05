import { createApp } from 'vue';
import App from './App.vue';
import { registerShopSchema } from './utils/schema';

// jQuery-like ready function
function ready(fn: () => void) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(() => {
  // 1. 注册MVU Schema（必须在Vue之前）
  registerShopSchema();

  // 2. 挂载Vue应用
  createApp(App).mount('#app');

  // 3. 显示加载成功提示
  if (typeof toastr !== 'undefined') {
    toastr.success('店铺生成 Demo 加载成功!');
  } else {
    console.log('店铺生成 Demo 加载成功!');
  }
});

// For Tavern Helper hot-reloading (if enabled)
// @ts-expect-error - webpack-hot-middleware types not included in default TS environment
if (import.meta.hot) {
  // @ts-expect-error - import.meta.hot.accept is a webpack HMR API
  import.meta.hot.accept();
}
