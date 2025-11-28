<template>
  <main class="glass-container" :data-theme="currentTheme">
    <!-- 顶部功能区 -->
    <header class="header-section">
      <div class="header-content">
        <h2 class="section-title">
          <span class="icon-pulse">📋</span> 状态面板
        </h2>
        <button class="theme-toggle" @click="toggleThemeModal" title="显示设置">
          <span class="gear-icon">⚙️</span>
        </button>
      </div>

      <!-- 基础信息卡片 -->
      <div class="info-layout">
        <div class="global-info-bar">
          <div class="info-item chapter">
            <span class="icon">📖</span>
            <span class="text">{{ statData.章节 || '等待数据...' }}</span>
          </div>
          <div class="info-item time">
            <span class="icon">🕐</span>
            <span class="text">{{ statData.时间 || '未知时间' }}</span>
          </div>
          <div class="info-item location">
            <span class="icon">📍</span>
            <span class="text">{{ statData.当前地点 || '未知地点' }}</span>
          </div>
        </div>

        <!-- 角色照片区 -->
        <div class="photo-section">
          <div
            class="photo-frame"
            :class="{
              'has-photo': currentPhoto,
              'gallery-mode': isPhotoGalleryMode && photoCount > 1
            }"
            @click="handlePhotoClick"
            @dblclick="handlePhotoDoubleClick"
          >
            <img
              v-if="currentPhoto"
              :src="currentPhoto"
              :alt="`${activeChar} - ${currentPhotoNumber}`"
              loading="lazy"
              @error="handleImageError"
              @load="handleImageLoad"
            />
            <div v-else class="photo-placeholder">👤</div>

            <!-- 照片画廊模式指示器 -->
            <div v-if="isPhotoGalleryMode && photoCount > 1" class="photo-indicators">
              <!-- 照片计数器 -->
              <div class="photo-counter">{{ currentPhotoNumber }}</div>

              <!-- 切换按钮 -->
              <div class="photo-controls">
                <button
                  class="photo-btn photo-prev"
                  @click.stop="switchPhoto('prev')"
                  title="上一张 (←)"
                >
                  ◀
                </button>
                <button
                  class="photo-btn photo-next"
                  @click.stop="switchPhoto('next')"
                  title="下一张 (→)"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
          <div class="photo-caption">
            {{ activeChar || '...' }}
            <span v-if="isPhotoGalleryMode && photoCount > 1" class="photo-hint">
              (点击切换)
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- 角色详情区 -->
    <section v-if="hasCharacters" class="content-section">
      <!-- 标签导航 -->
      <nav class="tabs-nav">
        <button
          v-for="name in characterNames"
          :key="name"
          class="tab-button"
          :class="{ active: activeChar === name }"
          @click="activeChar = name"
        >
          {{ name }}
        </button>
      </nav>

      <!-- 详情内容 (带过渡动画) -->
      <Transition name="fade-slide" mode="out-in">
        <div :key="activeChar" class="tab-content" v-if="activeCharData">
          <div class="info-grid">
            <!-- 心理与姿态 -->
            <div class="card full-width thought-card">
              <h3>💭 内心想法</h3>
              <div class="text-box thought">{{ activeCharData.当前想法 || '...' }}</div>
            </div>
            <div class="card full-width action-card">
              <h3>🏃 当前姿势</h3>
              <div class="text-box action">{{ activeCharData.姿势 || '...' }}</div>
            </div>

            <!-- 基础属性 -->
            <div class="card">
              <h3>📋 基本信息</h3>
              <div class="detail-list">
                <div class="detail-item" v-for="(val, key) in basicInfo" :key="key">
                  <span class="label">{{ key }}</span>
                  <span class="value">{{ val || '--' }}</span>
                </div>
              </div>
            </div>

            <!-- 外观特征 -->
            <div class="card">
              <h3>👤 外观描述</h3>
              <div class="appearance-list">
                <div class="appearance-item" v-for="(val, key) in appearanceInfo" :key="key">
                  <div class="appearance-label">{{ key }}</div>
                  <div class="appearance-text">{{ val || '--' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <div v-else class="empty-state">
      <p>暂无角色数据，请在聊天中更新状态...</p>
    </div>

    <!-- 主题设置弹窗 -->
    <Transition name="fade">
      <div v-if="showThemeModal" class="modal-overlay" @click="showThemeModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>显示设置</h3>
            <button class="btn-close-icon" @click="showThemeModal = false">×</button>
          </div>
          <div class="form-group">
            <label>🎨 主题风格</label>
            <select v-model="currentTheme">
              <option value="default">✨ 现代玻璃 (默认)</option>
              <option value="dark">🌑 深邃夜空</option>
              <option value="classic_vintage">📜 经典羊皮纸</option>
            </select>
          </div>
          <div class="form-group">
            <label>🖼️ 照片轮播</label>
            <div class="toggle-switch">
              <input
                type="checkbox"
                id="auto-rotate"
                v-model="autoPhotoRotate"
                @change="toggleAutoRotate"
              />
              <label for="auto-rotate">
                <span>{{ autoPhotoRotate ? '自动轮播中' : '手动切换' }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { StatData, CharacterData } from './types';

// --- 类型声明补充 (避免 @ts-ignore) ---
declare const getCurrentMessageId: () => number;
declare const getChatMessages: (id: number) => any[];

// --- 状态管理 ---
const statData = ref<StatData>({});
const activeChar = ref<string>('');
const showThemeModal = ref(false);
const currentTheme = ref(localStorage.getItem('organization_theme') || 'default');
const autoPhotoRotate = ref(false); // 自动轮播照片
let pollingInterval: any = null;
let photoRotateInterval: any = null;

// --- 计算属性 ---
const characterNames = computed(() => Object.keys(statData.value.角色 || {}));
const hasCharacters = computed(() => characterNames.value.length > 0);
const activeCharData = computed<CharacterData | null>(() =>
  statData.value.角色?.[activeChar.value] || null
);

// 照片序列管理
const photoSequence = ref<string[]>([]); // 存储角色照片序列
const currentPhotoIndex = ref(0); // 当前显示的照片索引
const isPhotoGalleryMode = ref(false); // 是否处于照片画廊模式

// 获取角色所有同名照片
const getCharacterPhotoSequence = (charName: string): string[] => {
  const [username, repo] = ['xuexix-alt', 'meituan-tavern-xjia']; // 请替换为您的GitHub用户名和仓库名

  // 基础文件名（去除数字后缀）
  const baseFileName = `image/${charName}`;

  // 生成可能的文件序列（1-99）
  const sequence: string[] = [];
  for (let i = 1; i <= 99; i++) {
    const photoPath = `${baseFileName}${i}.png`;
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${username}/${repo}@main/${photoPath}`;
    sequence.push(cdnUrl);

    // 也尝试.jpg格式
    const jpgPath = `${baseFileName}${i}.jpg`;
    const jpgCdnUrl = `https://cdn.jsdelivr.net/gh/${username}/${repo}@main/${jpgPath}`;
    sequence.push(jpgCdnUrl);
  }

  // 添加无后缀的基础文件（如 "image/藤原千惠.png"）
  const basePhotoPath = `image/${charName}.png`;
  const baseCdnUrl = `https://cdn.jsdelivr.net/gh/${username}/${repo}@main/${basePhotoPath}`;
  sequence.push(baseCdnUrl);

  // 也尝试.jpg格式的基础文件
  const baseJpgPath = `image/${charName}.jpg`;
  const baseJpgUrl = `https://cdn.jsdelivr.net/gh/${username}/${repo}@main/${baseJpgPath}`;
  sequence.push(baseJpgUrl);

  // 调试输出
  console.log(`[照片序列] 角色名: ${charName}`);
  console.log(`[照片序列] 生成的URL数量: ${sequence.length}`);
  console.log(`[照片序列] 前5个URL:`, sequence.slice(0, 5)); // 只显示前5个

  return sequence;
};

// 当前显示的照片
const currentPhoto = computed(() => {
  const photo = activeCharData.value?.照片;
  const charName = activeChar.value || '未知角色';

  console.log(`[照片] 当前角色: ${charName}, 照片字段: ${photo}`);

  // 总是检测该角色的照片序列
  photoSequence.value = getCharacterPhotoSequence(charName);

  // 检查是否有序列照片（至少有一张有效的）
  const validPhotos = photoSequence.value.filter(url => url && url.trim());
  const hasSequence = validPhotos.length > 0;
  isPhotoGalleryMode.value = hasSequence;

  if (!hasSequence) {
    console.log(`[照片] ${charName} 没有找到照片`);
    return null;
  }

  // 如果照片字段是基础名称（不带.png），优先使用序列中的第一张
  if (photo && photo.startsWith('image/') && !photo.includes('.')) {
    console.log(`[照片] 使用基础名称，优先序列第一张`);
    return validPhotos[0] || null;
  }

  // 如果照片字段是完整文件名（如 "image/藤原千惠.png"）
  if (photo && photo.startsWith('image/')) {
    const photoFileName = photo.split('/').pop()!;
    console.log(`[照片] 查找具体文件: ${photoFileName}`);

    // 检查这个具体文件是否在序列中
    const specificIndex = validPhotos.findIndex(url =>
      url.endsWith(`/${photoFileName}`) ||
      url.endsWith(photoFileName)
    );

    if (specificIndex !== -1) {
      // 如果指定文件存在，使用它作为起点
      currentPhotoIndex.value = specificIndex;
      console.log(`[照片] 找到指定文件，索引: ${specificIndex}`);
      return validPhotos[specificIndex];
    } else {
      // 如果指定文件不存在，使用序列中的第一张
      console.log(`[照片] 未找到指定文件，使用第一张`);
      return validPhotos[0] || null;
    }
  }

  // 如果已经是完整URL，直接返回
  if (photo && (photo.startsWith('http') || photo.startsWith('data:'))) {
    console.log(`[照片] 使用完整URL`);
    return photo;
  }

  // 默认返回第一张有效照片
  console.log(`[照片] 默认使用第一张有效照片`);
  return validPhotos[0] || null;
});

// 照片总数（只计算有效照片）
const photoCount = computed(() => {
  return photoSequence.value.filter(url => url && url.trim()).length;
});

// 当前照片编号显示
const currentPhotoNumber = computed(() => {
  if (!isPhotoGalleryMode.value || photoCount.value <= 1) return '';
  return `${currentPhotoIndex.value + 1} / ${photoCount.value}`;
});

const basicInfo = computed(() => ({
  '🎂 年龄': activeCharData.value?.年龄,
  '💼 身份': activeCharData.value?.身份,
  '🤝 关系': activeCharData.value?.与user关系,
  '📍 位置': activeCharData.value?.所处位置
}));

const appearanceInfo = computed(() => ({
  '👔 衣着': activeCharData.value?.衣着,
  '🌸 胸乳': activeCharData.value?.胸乳,
  '👙 内衣': activeCharData.value?.内衣,
  '🔒 私处': activeCharData.value?.私处,
  '👠 鞋袜': activeCharData.value?.鞋袜
}));

// --- 核心逻辑 (已修复) ---
const fetchData = () => {
  try {
    // 1. 获取当前消息ID (修复: 使用 getCurrentMessageId)
    const msgId = getCurrentMessageId();
    if (!msgId) return;

    // 2. 获取消息对象
    const msgs = getChatMessages(msgId);

    // 3. 安全读取数据 (修复: 增加空值检查)
    // 注意：getChatMessages 返回数组，通常我们需要最新的那一条
    // 假设数据存储在 stat_data 字段中
    const targetMsg = msgs && msgs.length > 0 ? msgs[0] : null;

    if (targetMsg?.data?.stat_data) {
      statData.value = targetMsg.data.stat_data;

      // 如果当前没有选中角色，且有角色数据，默认选中第一个
      if (!activeChar.value && characterNames.value.length > 0) {
        activeChar.value = characterNames.value[0];
      }
    }
  } catch (e) {
    console.warn('TavernHelper Data Sync:', e);
  }
};

const toggleThemeModal = () => {
  showThemeModal.value = !showThemeModal.value;
};

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.warn('图片加载失败:', img.src);
  // 可以在这里添加备用图片显示逻辑
  // 例如：img.src = '/fallback-avatar.png';
};

// 图片加载成功处理
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.log('图片加载成功:', img.src);
};

// 照片切换功能
const switchPhoto = (direction: 'next' | 'prev' | number) => {
  if (!isPhotoGalleryMode.value || photoCount.value <= 1) return;

  if (typeof direction === 'number') {
    // 直接设置索引
    currentPhotoIndex.value = Math.max(0, Math.min(photoCount.value - 1, direction));
  } else {
    // 计算新的索引
    if (direction === 'next') {
      currentPhotoIndex.value = (currentPhotoIndex.value + 1) % photoCount.value;
    } else if (direction === 'prev') {
      currentPhotoIndex.value = (currentPhotoIndex.value - 1 + photoCount.value) % photoCount.value;
    }
  }

  console.log(`切换到照片: ${currentPhotoIndex.value + 1}/${photoCount.value}`);
};

// 点击照片切换（支持双击）
const handlePhotoClick = () => {
  if (!isPhotoGalleryMode.value || photoCount.value <= 1) return;

  // 简单点击切换到下一张
  switchPhoto('next');
};

// 双击照片重置到第一张
const handlePhotoDoubleClick = () => {
  if (!isPhotoGalleryMode.value || photoCount.value <= 1) return;

  switchPhoto(0);
  console.log('重置到第一张照片');
};

// 照片自动轮播控制
const toggleAutoRotate = () => {
  autoPhotoRotate.value = !autoPhotoRotate.value;
  console.log(`自动轮播: ${autoPhotoRotate.value ? '开启' : '关闭'}`);
};

// 开始自动轮播
const startAutoRotate = () => {
  if (photoRotateInterval) {
    clearInterval(photoRotateInterval);
  }

  if (autoPhotoRotate.value && isPhotoGalleryMode.value && photoCount.value > 1) {
    photoRotateInterval = setInterval(() => {
      switchPhoto('next');
    }, 3000); // 每3秒切换一次
    console.log('开始自动轮播');
  }
};

// 停止自动轮播
const stopAutoRotate = () => {
  if (photoRotateInterval) {
    clearInterval(photoRotateInterval);
    photoRotateInterval = null;
    console.log('停止自动轮播');
  }
};

// --- 生命周期 & 监听 ---
watch(currentTheme, (newTheme) => {
  localStorage.setItem('organization_theme', newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
});

onMounted(() => {
  document.documentElement.setAttribute('data-theme', currentTheme.value);
  fetchData();
  pollingInterval = setInterval(fetchData, 1000); // 1秒轮询

  // 触发 resize 适配 iframe
  setTimeout(() => {
    if (window.jQuery) window.jQuery(window).trigger('resize');
  }, 200);
});

// 监听角色变化和自动轮播设置
watch([activeChar, autoPhotoRotate, isPhotoGalleryMode, photoCount], () => {
  // 当角色变化或照片序列变化时，重置到第一张照片
  currentPhotoIndex.value = 0;

  // 如果启用了自动轮播，开始轮播
  if (autoPhotoRotate.value) {
    startAutoRotate();
  } else {
    stopAutoRotate();
  }
});

// 监听自动轮播设置
watch(autoPhotoRotate, (newValue) => {
  if (newValue) {
    startAutoRotate();
  } else {
    stopAutoRotate();
  }
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<style lang="scss" scoped>
/* 局部样式优化 - 配合 index.scss */
.glass-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: auto;
  aspect-ratio: 16/9; /* 宽高比控制 */
  max-width: 800px;
  padding-bottom: 40px; /* 底部留白 */

  /* 根据内容自动调整高度 */
  @media (min-width: 768px) {
    aspect-ratio: 4/3;
  }

  @media (min-width: 1024px) {
    aspect-ratio: 16/10;
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .section-title {
    font-size: calc(var(--text-base) * 1.75); /* 31.5px */
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: calc(var(--space-base) * 1.6); /* 8px */
    line-height: 1.2;

    .icon-pulse {
      animation: pulse 2s infinite;
      font-size: calc(var(--text-base) * 0.875); /* 15.75px */
    }
  }

  .theme-toggle {
    background: var(--glass-panel);
    border: 1px solid var(--glass-border);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    .gear-icon {
      font-size: 1.2rem;
      filter: grayscale(1);
      transition: all 0.3s;
    }

    &:hover {
      background: var(--glass-highlight);
      transform: rotate(90deg) scale(1.1);
      box-shadow: 0 0 15px var(--c-primary-dark);
      border-color: var(--c-primary);

      .gear-icon {
        filter: grayscale(0);
      }
    }
  }
}

.info-layout {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 两列等宽，适应照片框宽度变化 */
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* 在中等屏幕上改为单列 */
    gap: 16px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.global-info-bar {
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-base) * 2.5); /* 10px - 增加间距 */
}

.info-item {
  padding: calc(var(--space-base) * 3) calc(var(--space-base) * 4); /* 12px 16px - 增加内边距 */
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  gap: calc(var(--space-base) * 3); /* 12px */
  font-size: calc(var(--text-base) * 0.85); /* 15.3px - 增大字体 */
  color: var(--c-text-sub);
  transition: transform 0.2s var(--ease-smooth);
  min-height: 48px; /* 确保信息项有足够高度 */

  &:hover {
    transform: translateX(calc(var(--space-base) * 1)); /* 4px */
    background: var(--glass-highlight);
  }

  &.chapter .icon {
    color: var(--accent-info);
    filter: drop-shadow(0 0 2px hsla(var(--hue-primary), 90%, 60%, 0.3));
  }
  &.time .icon {
    color: var(--accent-warm);
    filter: drop-shadow(0 0 2px hsla(var(--hue-warning), 90%, 60%, 0.3));
  }
  &.location .icon {
    color: var(--accent-danger);
    filter: drop-shadow(0 0 2px hsla(var(--hue-danger), 90%, 60%, 0.3));
  }

  .text {
    font-weight: 600; /* 增加字重 */
    color: var(--c-text-main);
    text-shadow: 0 1px 2px hsla(220, 20%, 10%, 0.05);
  }
}

.photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 50%; /* 宽度占一半 */
  min-width: 200px; /* 最小宽度确保照片不会太小 */

  @media (max-width: 768px) {
    width: 45%;
    min-width: 180px;
  }

  @media (max-width: 480px) {
    width: 100%;
    flex-direction: row;
    min-width: auto;

    .photo-frame {
      width: 80px;
      height: 80px;
      aspect-ratio: 1;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .photo-caption {
      text-align: left;
      font-size: 1rem;
      font-weight: bold;
      flex-shrink: 0;
      margin-left: 12px;
    }
  }
}

.photo-frame {
  width: 100%;
  height: calc(var(--space-unit) * 5); /* 高度占当前基准5行 = 100px */
  max-height: 120px; /* 最大高度限制 */
  background: var(--glass-panel);
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--glass-shadow);
  transition: all 0.3s;
  flex-shrink: 0; /* 防止被压缩 */
  position: relative;
  cursor: pointer;

  &.has-photo {
    border-color: var(--c-primary);
  }

  &.gallery-mode {
    border-color: var(--c-primary);
    box-shadow: 0 0 0 2px var(--c-primary), var(--glass-shadow);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;

    &:hover {
      transform: scale(1.05);
    }
  }

  .photo-placeholder {
    font-size: 2.5rem;
    opacity: 0.3;
  }

  /* 照片画廊模式指示器 */
  .photo-indicators {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1), transparent);
  }

  .photo-counter {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    pointer-events: auto;
  }

  .photo-controls {
    display: flex;
    gap: 4px;
    pointer-events: auto;
  }

  .photo-btn {
    background: rgba(255, 255, 255, 0.9);
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    color: var(--c-text-main);
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);

    &:hover {
      background: var(--c-primary);
      color: white;
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.photo-caption {
  font-size: 0.85rem;
  color: var(--c-text-sub);
  text-align: center;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  .photo-hint {
    font-size: 0.7rem;
    color: var(--c-text-mute);
    font-weight: 400;
    opacity: 0.8;
  }
}

.tabs-nav {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(0,0,0,0.05);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  margin-bottom: 16px;
  scrollbar-width: thin; /* 显示滚动条 */
  scrollbar-color: var(--c-text-light) transparent;

  /* Webkit 浏览器滚动条样式 */
  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--c-text-light);
    border-radius: 3px;
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }

  .tab-button {
    padding: 6px 12px; /* 减小内边距 */
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    color: var(--c-text-sub);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    font-size: 0.85rem; /* 减小字体 */
    flex-shrink: 0; /* 防止标签被压缩 */

    &:hover {
      background: var(--glass-highlight);
      color: var(--c-text-main);
    }

    &.active {
      background: var(--c-bg-input);
      color: var(--c-primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      font-weight: 700;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card {
    background: var(--glass-bg);
    padding: calc(var(--space-base) * 3.5); /* 14px */
    border-radius: var(--radius-md);
    border: 1px solid var(--glass-border);
    transition:
      transform 0.2s var(--ease-smooth),
      box-shadow 0.3s var(--ease-out-expo);

    &:hover {
      transform: translateY(calc(var(--space-base) * -0.5)); /* -2px */
      box-shadow:
        0 8px 24px -8px hsla(220, 20%, 10%, 0.12),
        0 4px 12px -4px hsla(220, 20%, 10%, 0.08),
        inset 0 0 0 1px var(--glass-highlight);
      border-color: var(--glass-highlight);
    }

    &.full-width {
      grid-column: 1 / -1;
    }

    h3 {
      font-size: calc(var(--text-base) * 0.875); /* 15.75px */
      color: var(--c-text-sub); /* 浅色模式下使用更深的颜色 */
      margin: 0 0 calc(var(--space-base) * 2.4) 0; /* 12px */
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: calc(var(--space-base) * 1.5); /* 7.5px */
      text-shadow: 0 1px 2px hsla(220, 20%, 15%, 0.15); /* 增强阴影对比度 */
    }
  }
}

.text-box {
  padding: calc(var(--space-base) * 3); /* 15px */
  border-radius: var(--radius-sm);
  font-size: calc(var(--text-base) * 0.7); /* 12.6px */
  line-height: 1.6;
  position: relative;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  &.thought {
    background: var(--bg-thought);
    color: var(--text-thought);
    border-left: calc(var(--space-base) * 0.75) solid var(--text-thought);
    box-shadow: inset 0 0 0 1px hsla(var(--hue-primary), 60%, 80%, 0.3);
    text-shadow: 0 1px 2px hsla(var(--hue-primary), 80%, 40%, 0.1);
  }
  &.action {
    background: var(--bg-action);
    color: var(--text-action);
    font-style: italic;
    border-left: calc(var(--space-base) * 0.75) solid var(--text-action);
    box-shadow: inset 0 0 0 1px hsla(var(--hue-danger), 70%, 80%, 0.3);
    text-shadow: 0 1px 2px hsla(var(--hue-danger), 80%, 40%, 0.1);
  }
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-base) * 2); /* 8px */

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px dashed var(--glass-border);
    padding-bottom: calc(var(--space-base) * 1.5); /* 6px */
    position: relative;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, var(--glass-border) 0%, transparent 100%);
      opacity: 0.5;
    }

    .label {
      color: var(--c-text-main); /* 使用主色调而不是次要色调 */
      font-size: calc(var(--text-base) * 0.725); /* 13.05px */
      font-weight: 600; /* 增加字重 */
      letter-spacing: 0.02em;
      min-width: 80px; /* 确保标签有足够宽度防止换行 */
      white-space: nowrap; /* 防止文本换行 */
      flex-shrink: 0; /* 防止标签被压缩 */
      text-align: left; /* 左对齐 */
    }
    .value {
      color: var(--c-text-main);
      font-weight: 700; /* 增加字重 */
      font-size: calc(var(--text-base) * 0.85); /* 15.3px */
      text-align: center;
      text-shadow: 0 1px 2px hsla(220, 20%, 15%, 0.1); /* 增强阴影对比度 */
    }
  }
}

