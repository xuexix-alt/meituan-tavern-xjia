import { createApp } from 'vue';
import router from './界面';
import app from './app.vue';

// Vue Router必须在全局作用域创建，不能放在$(() => {})中
const vueApp = createApp(app);
vueApp.use(router);

// 全局日志开关：关闭以避免 hover 动画触发布局偏移时产生大量控制台输出
const ENABLE_PERF_VERBOSE = false;
const log = (...args: any[]) => {
  if (ENABLE_PERF_VERBOSE) console.log(...args);
};
const warn = (...args: any[]) => console.warn(...args);
const error = (...args: any[]) => console.error(...args);

// 性能监控标记
const perfStartTime = performance.now();
// 移动端友好开关：在手机 / WebView 中尽量关闭预加载与重型监控，避免被宿主拦截
const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Web Vitals性能监控
const initWebVitalsMonitoring = () => {
  try {
    // 监控LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver(entryList => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      log(`[Web Vitals] LCP: ${lastEntry.startTime.toFixed(2)}ms`, lastEntry);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // 监控FID (First Input Delay) - 通过Event Timing API
    const fidObserver = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'first-input') {
          const firstInput = entry as PerformanceEventTiming;
          const fid = firstInput.processingStart - firstInput.startTime;
          log(`[Web Vitals] FID: ${fid.toFixed(2)}ms`, firstInput);
        }
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // 监控CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsEntries: LayoutShift[] = [];
    const clsObserver = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'layout-shift') {
          const layoutShift = entry as LayoutShift;
          if (!layoutShift.hadRecentInput) {
            clsEntries.push(layoutShift);
            clsValue += layoutShift.value;
            log(`[Web Vitals] CLS累计: ${clsValue.toFixed(4)}`, layoutShift);
          }
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // 监控长任务 (Long Tasks)
    const longTaskObserver = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        if (entry.duration > 50) {
          // 超过50ms的任务
          log(`[性能] 长任务检测: ${entry.duration.toFixed(2)}ms`, entry);
        }
      }
    });
    longTaskObserver.observe({ type: 'longtask', buffered: true });

    log('[性能监控] Web Vitals监控已启动');
  } catch (error) {
    warn('[性能监控] Web Vitals监控初始化失败:', error);
  }
};

// 内存使用监控（仅Chrome支持）
const initMemoryMonitoring = () => {
  try {
    // 检查performance.memory API是否可用
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      log(
        `[内存监控] 初始化内存状态: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      );

      // 定期监控内存使用
      setInterval(() => {
        const mem = (performance as any).memory;
        const usedMB = mem.usedJSHeapSize / 1024 / 1024;
        const totalMB = mem.totalJSHeapSize / 1024 / 1024;
        const percentage = (usedMB / totalMB) * 100;
        const percentageText = percentage.toFixed(1);

        // 仅在高内存使用或增长时记录
        if (usedMB > 50 || percentage > 80) {
          log(
            `[内存监控] 内存使用较高: ${usedMB.toFixed(2)}MB/${totalMB.toFixed(2)}MB (${percentageText}%)`,
          );
        }
      }, 30000); // 每30秒检查一次

      log('[内存监控] 内存监控已启动');
    } else {
      log('[内存监控] performance.memory API不可用');
    }
  } catch (error) {
    warn('[内存监控] 内存监控初始化失败:', error);
  }
};

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
      }),
    );
    log('[性能] 关键路由预加载完成');
  } catch (error) {
    warn('[性能] 路由预加载失败:', error);
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
      }),
    );
    log('[性能] 关键资源预加载完成');
  } catch (error) {
    warn('[性能] 资源预加载失败:', error);
  }
};

// 等待MVU框架初始化（带超时和错误处理）
const waitForMvu = async (timeout = 5000) => {
  return Promise.race([
    waitGlobalInitialized('Mvu'),
    new Promise((_, reject) => setTimeout(() => reject(new Error('MVU初始化超时')), timeout)),
  ]).catch(err => {
    warn('[MVU] 初始化失败，使用降级方案:', err);
    return null; // 返回null表示降级
  });
};

// 初始化应用
const initApp = async () => {
  try {
    // 并行执行所有初始化任务（移动端减少预加载任务以防宿主拦截）
    const initTasks = Promise.all([
      waitForMvu(), // MVU初始化（带超时）
      preloadCriticalRoutes(), // 路由预加载
      IS_MOBILE ? Promise.resolve() : preloadCriticalResources(), // 资源预加载（PC端）
    ]);

    // 等待所有初始化任务完成
    const [mvuReady] = await initTasks;

    // 启动Web Vitals性能监控
    if (!IS_MOBILE) {
      initWebVitalsMonitoring();
      initMemoryMonitoring();
    } else {
      log('[性能] 检测到移动端，已跳过 Web Vitals 与内存监控');
    }

    // 记录初始化耗时
    const initTime = performance.now() - perfStartTime;
    log(`[性能] 应用初始化完成，耗时: ${initTime.toFixed(2)}ms`);

    // 根据MVU状态显示不同消息
    if (mvuReady) {
      log(`[欢迎使用] 界面加载成功！(${initTime.toFixed(0)}ms)`);
    } else {
      log('[降级模式] 部分功能可能不可用');
    }

    // 挂载Vue应用
    vueApp.mount('#app');

    // 记录挂载耗时
    const mountTime = performance.now() - perfStartTime;
    log(`[性能] 总启动时间: ${mountTime.toFixed(2)}ms`);
  } catch (err) {
    console.error('[初始化] 应用启动失败:', err);
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
  log(`[性能] 应用运行时间: ${unloadTime.toFixed(2)}ms`);
  log('[再见] 界面已卸载');
});

// 全局错误处理 - 捕获未处理的Promise错误
window.addEventListener('unhandledrejection', event => {
  error('[全局错误] 未处理的Promise错误:', event.reason);
  console.log('[系统提示] 发生了未知错误');
});

// 全局错误处理 - 捕获JavaScript运行时错误
window.addEventListener('error', event => {
  error('[全局错误] JavaScript运行时错误:', event.error);
});
