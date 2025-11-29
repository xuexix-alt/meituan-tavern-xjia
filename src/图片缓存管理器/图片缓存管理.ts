// ✅ 图片缓存管理器 - 全局单例模式
// 负责管理所有角色图片的缓存，避免重复加载

// 状态管理
export let imageCache = new Map<string, string[]>(); // key: 角色名, value: base64图片列表
export let isPreloading = false;
export let imagesLoaded = false;

/**
 * 初始化图片缓存系统
 */
export const initImageCache = async () => {
  // 检查是否已经加载过
  if (imagesLoaded || imageCache.size > 0) {
    console.log('[图片缓存] 缓存已存在，跳过加载');
    return;
  }

  if (isPreloading) {
    console.log('[图片缓存] 正在加载中，跳过重复请求');
    return;
  }

  isPreloading = true;
  console.log('[图片缓存] 开始加载 image 目录...');

  try {
    // 获取GitHub图片列表
    const response = await fetch('https://api.github.com/repos/xuexix-alt/meituan-tavern-xjia/contents/image');
    const files = await response.json();

    // 过滤图片文件
    const imageFiles = files.filter((file: any) =>
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg')
    );

    console.log(`[图片缓存] 发现 ${imageFiles.length} 张图片`);

    // 按角色名分组
    const groupedImages = groupImagesByRole(imageFiles);

    // 加载每组图片
    await Promise.all(
      Object.entries(groupedImages).map(async ([imageRoleName, fileNames]) => {
        console.log(`[图片缓存] 加载角色 "${imageRoleName}" 的 ${fileNames.length} 张图片`);
        await loadImagesForRole(imageRoleName, fileNames);
      }),
    );

    console.log(`[图片缓存] 加载完成！缓存了 ${imageCache.size} 个角色的图片（内存缓存）`);
    imagesLoaded = true;
    isPreloading = false;
  } catch (e) {
    console.error('[图片缓存] 加载失败:', e);
    isPreloading = false;
  }
};

/**
 * 按角色名分组图片
 */
const groupImagesByRole = (imageFiles: any[]): Record<string, string[]> => {
  const grouped: Record<string, string[]> = {};

  imageFiles.forEach(file => {
    const roleName = extractImageRoleName(file.name);
    if (!grouped[roleName]) {
      grouped[roleName] = [];
    }
    grouped[roleName].push(file.name);
  });

  return grouped;
};

/**
 * 从文件名提取角色名
 */
const extractImageRoleName = (fileName: string): string => {
  let name = fileName.replace(/\.(png|jpg|jpeg)$/i, '');
  name = name.replace(/\d+$/, '');
  return name;
};

/**
 * 加载某个角色的所有图片
 */
const loadImagesForRole = async (imageRoleName: string, fileNames: string[]): Promise<void> => {
  const base64Images: string[] = [];

  await Promise.all(
    fileNames.map(async (fileName) => {
      const base64 = await loadImageAsBase64(fileName);
      if (base64) {
        base64Images.push(base64);
        console.log(`[图片缓存] ${imageRoleName}: ${fileName}`);
      }
    }),
  );

  if (base64Images.length > 0) {
    imageCache.set(imageRoleName, base64Images);
  }
};

/**
 * 将图片加载为base64编码
 */
const loadImageAsBase64 = async (fileName: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const CDN_PREFIX = 'https://testingcf.jsdelivr.net/gh/xuexix-alt/meituan-tavern-xjia@main/image';
    const url = `${CDN_PREFIX}/${fileName}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        // JPEG压缩，PNG保持原格式
        const isJpeg = fileName.toLowerCase().endsWith('.jpg') ||
                       fileName.toLowerCase().endsWith('.jpeg');

        const dataUrl = isJpeg
          ? canvas.toDataURL('image/jpeg', 0.7)
          : canvas.toDataURL('image/png');

        resolve(dataUrl);
      } catch (e) {
        console.warn(`[图片缓存] 转换失败: ${fileName}`, e);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.log(`[图片缓存] 跳过不存在的图片: ${fileName}`);
      resolve(null);
    };

    img.src = url;
  });
};

/**
 * 获取角色的随机图片
 * @param roleName 角色名
 * @returns base64编码的图片字符串
 */
export const getRandomImageForRole = (roleName: string): string | null => {
  if (!imagesLoaded) {
    console.log(`[图片缓存] 缓存未加载完成`);
    return null;
  }

  const images = imageCache.get(roleName);
  if (!images || images.length === 0) {
    console.log(`[图片缓存] 角色 "${roleName}" 无缓存图片`);
    return null;
  }

  // 随机选择一张
  const randomIndex = Math.floor(Math.random() * images.length);
  const selectedImage = images[randomIndex];
  console.log(`[图片缓存] 为 "${roleName}" 随机选择第 ${randomIndex + 1} 张图片（共 ${images.length} 张）`);
  return selectedImage;
};

/**
 * 检查缓存是否加载完成
 */
export const isCacheLoaded = (): boolean => {
  return imagesLoaded;
};

/**
 * 清除缓存（用于调试或重置）
 */
export const clearCache = () => {
  imageCache.clear();
  imagesLoaded = false;
  console.log('[图片缓存] 内存缓存已清除（不再使用localStorage）');
};