/* 外观描述左对齐样式 */
.appearance-list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--space-base) * 3); /* 15px 间距 */

  .appearance-item {
    display: flex;
    flex-direction: column;
    gap: calc(var(--space-base) * 2); /* 8px 标签与文本间距 */
    padding: calc(var(--space-base) * 2.5); /* 10px 内边距 */
    border-radius: var(--radius-sm);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    transition: all 0.2s var(--ease-smooth);

    &:hover {
      background: var(--glass-highlight);
      border-color: var(--glass-highlight);
      transform: translateY(calc(var(--space-base) * -0.25)); /* -1px 轻微上移 */
      box-shadow: 0 4px 12px -4px hsla(220, 20%, 10%, 0.08);
    }

    .appearance-label {
      font-size: calc(var(--text-base) * 0.875); /* 15.75px */
      font-weight: 700;
      color: var(--c-text-sub);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: calc(var(--space-base) * 1.5); /* 7.5px */
    }

    .appearance-text {
      font-size: calc(var(--text-base) * 0.85); /* 15.3px */
      line-height: 1.6;
      color: var(--c-text-main);
      font-weight: 500;
      text-align: left;
      text-shadow: 0 1px 2px hsla(220, 20%, 15%, 0.05);
    }
  }
}

/* 开关样式 */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;

  input[type="checkbox"] {
    display: none;
  }

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--c-text-main);
  }

  .switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--glass-border);
    border-radius: 12px;
    transition: all 0.3s;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
  }

  .switch::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  input[type="checkbox"]:checked + label {
    span {
      color: var(--c-primary);
    }
    .switch {
      background: var(--c-primary);
    }
    .switch::before {
      transform: translateX(20px);
    }
  }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--c-text-light);
  font-style: italic;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: var(--glass-bg);
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  width: 90%;
  max-width: 300px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  animation: modalPop 0.3s var(--ease-spring);

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 { margin: 0; }

    .btn-close-icon {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--c-text-sub);
      padding: 0;
      line-height: 1;

      &:hover { color: var(--c-text-main); }
    }
  }

  select {
    width: 100%;
    padding: 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--glass-border);
    background: var(--c-bg-input);
    color: var(--c-text-main);
    font-size: 1rem;
    cursor: pointer;
    outline: none;

    &:focus {
      border-color: var(--c-primary);
      box-shadow: 0 0 0 2px var(--bg-thought);
    }
  }
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes modalPop {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s var(--ease-smooth);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
