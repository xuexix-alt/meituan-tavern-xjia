<template>
  <main class="glass-container" :data-theme="currentTheme" ref="containerRef">
    <!-- 顶部功能区 -->
    <header class="header-section">
      <div class="header-content">
        <h2 class="section-title">
          <span class="icon-pulse">📊</span>
          <span class="title-text">状态监视器</span>
        </h2>
        <div class="header-actions">
          <button class="icon-btn refresh-btn" @click="handleManualRefresh" title="强制刷新数据">
            <span>🔄</span>
          </button>
          <button class="icon-btn theme-toggle" @click="toggleThemeModal" title="显示设置">
            <span class="gear-icon">⚙️</span>
          </button>
        </div>
      </div>

      <!-- 基础信息卡片 -->
      <div class="info-layout">
        <div class="global-info-bar">
          <div class="info-item chapter">
            <span class="icon">📖</span>
            <div class="info-content">
              <span class="label">当前章节</span>
              <span class="text">{{ statData.章节 || '等待数据...' }}</span>
            </div>
          </div>
          <div class="info-item time">
            <span class="icon">🕐</span>
            <div class="info-content">
              <span class="label">世界时间</span>
              <span class="text">{{ statData.时间 || '未知时间' }}</span>
            </div>
          </div>
          <div class="info-item location">
            <span class="icon">📍</span>
            <div class="info-content">
              <span class="label">当前地点</span>
              <span class="text">{{ statData.当前地点 || '未知地点' }}</span>
            </div>
          </div>
        </div>

        <!-- 角色照片区 -->
        <div class="photo-section">
          <div
            class="photo-frame"
            :class="{
              'has-photo': currentPhotoUrl && imagesLoaded,
              loading: isImageLoading || !imagesLoaded,
            }"
            @click="handlePhotoClick"
          >
            <div v-if="isImageLoading || !imagesLoaded" class="loading-spinner"></div>
            <img
              v-if="currentPhotoUrl"
              :src="currentPhotoUrl"
              :alt="activeChar"
              class="char-photo"
              @error="handleImageError"
              @load="handleImageLoad"
            />
            <div v-else-if="imagesLoaded" class="photo-placeholder">
              <span class="placeholder-icon">👤</span>
              <span class="placeholder-text">NO IMAGE</span>
            </div>
            <div v-else class="photo-placeholder">
              <span class="placeholder-icon">⏳</span>
              <span class="placeholder-text">LOADING...</span>
            </div>
          </div>
          <div class="photo-caption">
            <span class="char-name">{{ cleanCharName(activeChar || '未知角色') }}</span>
            <span class="char-status-dot" :class="{ active: hasCharacters }"></span>
          </div>
        </div>
      </div>
    </header>

    <!-- 角色详情区 -->
    <section class="content-section">
      <!-- 详情内容 -->
      <Transition name="fade-slide" mode="out-in">
        <div :key="activeChar" class="tab-content" v-if="activeCharData">
          <div class="info-grid">
            <!-- 人物选择卡片 - 全宽 -->
            <div class="card full-width character-selector-card">
              <h3>👥 人物选择</h3>
              <nav class="tabs-nav">
                <button
                  v-for="(cleanName, index) in cleanedCharacterNames"
                  :key="characterNames[index]"
                  class="tab-button"
                  :class="{ active: characterNames[index] === activeChar }"
                  @click="switchCharacter(characterNames[index])"
                >
                  {{ cleanName }}
                  <!-- ✅ 显示清理后的名字 -->
                </button>
              </nav>
            </div>
            <!-- 心理与姿态 (全宽) -->
            <div class="card full-width thought-card" v-if="activeCharData.当前想法">
              <h3>💭 内心想法</h3>
              <div class="text-box thought">{{ activeCharData.当前想法 }}</div>
            </div>

            <div class="card full-width action-card" v-if="activeCharData.姿势">
              <h3>🏃 当前姿态</h3>
              <div class="text-box action">{{ activeCharData.姿势 }}</div>
            </div>

            <!-- 基础属性 -->
            <div class="card info-card two-column-split">
              <h3>📋 状态面板</h3>
              <div class="detail-list">
                <div class="detail-item" v-for="(val, key) in basicInfo" :key="key">
                  <span class="label">{{ key.replace(/^[^\u4e00-\u9fa5]+/, '') }}</span>
                  <span class="value">{{ val || '--' }}</span>
                </div>
              </div>
            </div>

            <!-- 外观特征 -->
            <div class="card appearance-card two-column-split">
              <h3>👤 外观特征</h3>
              <div class="appearance-list">
                <div class="appearance-item" v-for="(val, key) in appearanceInfo" :key="key">
                  <div class="appearance-label">{{ key.replace(/^[^\u4e00-\u9fa5]+/, '') }}</div>
                  <div class="appearance-text">{{ val || '--' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📡</div>
          <p v-if="!imagesLoaded">加载中...</p>
          <p v-else>请选择一个角色</p>
          <small v-if="!imagesLoaded">正在同步酒馆数据</small>
          <small v-else>点击上方选项卡查看角色信息</small>
        </div>
      </Transition>
    </section>

    <!-- 设置弹窗 -->
    <Transition name="fade">
      <div v-if="showThemeModal" class="modal-overlay" @click="showThemeModal = false">
        <div class="modal-content glass-panel" @click.stop>
          <div class="modal-header">
            <h3>界面设置</h3>
            <button class="btn-close" @click="showThemeModal = false">×</button>
          </div>
          <div class="form-group">
            <label>🎨 主题风格</label>
            <select v-model="currentTheme">
              <option value="default">✨ 极光玻璃 (默认)</option>
              <option value="dark">🌑 深空幽蓝</option>
              <option value="classic_vintage">📜 羊皮卷轴</option>
            </select>
          </div>
        </div>
      </div>
    </Transition>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { StatData, CharacterData } from './types';

// ✅ 并行加载图片函数（改进版）
// 一次性发起所有请求，大幅提升加载速度
// ⚠️ 仅加载 JPG 格式，避免加载体积巨大的 PNG
// 💡 使用 Cloudflare Pages 托管，无缓存问题，国内访问快
const loadImagesParallel = async (roleName: string): Promise<string[]> => {
  // Cloudflare Pages 完整自动部署，无缓存烦恼
  const CDN_PREFIX = 'https://meituan-tavern-xjia.pages.dev/image';
  // 备选方案（如果 pages.dev 域名被屏蔽）：
  // - 绑定自定义域名后可以在 Cloudflare 后台配置
  const maxAttempts = 5; // 尝试前5个数字后缀

  // 生成所有可能的 URL（仅 JPG 格式）
  const imageUrls: Array<{ url: string; name: string }> = [];

  // 基础文件名（无数字后缀）- 仅加载 JPG
  imageUrls.push({
    url: `${CDN_PREFIX}/${encodeURIComponent(roleName)}.jpg`,
    name: `${roleName}.jpg`,
  });

  // 带数字后缀的文件 - 仅加载 JPG
  for (let i = 1; i <= maxAttempts; i++) {
    imageUrls.push({
      url: `${CDN_PREFIX}/${encodeURIComponent(roleName)}${i}.jpg`,
      name: `${roleName}${i}.jpg`,
    });
  }

  console.log(`[图片] 🔍 开始并行加载 "${roleName}" 的所有 JPG 图片 (共 ${imageUrls.length} 个 URL)...`);

  // 并行发起所有请求
  const results = await Promise.allSettled(
    imageUrls.map(({ url, name }) => loadImageAsBlob(url, name))
  );

  // 筛选成功的图片
  const blobUrls: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      blobUrls.push(result.value);
      console.log(`[图片] ✅ 成功加载: ${imageUrls[index].name}`);
    }
  });

  console.log(`[图片] 📊 共找到 ${blobUrls.length} 张 JPG 图片`);
  return blobUrls;
};

