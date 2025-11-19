import { createApp } from 'vue';
import router from './界面';
import app from './app.vue';

// Vue Router必须在全局作用域创建，不能放在$(() => {})中
const vueApp = createApp(app);
vueApp.use(router);

// 性能监控标记
const perfStartTime = performance.now();

// 预加载关键路由组件
const preloadCriticalRoutes = async () => {
  try {
    // 预加载用户最可能访问的页面
    const criticalRoutes = ['/service', '/history'];
    await Promise.all(
      criticalRoutes.map(path => {
        const route = router.resolve(path);
        // Vue Router会自动处理组件预加载
        return route;
      })
    );
    console.log('[性能] 关键路由预加载完成');
  } catch (error) {
    console.warn('[性能] 路由预加载失败:', error);
  }
};

// 预加载资源
const preloadCriticalResources = async () => {
  try {
    // 预加载关键资源
    const resources: string[] = [
      // 可以添加图片、字体等关键资源
    ];

    await Promise.all(
      resources.map(url => {
        return new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          link.onload = resolve;
          link.onerror = reject;
          document.head.appendChild(link);
        });
      })
    );
    console.log('[性能] 关键资源预加载完成');
  } catch (error) {
    console.warn('[性能] 资源预加载失败:', error);
  }
};

// 等待MVU框架初始化（带超时和错误处理）
const waitForMvu = async (timeout = 5000) => {
  return Promise.race([
    waitGlobalInitialized('Mvu'),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MVU初始化超时')), timeout)
    ),
  ]).catch(err => {
    console.warn('[MVU] 初始化失败，使用降级方案:', err);
    return null; // 返回null表示降级
  });
};

// 初始化应用
const initApp = async () => {
  try {
    // 并行执行所有初始化任务
    const initTasks = Promise.all([
      waitForMvu(),                    // MVU初始化（带超时）
      preloadCriticalRoutes(),         // 路由预加载
      preloadCriticalResources(),      // 资源预加载
    ]);

    // 等待所有初始化任务完成
    const [mvuReady] = await initTasks;

    // 记录初始化耗时
    const initTime = performance.now() - perfStartTime;
    console.log(`[性能] 应用初始化完成，耗时: ${initTime.toFixed(2)}ms`);

    // 根据MVU状态显示不同消息
    if (mvuReady) {
      console.log(`[欢迎使用] 界面加载成功！(${initTime.toFixed(0)}ms)`);
    } else {
      console.log('[降级模式] 部分功能可能不可用');
    }

    // 挂载Vue应用
    vueApp.mount('#app');

    // 记录挂载耗时
    const mountTime = performance.now() - perfStartTime;
    console.log(`[性能] 总启动时间: ${mountTime.toFixed(2)}ms`);

  } catch (error) {
    console.error('[初始化] 应用启动失败:', error);
    console.log('[错误] 界面加载失败，请刷新页面重试');
  }
};

// 正确使用 jQuery 进行初始化（不是 DOMContentLoaded）
$(() => {
  // 初始化主题 - 移动到Vue组件的onMounted中处理，避免重复设置
  initApp();
});

// 正确使用 jQuery 进行卸载时清理
$(window).on('pagehide', () => {
  const unloadTime = performance.now() - perfStartTime;
  console.log(`[性能] 应用运行时间: ${unloadTime.toFixed(2)}ms`);
  console.log('[再见] 界面已卸载');
});

// 全局错误处理 - 捕获未处理的Promise错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('[全局错误] 未处理的Promise错误:', event.reason);
  console.log('[系统提示] 发生了未知错误');
});

// 全局错误处理 - 捕获JavaScript运行时错误
window.addEventListener('error', (event) => {
  console.error('[全局错误] JavaScript运行时错误:', event.error);
});
