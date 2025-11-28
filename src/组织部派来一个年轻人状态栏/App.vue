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

// ✅ 默认选中第一个角色（{{user}}）
const defaultActiveChar = computed(() => {
  return characterNames.value.length > 0 ? characterNames.value[0] : '';
});

// ✅ 清理后的角色名列表（用于显示）
const cleanedCharacterNames = computed(() => {
  return characterNames.value.map(name => cleanCharName(name));
});
const activeCharData = computed<CharacterData | null>(() => {
  if (!activeChar.value) return null;
  // ✅ 从当前选中的角色名获取数据（{{user}} 已经被酒馆替换为实际用户名）
  const data = statData.value.角色?.[activeChar.value];
  console.log(`[数据] 从"${activeChar.value}"获取数据`);
  return data || null;
});

// ✅ 清理角色名函数 - 提取纯名字，去除额外信息
const cleanCharName = (name: string) => {
  if (!name) return '';

  // 去除括号及括号内的所有内容：藤原千惠 (东京某大型商社的社长千金) → 藤原千惠
  let cleaned = name.replace(/\s*\([^)]*\)\s*/g, '');

  // 去除可能的冒号和后续内容：藤原千惠: 某角色 → 藤原千惠
  cleaned = cleaned.replace(/:\s*.*$/, '');

  // ✅ 特殊处理：{{user}} 硬解码为 陆副厂长
  if (cleaned.includes('{{user}}') || cleaned.includes('user') || cleaned === '用户') {
    cleaned = cleaned.replace(/{{user}}|user|用户/gi, '陆副厂长');
  }

  // ✅ 去除数字后缀（保持与缓存键一致）：小哥哥1 → 小哥哥
  cleaned = cleaned.replace(/\d+$/, '');

  // 去除前后空格
  cleaned = cleaned.trim();

  return cleaned;
};

// ✅ 图片缓存系统 - 直接加载 image 目录
const imageMap = new Map<string, string[]>(); // key: 角色名, value: 图片URL列表（base64）
const isPreloading = ref(false);
const imagesLoaded = ref(false); // ✅ 图片缓存是否加载完成

/**
 * 加载 GitHub image 目录下的所有图片
 */
const loadAllImages = async () => {
  if (isPreloading.value) return;
  isPreloading.value = true;

  console.log('[照片缓存] 开始加载 image 目录...');

  try {
    // 使用 GitHub API 获取目录内容
    const response = await fetch('https://api.github.com/repos/xuexix-alt/meituan-tavern-xjia/contents/image');
    const files = await response.json();

    // 过滤出 PNG 图片文件
    const pngFiles = files.filter((file: any) => file.name.toLowerCase().endsWith('.png'));

    console.log(`[照片缓存] 发现 ${pngFiles.length} 张图片`);

    // 并行加载所有图片
    await Promise.all(
      pngFiles.map(async (file: any) => {
        // 加载图片到缓存
        await loadImageToCache(file.name);
      }),
    );

    console.log(`[照片缓存] 加载完成！缓存了 ${imageMap.size} 个角色的图片`);
    imagesLoaded.value = true; // ✅ 标记缓存加载完成
    isPreloading.value = false;
  } catch (e) {
    console.error('[照片缓存] 加载失败:', e);
    isPreloading.value = false;
  }
};

/**
 * 加载单张图片到缓存
 */
const loadImageToCache = async (fileName: string): Promise<void> => {
  return new Promise(resolve => {
    const CDN_PREFIX = 'https://testingcf.jsdelivr.net/gh/xuexix-alt/meituan-tavern-xjia@main/image';
    const url = `${CDN_PREFIX}/${fileName}`;

    // 提取角色名（去除 .png 和数字后缀）
    const charName = extractCharName(fileName);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // ✅ 转换为 base64 存储到缓存
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');

        // 添加到角色的图片列表中
        if (!imageMap.has(charName)) {
          imageMap.set(charName, []);
        }
        imageMap.get(charName)?.push(dataUrl);

        console.log(`[照片缓存] ${charName}: ${fileName}`);
        resolve();
      } catch (e) {
        console.warn(`[照片缓存] 缓存失败: ${fileName}`, e);
        resolve();
      }
    };

    img.onerror = () => {
      console.log(`[照片缓存] 跳过不存在的图片: ${fileName}`);
      resolve();
    };

    img.src = url;
  });
};

/**
 * 从文件名提取角色名
 * 例如：
 *   "丁小芹1.png" -> "丁小芹"
 *   "藤原千惠.png" -> "藤原千惠"
 *   "林婉仪23.png" -> "林婉仪"
 */
const extractCharName = (fileName: string): string => {
  // 去除扩展名
  let name = fileName.replace(/\.png$/i, '');

  // 去除数字后缀（支持多位数）
  name = name.replace(/\d+$/, '');

  return name;
};

/**
 * 获取当前角色的随机图片
 */
const currentPhotoUrl = computed(() => {
  // ✅ 只有在缓存加载完成后才返回图片
  if (!imagesLoaded.value) {
    return '';
  }

  let imageKey = '';

  // ✅ 第一个角色（{{user}}）：永远显示陆副厂长的图片
  if (activeChar.value === '{{user}}' || characterNames.value[0] === activeChar.value) {
    imageKey = '陆副厂长';
    console.log(`[照片] 第一个角色，显示"陆副厂长"的图片`);
  } else {
    // ✅ 其他角色：使用角色同名的图片
    imageKey = cleanCharName(activeChar.value);
    console.log(`[照片] 其他角色，显示"${imageKey}"的图片`);
  }

  const images = imageMap.get(imageKey);
  if (images && images.length > 0) {
    // 随机选择一张
    const randomIndex = Math.floor(Math.random() * images.length);
    const selectedImage = images[randomIndex];
    console.log(`[照片] 从"${imageKey}"缓存随机选择第 ${randomIndex + 1} 张图片（共 ${images.length} 张）`);
    return selectedImage;
  }

  console.log(`[照片] ${imageKey}: 缓存中暂无图片，暂不显示`);
  return '';
});

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

const switchCharacter = (name: string) => {
  console.log(`[照片] 切换角色: "${name}"`);
  activeChar.value = name;
  isImageLoading.value = true; // 切换时重置加载状态
  // 切换角色后调整高度
  nextTick(adjustHeight);
};

const handleImageLoad = () => {
  isImageLoading.value = false;
  console.log('[照片] 图片加载成功');
  // 图片加载完可能影响高度
  nextTick(() => setTimeout(adjustHeight, 100));
};

const handleImageError = (e: Event) => {
  isImageLoading.value = false;
  const img = e.target as HTMLImageElement;
  console.warn('[照片] 图片加载失败:', img.src);
  // 使用缓存系统后，不再需要复杂的重试逻辑
};

const toggleThemeModal = () => {
  showThemeModal.value = !showThemeModal.value;
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

onMounted(() => {
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

  // 5. 立即加载所有图片（页面加载时就加载）
  loadAllImages();
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();

  // ✅ 清理图片缓存
  imageMap.clear();
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