// 从 URL 加载单个图片为 Blob URL
const loadImageAsBlob = (url: string, fileName: string): Promise<string | null> => {
  return new Promise((resolve) => {
    // 使用 fetch 加载图片，避免 Canvas 转换的性能开销
    fetch(url, { mode: 'cors' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        // 创建 Blob URL，比 Base64 快得多
        const blobUrl = URL.createObjectURL(blob);
        console.log(
          `[图片] ✅ 成功加载并转换: ${fileName} (${(blob.size / 1024).toFixed(2)} KB)`
        );
        resolve(blobUrl);
      })
      .catch((error) => {
        console.warn(`[图片] ❌ 加载失败: ${fileName}`, error.message);
        resolve(null);
      });
  });
};

// ✅ 改进的图片缓存获取函数
const getImageFromCache = async (roleName: string): Promise<string | null> => {
  try {
    // 检查缓存是否已加载（使用sessionStorage防止同一会话重复加载）
    const cacheKey = `image_cache_${roleName}`;
    const cachedImage = sessionStorage.getItem(cacheKey);

    if (cachedImage) {
      console.log(`[图片] ✅ 从缓存获取 "${roleName}" 的图片`);
      return cachedImage;
    }

    console.log(
      `[图片] 📡 缓存未命中，正在加载 "${roleName}" 的图片...（使用并行加载，速度更快）`
    );

    // 使用并行加载获取所有可用图片
    const blobUrls = await loadImagesParallel(roleName);

    if (blobUrls.length === 0) {
      console.log(`[图片] ❌ "${roleName}" 没有找到任何图片文件`);
      return null;
    }

    // 随机选择一张图片
    const randomIndex = Math.floor(Math.random() * blobUrls.length);
    const selectedImage = blobUrls[randomIndex];

    console.log(
      `[图片] 🎲 为 "${roleName}" 随机选择第 ${randomIndex + 1} 张图片（共 ${blobUrls.length} 张）`
    );

    // 存储到sessionStorage（每个角色固定一张，避免每次都重新加载）
    sessionStorage.setItem(cacheKey, selectedImage);
    console.log(`[图片] 💾 已缓存 "${roleName}" 的图片`);

    // 清理其他未使用的 Blob URL（防止内存泄漏）
    blobUrls.forEach((url, index) => {
      if (index !== randomIndex) {
        URL.revokeObjectURL(url);
      }
    });

    return selectedImage;
  } catch (e) {
    console.warn(`[图片] 获取图片失败:`, e);
    return null;
  }
};

