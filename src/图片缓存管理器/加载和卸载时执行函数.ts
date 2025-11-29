// ✅ 加载和卸载时的执行函数
import { initImageCache, clearCache } from './图片缓存管理';

$(() => {
  console.log('[图片缓存管理器] 脚本启动');

  // 初始化图片缓存
  (async () => {
    await initImageCache();

    // 尝试共享到全局接口（可能无效，但不影响主功能）
    if (typeof initializeGlobal === 'function') {
      try {
        initializeGlobal('ImageCache', {
          getImage: (roleName: string) => getRandomImageForRole(roleName),
          isLoaded: () => isCacheLoaded(),
          getStatus: () => ({
            loaded: isCacheLoaded(),
            rolesCount: imageCache.size,
            totalImages: Array.from(imageCache.values()).reduce((acc, imgs) => acc + imgs.length, 0),
          }),
        });
        console.log('[图片缓存] 已共享到全局接口 ImageCache');
      } catch (e) {
        console.warn('[图片缓存] 共享全局接口失败:', e);
      }
    } else {
      console.log('[图片缓存] initializeGlobal 不可用，跳过全局共享');
    }
  })();

  // 页面卸载时清理资源
  $(window).on('pagehide', () => {
    console.log('[图片缓存管理器] 脚本卸载');
    // 注意：不清除缓存，保持持久化
  });

  // 开发者工具：全局暴露清除缓存函数（仅调试用）
  (window as any).clearImageCache = () => {
    clearCache();
  };
});