// --- 状态管理 ---
const containerRef = ref<HTMLElement | null>(null);
const statData = ref<StatData>({
  章节: '示例章节',
  时间: '示例时间',
  当前地点: '示例地点',
  角色: {
    陆副厂长: {
      年龄: 25,
      身份: '示例身份',
      与user关系: '示例关系',
      所处位置: '示例位置',
      当前想法: '示例想法：请在酒馆中安装酒馆助手扩展以获取实时数据',
      姿势: '示例姿势',
      衣着: '示例衣着',
      胸乳: '示例胸乳',
      内衣: '示例内衣',
      私处: '示例私处',
      鞋袜: '示例鞋袜',
      照片: 'image/陆副厂长',
    },
  },
});
const activeChar = ref<string>(''); // 初始为空，等待初始化
const showThemeModal = ref(false);
const currentTheme = ref(localStorage.getItem('tavern_helper_theme') || 'default');
const isImageLoading = ref(false);

// --- 计算属性 ---
const characterNames = computed(() => Object.keys(statData.value.角色 || {}));
const hasCharacters = computed(() => characterNames.value.length > 0);

// ✅ 图片加载状态
const imagesLoaded = computed(() => {
  // 检查是否有缓存的图片
  const currentIndex = characterNames.value.indexOf(activeChar.value);
  if (currentIndex === -1) return false;

  const imageKey = mapRoleToImageName(activeChar.value, currentIndex);
  const cacheKey = `image_cache_${imageKey}`;
  return sessionStorage.getItem(cacheKey) !== null;
});

// ✅ 默认选中第一个角色（{{user}}）
const defaultActiveChar = computed(() => {
  return characterNames.value.length > 0 ? characterNames.value[0] : '';
});

// ✅ 角色名列表（用于显示，直接使用酒馆解析后的原名）
// 例如：["小哥哥", "苏晴", "丁小芹"] - 图片文件名与角色名一致
const cleanedCharacterNames = computed(() => {
  return characterNames.value.map(name => cleanCharName(name));
});
const activeCharData = computed<CharacterData | null>(() => {
  if (!activeChar.value) return null;
  // ✅ 从当前选中的角色名获取数据（{{user}} 已被酒馆替换为实际用户名）
  const data = statData.value.角色?.[activeChar.value];
  console.log(`[数据] 从"${activeChar.value}"获取数据`);
  return data || null;
});

// ✅ 简化版清理角色名函数（仅用于安全检查）
const cleanCharName = (name: string) => {
  if (!name) return '';
  // 只做基本的安全检查和空格清理
  return name.trim();
};

// ✅ 将角色名映射到图片名
// 注意：第一个角色无论用户名是什么，都使用"陆副厂长"的图片
const mapRoleToImageName = (roleName: string, roleIndex: number): string => {
  // 第一个角色（索引0）永远映射为"陆副厂长"（玩家角色{{user}}）
  // 不管用户名是"小哥哥"、"张三"还是其他，都使用"陆副厂长"图片
  if (roleIndex === 0) {
    return '陆副厂长';
  }

  // ✅ 其他角色直接使用角色名作为图片名
  // 苏晴 → 苏晴
  // 丁小芹 → 丁小芹
  // 林婉仪 → 林婉仪
  // 王春燕 → 王春燕
  // 白慧 → 白慧

  return cleanCharName(roleName);
};

// ✅ 图片缓存已由独立的脚本管理器处理
// 前端界面直接从全局缓存获取图片



// ✅ 当前显示的图片URL（响应式）
const currentPhotoUrl = ref<string>('');

// ✅ 预加载缓存（后台预加载下一个角色的图片，消除切换延迟）
const preloadCache = ref<Map<string, string>>(new Map());

/**
 * 后台预加载指定角色的图片
 * 不会阻塞 UI，用户切换时可以立即显示
 */
const preloadNextCharacter = async (nextCharName: string) => {
  if (!nextCharName) return;

  // 如果已经在缓存中，跳过
  if (preloadCache.value.has(nextCharName)) {
    console.log(`[预加载] ⏭️ "${nextCharName}" 已在预加载缓存中，跳过`);
    return;
  }

  // 如果已经在 sessionStorage 中，跳过
  const cacheKey = `image_cache_${nextCharName}`;
  if (sessionStorage.getItem(cacheKey)) {
    console.log(`[预加载] ⏭️ "${nextCharName}" 已在 sessionStorage 中，跳过`);
    return;
  }

  console.log(`[预加载] 🚀 后台预加载 "${nextCharName}" 的图片...`);

  try {
    // 使用 loadImagesParallel 并行加载所有图片
    const blobUrls = await loadImagesParallel(nextCharName);

    if (blobUrls.length === 0) {
      console.log(`[预加载] ❌ "${nextCharName}" 没有可用的图片`);
      return;
    }

    // 随机选择一张图片
    const randomIndex = Math.floor(Math.random() * blobUrls.length);
    const selectedImage = blobUrls[randomIndex];

    // 存储到预加载缓存
    preloadCache.value.set(nextCharName, selectedImage);
    console.log(
      `[预加载] ✅ "${nextCharName}" 预加载完成 (选择第 ${randomIndex + 1} 张，共 ${blobUrls.length} 张)`
    );

    // 清理其他未使用的 Blob URL
    blobUrls.forEach((url, index) => {
      if (index !== randomIndex) {
        URL.revokeObjectURL(url);
      }
    });
  } catch (e) {
    console.warn(`[预加载] ❌ 预加载 "${nextCharName}" 失败:`, e);
  }
};

/**
 * 加载当前角色的图片
 * 优先使用预加载缓存，其次使用 sessionStorage 缓存
 */
const loadCurrentPhoto = async () => {
  // ✅ 获取当前角色在列表中的索引
  const currentIndex = characterNames.value.indexOf(activeChar.value);
  if (currentIndex === -1) {
    console.log(`[照片] 当前角色"${activeChar.value}"不在角色列表中`);
    currentPhotoUrl.value = '';
    return;
  }

  // ✅ 获取角色名（作为图片文件名）
  // {{user}} 已被酒馆替换为实际用户名，如"小哥哥"
  const imageKey = mapRoleToImageName(activeChar.value, currentIndex);

  console.log(`[照片] 角色索引: ${currentIndex}, 角色名: "${activeChar.value}", 图片名: "${imageKey}"`);

  // ✅ 优先查询预加载缓存
  if (preloadCache.value.has(imageKey)) {
    const preloadedUrl = preloadCache.value.get(imageKey);
    currentPhotoUrl.value = preloadedUrl || '';
    console.log(`[照片] ${imageKey}: 从预加载缓存加载 ⚡`);

    // 加载完成后预加载下一个角色
    const nextIndex = (currentIndex + 1) % characterNames.value.length;
    const nextCharName = characterNames.value[nextIndex];
    const nextImageKey = mapRoleToImageName(nextCharName, nextIndex);
    preloadNextCharacter(nextImageKey);
    return;
  }

  // ✅ 从独立缓存中获取图片
  const imageUrl = await getImageFromCache(imageKey);
  if (imageUrl) {
    currentPhotoUrl.value = imageUrl;
    console.log(`[照片] ${imageKey}: 加载成功`);

    // 加载完成后预加载下一个角色
    const nextIndex = (currentIndex + 1) % characterNames.value.length;
    const nextCharName = characterNames.value[nextIndex];
    const nextImageKey = mapRoleToImageName(nextCharName, nextIndex);
    preloadNextCharacter(nextImageKey);
  } else {
    currentPhotoUrl.value = '';
    console.log(`[照片] ${imageKey}: 暂无图片，暂不显示`);
  }
};

// 基础信息映射
const basicInfo = computed(() => ({
  '🎂 年龄': activeCharData.value?.年龄,
  '💼 身份': activeCharData.value?.身份,
  '🤝 关系': activeCharData.value?.与user关系,
  '📍 位置': activeCharData.value?.所处位置,
}));

// 外观信息映射
const appearanceInfo = computed(() => ({
  '👔 衣着': activeCharData.value?.衣着,
  '🌸 胸乳': activeCharData.value?.胸乳,
  '👙 内衣': activeCharData.value?.内衣,
  '🔒 私处': activeCharData.value?.私处,
  '👠 鞋袜': activeCharData.value?.鞋袜,
}));

// --- 核心逻辑 ---

/**
 * 核心数据获取函数
 * 兼容多种 API：getCurrentMessageId / getLastMessageId
 */
const fetchData = async () => {
  try {
    // 检查酒馆助手接口是否可用
    const hasGetCurrent = typeof getCurrentMessageId === 'function';
    const hasGetLast = typeof getLastMessageId === 'function';
    const hasGetMsgs = typeof getChatMessages === 'function';

    if (!hasGetMsgs) {
      console.warn('[酒馆助手] 接口未加载');
      return;
    }

    let targetMsg = null;

    // 尝试多种方式获取最新消息
    if (hasGetCurrent) {
      // 方式 1: getCurrentMessageId (常见于旧版本)
      const msgId = getCurrentMessageId();
      if (msgId) {
        const msgs = getChatMessages(msgId);
        targetMsg = msgs && msgs.length > 0 ? msgs[0] : null;
      }
    } else if (hasGetLast) {
      // 方式 2: getLastMessageId (常见于新版本)
      const lastId = getLastMessageId();
      if (lastId) {
        const msgs = getChatMessages(lastId);
        targetMsg = msgs && msgs.length > 0 ? msgs[0] : null;
      }
    }

    if (targetMsg?.data?.stat_data) {
      console.log('[酒馆助手] 成功获取数据');
      statData.value = targetMsg.data.stat_data;

      // 等待 characterNames 计算属性更新后再检查
      await nextTick();

      // 如果当前没有选中角色，且有角色数据，默认选中第一个
      if (!activeChar.value && characterNames.value.length > 0) {
        console.log(`[默认] 自动选中第一个角色: "${characterNames.value[0]}"`);
        activeChar.value = characterNames.value[0];
      }

      // 数据更新后调整高度（延迟等待 DOM 更新）
      await nextTick();
      adjustHeight();
    }
  } catch (e) {
    console.warn('数据同步失败:', e);
  }
};

const handleManualRefresh = () => {
  fetchData();
  isImageLoading.value = true;
  // 模拟加载动画
  const btn = document.querySelector('.refresh-btn');
  btn?.classList.add('spinning');
  setTimeout(() => {
    btn?.classList.remove('spinning');
    isImageLoading.value = false;
  }, 1000);
};

const switchCharacter = async (name: string) => {
  console.log(`[切换] 💫 切换角色: "${name}"`);

  // 设置加载状态
  isImageLoading.value = true;

  try {
    activeChar.value = name;

    // 获取新角色的索引，用于映射图片文件名
    const newIndex = characterNames.value.indexOf(name);
    const imageKey = mapRoleToImageName(name, newIndex);

    // 检查预加载缓存，如果已预加载则直接使用
    if (preloadCache.value.has(imageKey)) {
      const preloadedUrl = preloadCache.value.get(imageKey);
      currentPhotoUrl.value = preloadedUrl || '';
      console.log(`[切换] ⚡ 使用预加载的图片，零延迟切换完成`);
      isImageLoading.value = false;

      // 预加载下一个角色
      const nextIndex = (newIndex + 1) % characterNames.value.length;
      const nextCharName = characterNames.value[nextIndex];
      const nextImageKey = mapRoleToImageName(nextCharName, nextIndex);
      preloadNextCharacter(nextImageKey);
      return;
    }

    // 如果没有预加载，则加载新角色的图片
    await loadCurrentPhoto();
    console.log(`[切换] ✅ 切换完成: "${name}"`);
  } catch (e) {
    console.error(`[切换] ❌ 切换失败:`, e);
  } finally {
    isImageLoading.value = false;

    // 切换角色后调整高度
    nextTick(adjustHeight);
  }
};

const handleImageLoad = () => {
  isImageLoading.value = false;
  console.log('[照片] ✅ 图片加载成功并显示在页面中');
  // 图片加载完可能影响高度
  nextTick(() => setTimeout(adjustHeight, 100));
};

const handleImageError = (e: Event) => {
  isImageLoading.value = false;
  const img = e.target as HTMLImageElement;
  console.warn('[照片] ⚠️ 页面图片加载失败（但缓存中存在该图片URL）:', {
    src: img.src.substring(0, 50) + '...',
    reason: 'Blob URL 可能已被释放或浏览器环境变化',
  });

  // 尝试重新加载当前角色的图片（这次会跳过预加载缓存，从源头重新加载）
  console.log('[照片] 🔄 尝试重新加载图片...');
  loadCurrentPhoto().catch((err) => {
    console.error('[照片] ❌ 重新加载失败:', err);
  });
};

const toggleThemeModal = () => {
  showThemeModal.value = !showThemeModal.value;
};

const handlePhotoClick = () => {
  // 可以在这里添加点击照片的交互逻辑，如：
  // - 切换到下一张图片
  // - 打开大图预览
  // - 重新随机选择图片
  // 目前暂不实现具体功能
};

// --- 高度自适应逻辑 (优化版) ---

const adjustHeight = () => {
  if (!containerRef.value) return;

  // 使用 requestAnimationFrame 避免布局抖动
  requestAnimationFrame(() => {
    const height = containerRef.value?.scrollHeight || 300;
    const finalHeight = Math.max(height, 300) + 20; // 增加一点缓冲

    // 发送消息给父级 (酒馆扩展标准做法)
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'adjustIframeHeight',
          height: finalHeight,
          scriptId: 'status-bar',
        },
        '*',
      );
    }
  });
};

// 监听器
let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  // 1. 初始化数据
  fetchData();

  // 2. 注册事件监听 (使用规范的 eventOn)
  if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
    // 监听消息更新和接收
    eventOn(tavern_events.MESSAGE_UPDATED, fetchData);
    eventOn(tavern_events.MESSAGE_RECEIVED, fetchData);
    eventOn(tavern_events.CHAT_CHANGED, fetchData);
  }

  // 3. 启动高度监听
  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => adjustHeight());
    resizeObserver.observe(containerRef.value);
    resizeObserver.observe(document.body); // 同时也监听 body 变化
  }

  // 4. 恢复主题
  document.documentElement.setAttribute('data-theme', currentTheme.value);

  // 5. 等待数据加载完成后，加载图片
  const unwatch = watch(
    () => statData.value.角色,
    async (newRoles) => {
      if (newRoles && Object.keys(newRoles).length > 0) {
        // 等待角色自动选中完成后再加载图片
        if (activeChar.value) {
          await loadCurrentPhoto();
          unwatch(); // 只执行一次
        }
      }
    },
    { immediate: true }
  );

  // 同时监听 activeChar 的变化，一旦设置就加载图片
  const unwatchChar = watch(activeChar, async (newChar) => {
    if (newChar && characterNames.value.length > 0) {
      await loadCurrentPhoto();
      unwatchChar(); // 只执行一次
    }
  });
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();

  // ✅ 清理预加载缓存中的 Blob URL，防止内存泄漏
  preloadCache.value.forEach((blobUrl) => {
    URL.revokeObjectURL(blobUrl);
  });
  preloadCache.value.clear();

  console.log('[清理] 已释放预加载缓存中的所有 Blob URL');
});

watch(activeChar, () => {
  nextTick(adjustHeight);
});

watch(currentTheme, val => {
  localStorage.setItem('tavern_helper_theme', val);
  document.documentElement.setAttribute('data-theme', val);
  nextTick(adjustHeight);
});
</script>

<style lang="scss" scoped>
/*
  局部样式补充
  大部分核心样式应在 index.scss 中
*/

.header-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--glass-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;

  .icon-pulse {
    font-size: 1.4em;
    animation: pulse 3s infinite ease-in-out;
  }

  .title-text {
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--c-text-main) 0%, var(--c-text-sub) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--glass-panel);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s var(--ease-spring);
  font-size: 1.1rem;

  &:hover {
    background: var(--c-primary);
    border-color: var(--c-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--glass-shadow);

    span {
      filter: brightness(2);
    }
  }

  &.spinning span {
    animation: spin 1s linear infinite;
  }
}

/* 信息布局：左侧信息，右侧照片 */
.info-layout {
  display: grid;
  grid-template-columns: 2fr 1fr; /* 调整比例：信息2/3，照片1/3 */
  gap: 24px;
  align-items: start;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'photo'
      'info';

    .photo-section {
      grid-area: photo;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 16px;
    }
    .global-info-bar {
      grid-area: info;
    }

    .photo-frame {
      width: 100px;
      height: 100px;
      aspect-ratio: 0.67;
    }
  }
}

.global-info-bar {
  display: flex;
  flex-direction: column;
  gap: 16px; /* 增大卡片间距 */
}

.info-item {
  display: flex;
  align-items: center;
  gap: 14px; /* 增大图标与文字间距 */
  padding: 14px 18px; /* 增大内边距 */
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  transition: transform 0.2s;

  &:hover {
    transform: translateX(4px);
    background: var(--glass-highlight);
  }

  .icon {
    font-size: 1.4rem;
  }

  .info-content {
    display: flex;
    flex-direction: column;
  }

  .label {
    font-size: 0.7rem;
    color: var(--c-text-mute);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .text {
    font-weight: 600;
    color: var(--c-text-main);
  }
}

/* 照片区域优化 */
.photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px; /* 增大间距 */
  padding-top: 4px; /* 顶部留白 */
}

.photo-frame {
  width: 100%;
  /* ✅ 适配竖图：848*1264 ≈ 0.67比例 */
  aspect-ratio: 0.67;
  max-height: 450px; /* 增大最大高度限制 */
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 3px solid var(--glass-border);
  position: relative;
  background: var(--glass-panel);
  box-shadow: var(--glass-shadow);
  transition: all 0.3s;

  &.has-photo {
    border-color: var(--c-primary);
  }

  .char-photo {
    width: 100%;
    height: 100%;
    /* ✅ 重要：contain 保持图片完整显示，cover 填充容器 */
    object-fit: contain;
    transition: transform 0.5s;
  }

  &:hover .char-photo {
    transform: scale(1.05);
  }

  .photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--c-text-mute);
    background: linear-gradient(135deg, var(--glass-bg) 0%, var(--glass-panel) 100%);

    .placeholder-icon {
      font-size: 3rem;
      opacity: 0.4;
    }
    .placeholder-text {
      font-size: 0.75rem;
      font-weight: 700;
      margin-top: 8px;
      opacity: 0.6;
      letter-spacing: 0.1em;
    }
  }

  .loading-spinner {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(2px);
    z-index: 2;
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      border: 2px solid var(--c-primary);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: -10px 0 0 -10px;
    }
  }
}

.photo-caption {
  display: flex;
  align-items: center;
  gap: 8px;

  .char-name {
    font-weight: 700;
    font-size: 1rem; /* 增大字体 */
    color: var(--c-text-main);
  }

  .char-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c-text-mute);

    &.active {
      background: hsl(var(--hue-success) 80% 60%);
      box-shadow: 0 0 8px hsl(var(--hue-success) 80% 60%);
    }
  }
}

/* 标签页 */
.tabs-nav {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    height: 0;
  }

  .tab-button {
    padding: 6px 16px;
    border-radius: 20px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--c-text-sub);
    font-size: 0.9rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.3s;

    &:hover {
      background: var(--glass-highlight);
    }

    &.active {
      background: var(--c-primary);
      color: white;
      box-shadow: 0 4px 12px hsla(var(--hue-primary), 80%, 60%, 0.3);
      font-weight: 600;
    }
  }
}

/* 📝 标题区域微调 */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: calc(var(--space-unit) * 1.5);
  padding-bottom: var(--space-unit);
  border-bottom: 1px solid var(--glass-border);

  h2 {
    margin-bottom: 0;
  }

  .badge {
    font-size: 0.85rem;
    padding: 4px 12px;
    background: var(--c-primary);
    color: white;
    border-radius: 20px;
    font-weight: 600;
    box-shadow: 0 4px 12px hsla(var(--hue-primary), 60%, 50%, 0.3);
  }
}

/* 🕸️ 核心网格布局 */
.info-grid {
  display: grid;
  /* 响应式列宽：最小 280px，自动填满，确保两列布局 */
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  /* 统一间距 */
  gap: var(--space-unit);
  /* 自动对齐行高 */
  align-items: stretch;
}

/* 两列平分布局专用样式 */
.two-column-split {
  /* 在桌面端强制平分第一行宽度 */
  /* 使用媒体查询确保移动端堆叠 */
}

/* 桌面端：状态面板和外观特征始终平分宽度 */
@media (min-width: 600px) {
  .info-grid .card.two-column-split:first-child {
    grid-column: 1;
  }

  .info-grid .card.two-column-split:last-child {
    grid-column: 2;
  }
}

/* 移动端：两个卡片堆叠，各占全宽 */
@media (max-width: 599px) {
  .info-grid .card.two-column-split {
    grid-column: 1 / -1;
  }
}

/* 🃏 通用卡片样式 - 优化版 */
.card {
  /* 玻璃拟态背景 (比容器稍深或稍浅以区分层级) */
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);

  /* 布局控制 */
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  /* 高度控制：确保视觉饱满 */
  min-height: 140px; /* 统一最小高度 */
  height: 100%; /* 填满 Grid 单元格高度 */

  /* 动效 */
  transition: all 0.3s var(--ease-spring);
  position: relative;
  overflow: hidden;

  /* 悬停微交互 */
  &:hover {
    transform: translateY(-4px) scale(1.01);
    background: var(--glass-highlight);
    box-shadow: 0 12px 24px -8px hsla(220, 20%, 10%, 0.1);
    border-color: var(--c-primary);
    z-index: 1;
  }

  /* 变体：全宽卡片 (跨越所有列) */
  &.full-width {
    grid-column: 1 / -1;
    min-height: auto; /* 根据内容自适应高度 */
    padding: calc(var(--space-unit) * 1.5);
  }

  /* 内部排版 */
  h3 {
    font-size: 0.85rem;
    color: var(--c-text-mute);
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  /* 数据强调样式 */
  .value {
    font-family: var(--font-sans);
    font-size: 2.2rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--c-text-main) 0%, var(--c-primary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.1;
  }
}

/* ✨ 变体：高亮卡片 (用于 HP/MP 等核心数据) */
.card.highlight {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--glass-panel) 0%, hsla(var(--hue-primary), 30%, 90%, 0.4) 100%);

  .card-icon {
    font-size: 2.5rem;
    opacity: 0.8;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .card-data {
    text-align: right;
  }
}

/* 🌑 深色模式适配 */
:root[data-theme='dark'] .status-bar-container {
  .card:hover {
    background: hsla(220, 20%, 20%, 0.6);
  }

  .card.highlight {
    background: linear-gradient(135deg, var(--glass-panel) 0%, hsla(var(--hue-primary), 30%, 20%, 0.4) 100%);
  }
}

/* 👥 人物选择卡片专用样式 */
.character-selector-card {
  .tabs-nav {
    margin-top: 8px;
    margin-bottom: 0;
  }
}

.text-box {
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  line-height: 1.6;

  &.thought {
    background: var(--bg-thought);
    color: var(--text-thought);
    border-left: 3px solid var(--text-thought);
  }

  &.action {
    background: var(--bg-action);
    color: var(--text-action);
    font-style: italic;
    border-left: 3px solid var(--text-action);
  }
}

.detail-list,
.appearance-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item,
.appearance-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dashed var(--glass-border);

  &:last-child {
    border-bottom: none;
  }

  /* 左侧标签：字体更小、颜色更淡 */
  .label,
  .appearance-label {
    font-size: 0.85rem;
    color: var(--c-text-mute);
    font-weight: 500;
    line-height: 1.4;
  }

  /* 右侧数值/描述：字体更大、颜色更深、更突出 */
  .value,
  .appearance-text {
    font-size: 1rem;
    font-weight: 600;
    text-align: right;
    line-height: 1.4;
  }

  /* 状态面板的数值使用发光字体 */
  .value {
    background: linear-gradient(135deg, var(--c-text-main) 0%, var(--c-primary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* 外观特征的文本也使用发光字体 */
  .appearance-text {
    background: linear-gradient(135deg, var(--c-text-main) 0%, var(--c-primary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--c-text-mute);

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 10px;
    opacity: 0.5;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
