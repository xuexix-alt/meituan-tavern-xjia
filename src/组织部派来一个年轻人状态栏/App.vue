<template>
  <main ref="containerRef" class="glass-container" :data-theme="currentTheme">
    <!-- 顶部功能区 -->
    <header class="header-section">
      <div class="header-content">
        <h2 class="section-title">
          <span class="icon-pulse">📊</span>
          <span class="title-text">状态监视器</span>
        </h2>
        <div class="header-actions">
          <button class="icon-btn refresh-btn" title="强制刷新数据" @click="handleManualRefresh">
            <span>🔄</span>
          </button>
          <button class="icon-btn theme-toggle" title="显示设置" @click="toggleThemeModal">
            <span class="gear-icon">⚙️</span>
          </button>
        </div>
      </div>

      <!-- ✨ 加载进度条 -->
      <Transition name="fade-slide">
        <div v-if="isPreloading || preloadPhase" class="progress-bar-container">
          <div class="progress-info">
            <span class="progress-icon">📦</span>
            <span class="progress-text">{{ preloadPhase || '加载中' }}</span>
            <span class="progress-count">{{ loadingProgress }} / {{ totalImages }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${(loadingProgress / totalImages) * 100}%` }"></div>
          </div>
        </div>
      </Transition>

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
            <!-- ✨ 图片计数显示 -->
            <span
              v-if="currentImageInfo && currentImageInfo.hasMultiple"
              class="image-counter"
              :title="`点击图片切换（共${currentImageInfo.total}张）`"
            >
              {{ currentImageInfo.currentIndex + 1 }}/{{ currentImageInfo.total }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- 角色详情区 -->
    <section class="content-section">
      <!-- 详情内容 -->
      <Transition name="fade-slide" mode="out-in">
        <div v-if="activeCharData" :key="activeChar" class="tab-content">
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
            <div v-if="activeCharData.当前想法" class="card full-width thought-card">
              <h3>💭 内心想法</h3>
              <div class="text-box thought">{{ activeCharData.当前想法 }}</div>
            </div>

            <div v-if="activeCharData.姿势" class="card full-width action-card">
              <h3>🏃 当前姿态</h3>
              <div class="text-box action">{{ activeCharData.姿势 }}</div>
            </div>

            <!-- 基础属性 -->
            <div class="card info-card two-column-split">
              <h3>📋 状态面板</h3>
              <div class="detail-list">
                <div v-for="(val, key) in basicInfo" :key="key" class="detail-item">
                  <span class="label">{{ key.replace(/^[^\u4e00-\u9fa5]+/, '') }}</span>
                  <span class="value">{{ val || '--' }}</span>
                </div>
              </div>
            </div>

            <!-- 外观特征 -->
            <div class="card appearance-card two-column-split">
              <h3>👤 外观特征</h3>
              <div class="appearance-list">
                <div v-for="(val, key) in appearanceInfo" :key="key" class="appearance-item">
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

// ✅ 并行加载图片函数（改进版）+ 多镜像支持 + 进度回调
// 一次性发起所有请求，大幅提升加载速度
// ⚠️ 仅加载 JPG 格式，避免加载体积巨大的 PNG
// 💡 使用多镜像 CDN 策略，自动级联故障转移，确保快速稳定的加载
const loadImagesParallel = async (
  roleName: string,
  rangeStart = 0,
  rangeEnd = 30,
  onProgress?: (loaded: number) => void,
): Promise<string[]> => {
  // CDN 镜像列表（按优先级排列）
  const cdnMirrors = [
    'https://fastly.jsdelivr.net/gh/xuexix-alt/meituan-tavern-xjia/image', // Fastly 镜像（主要，速度快）
    'https://gcore.jsdelivr.net/gh/xuexix-alt/meituan-tavern-xjia/image', // Gcore 镜像（备选1）
    'https://testingcf.jsdelivr.net/gh/xuexix-alt/meituan-tavern-xjia/image', // testingcf 镜像（备选2，国内优化）
  ];

  let lastError: Error | null = null;

  // 遍历所有 CDN 镜像，直到找到可用的
  for (const cdnPrefix of cdnMirrors) {
    try {
      console.log(`[图片] 🔄 尝试使用镜像: ${cdnPrefix}`);

      const imageUrls: Array<{ url: string; name: string }> = [];

      // 基础文件名（无数字后缀）- 仅加载 JPG
      if (rangeStart === 0) {
        imageUrls.push({
          url: `${cdnPrefix}/${encodeURIComponent(roleName)}.jpg`,
          name: `${roleName}.jpg`,
        });
      }

      // 带数字后缀的文件 - 仅加载 JPG
      for (let i = Math.max(1, rangeStart); i <= rangeEnd; i++) {
        imageUrls.push({
          url: `${cdnPrefix}/${encodeURIComponent(roleName)}${i}.jpg`,
          name: `${roleName}${i}.jpg`,
        });
      }

      const rangeDesc = rangeStart === 0 && rangeEnd === 30 ? '全部图片（0-30）' : `第${rangeStart}-${rangeEnd}张`;
      console.log(`[图片] 🔍 开始加载 "${roleName}" 的${rangeDesc}...`);

      // 并行发起所有请求，带进度回调
      const results = await Promise.allSettled(
        imageUrls.map(async ({ url, name }) => {
          const result = await loadImageAsBlob(url, name);
          if (result && onProgress) {
            onProgress(1); // 成功加载一张，通知进度+1
          }
          return result;
        }),
      );

      // 筛选成功的图片 + 统计失败数量
      const blobUrls: string[] = [];
      let failedCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          blobUrls.push(result.value);
          console.log(`[图片] ✅ 成功加载: ${imageUrls[index].name}`);
        } else {
          failedCount++;
        }
      });

      // 汇总日志：成功的输出详情，失败的只显示数量
      if (failedCount > 0) {
        console.log(`[图片] ⏭️  其余 ${failedCount} 个请求无图片文件（属正常情况）`);
      }
      console.log(`[图片] 📊 成功找到 ${blobUrls.length} 张可用图片（扫描范围：${imageUrls.length} 个 URL）`);

      if (blobUrls.length > 0) {
        console.log(`[图片] ✅ 使用镜像 "${cdnPrefix}" 加载成功`);
        return blobUrls;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`[图片] ⚠️ 镜像失败: ${cdnPrefix}`, lastError.message);
      // 继续尝试下一个镜像
      continue;
    }
  }

  // 所有镜像都失败
  console.error(`[图片] ❌ 所有 CDN 镜像都无法加载 "${roleName}"`, lastError);
  return [];
};

// 从 URL 加载单个图片为 Blob URL
const loadImageAsBlob = (url: string, fileName: string): Promise<string | null> => {
  return new Promise(resolve => {
    // 使用 fetch 加载图片，避免 Canvas 转换的性能开销
    fetch(url, { mode: 'cors' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        // 创建 Blob URL，比 Base64 快得多
        const blobUrl = URL.createObjectURL(blob);
        resolve(blobUrl);
      })
      .catch(() => {
        // 失败直接返回 null，上层会汇总统计
        resolve(null);
      });
  });
};

// ✅ IndexedDB 初始化
const initImageDatabase = async (): Promise<IDBDatabase | null> => {
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TavernImageCache', 1);

      request.onerror = () => {
        console.warn('[数据库] ❌ IndexedDB 打开失败');
        reject(request.error);
      };

      request.onsuccess = () => {
        const db = request.result;
        console.log('[数据库] ✅ IndexedDB 已初始化');
        resolve(db);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'roleName' });
          console.log('[数据库] 📦 创建 images 对象存储');
        }
      };
    });
  } catch (e) {
    console.warn('[数据库] ❌ 初始化失败:', e);
    return null;
  }
};

let imageDatabase: IDBDatabase | null = null;

// ✅ 从 IndexedDB 获取图片二进制数据
const getImageFromDB = async (roleName: string): Promise<Blob | null> => {
  try {
    if (!imageDatabase) {
      imageDatabase = await initImageDatabase();
      if (!imageDatabase) return null;
    }

    return new Promise(resolve => {
      const transaction = imageDatabase!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.get(roleName);

      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          const blob = request.result.blob;
          const size = blob.size;
          console.log(`[数据库] ✅ 从 IndexedDB 获取 "${roleName}" 的图片 (${(size / 1024).toFixed(2)} KB)`);
          if (size === 0) {
            console.warn(`[数据库] ⚠️ 警告: "${roleName}" 的 Blob 数据为空 (0 bytes)`);
          }
          resolve(blob);
        } else {
          console.log(`[数据库] ℹ️ "${roleName}" 在 IndexedDB 中无数据`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn(`[数据库] ❌ 查询失败: ${roleName}`);
        resolve(null);
      };
    });
  } catch (e) {
    console.warn('[数据库] ❌ 获取失败:', e);
    return null;
  }
};

// ✅ 保存图片到 IndexedDB
const saveImageToDB = async (roleName: string, blob: Blob): Promise<boolean> => {
  try {
    if (!imageDatabase) {
      imageDatabase = await initImageDatabase();
      if (!imageDatabase) return false;
    }

    return new Promise(resolve => {
      const transaction = imageDatabase!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.put({ roleName, blob });

      request.onsuccess = () => {
        console.log(`[数据库] 💾 已保存 "${roleName}" 到 IndexedDB`);
        resolve(true);
      };

      request.onerror = () => {
        console.warn(`[数据库] ❌ 保存失败: ${roleName}`);
        resolve(false);
      };
    });
  } catch (e) {
    console.warn('[数据库] ❌ 保存失败:', e);
    return false;
  }
};

// ✅ 改进的图片缓存获取函数（添加 IndexedDB + 多镜像支持）
const getImageFromCache = async (roleName: string): Promise<string | null> => {
  try {
    // 1. 首先尝试从 IndexedDB 获取
    const cachedBlob = await getImageFromDB(roleName);
    if (cachedBlob && cachedBlob.size > 0) {
      const blobUrl = URL.createObjectURL(cachedBlob);
      console.log(`[图片] ✅ 使用 IndexedDB 缓存（无需重新加载）`);
      return blobUrl;
    } else if (cachedBlob && cachedBlob.size === 0) {
      // ⚠️ 缓存数据被损坏，删除后重新加载
      console.warn(`[图片] ⚠️ IndexedDB 缓存被损坏（0 bytes），删除并重新加载...`);
    }

    console.log(`[图片] 📡 缓存未命中，正在加载 "${roleName}" 的图片...（使用并行加载，速度更快）`);

    // 2. 使用并行加载获取所有可用图片
    const blobUrls = await loadImagesParallel(roleName);

    if (blobUrls.length === 0) {
      console.log(`[图片] ❌ "${roleName}" 没有找到任何图片文件`);
      return null;
    }

    // 3. 随机选择一张图片
    const randomIndex = Math.floor(Math.random() * blobUrls.length);
    const selectedImageUrl = blobUrls[randomIndex];

    console.log(
      `[图片] 🎲 从 ${blobUrls.length} 张图片中随机选择第 ${randomIndex + 1} 张（${selectedImageUrl ? '成功' : '失败'}）`,
    );

    // 4. ✅ 改进：保存到 IndexedDB 时检查数据完整性
    // 使用 Promise.race 实现超时保护
    const savePromise = new Promise<void>(resolve => {
      fetch(selectedImageUrl)
        .then(r => r.blob())
        .then(blob => {
          // ✅ 确保保存的不是空 Blob
          if (blob.size > 0) {
            console.log(`[图片] 💾 正在保存 "${roleName}" 到 IndexedDB (${(blob.size / 1024).toFixed(2)} KB)...`);
            saveImageToDB(roleName, blob)
              .then(() => resolve())
              .catch(e => {
                console.warn('[数据库] 后台保存失败:', e);
                resolve();
              });
          } else {
            console.warn(`[图片] ⚠️ 无法保存空 Blob，跳过 IndexedDB 缓存`);
            resolve();
          }
        })
        .catch(e => {
          console.warn('[数据库] 后台保存失败（读取失败）:', e);
          resolve();
        });
    });

    // 5. 清理其他未使用的 Blob URL（防止内存泄漏）
    blobUrls.forEach((url, index) => {
      if (index !== randomIndex) {
        URL.revokeObjectURL(url);
      }
    });

    // 6. 不等待保存完成，但确保至少尝试了
    savePromise.catch(() => {});

    return selectedImageUrl;
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

// ✅ 图片预加载进度跟踪
const loadingProgress = ref(0); // 当前已加载数量
const totalImages = ref(0); // 总图片数量（预估）
const isPreloading = ref(false); // 是否正在预加载
const preloadPhase = ref(''); // 当前加载阶段描述

// --- 计算属性 ---
const characterNames = computed(() => Object.keys(statData.value.角色 || {}));
const hasCharacters = computed(() => characterNames.value.length > 0);

// ✅ 当前角色的图片信息
const currentImageInfo = computed(() => {
  if (!activeChar.value) return null;

  const currentIndex = characterNames.value.indexOf(activeChar.value);
  if (currentIndex === -1) return null;

  const imageKey = mapRoleToImageName(activeChar.value, currentIndex);
  const images = preloadCache.value.get(imageKey);
  const currentIdx = imageIndexMap.value.get(imageKey) || 0;

  return {
    imageKey,
    images: images || [],
    currentIndex: currentIdx,
    total: images?.length || 0,
    hasMultiple: (images?.length || 0) > 1,
  };
});

// ✅ 初始化完成标志（是否已尝试加载过图片）
const initializationComplete = ref(false);

// ✅ 图片加载完成状态（简化逻辑：基于是否有 currentPhotoUrl）
const imagesLoaded = computed(() => {
  // 如果初始化还未完成，返回 false（显示加载中）
  if (!initializationComplete.value) return false;
  // 如果有 currentPhotoUrl，说明加载成功
  if (currentPhotoUrl.value) return true;
  // 否则返回 true（初始化完成但没有图片，显示占位符）
  return true;
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

// ? 当前显示的图片URL（响应式）
const currentPhotoUrl = ref<string>('');

// ? 延迟释放旧 Blob URL（等待 <img> 完全切换后再释放）
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
watch(currentPhotoUrl, (_newUrl, oldUrl) => {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }

  if (oldUrl && oldUrl.startsWith('blob:')) {
    releaseTimer = setTimeout(() => {
      try {
        URL.revokeObjectURL(oldUrl);
        console.log(`[清理] 已释放旧 Blob URL: ${oldUrl.substring(0, 50)}...`);
      } catch (e) {
        console.warn('[清理] 释放 Blob URL 失败:', e);
      }
      releaseTimer = null;
    }, 500);
  }
});

// ✅ 预加载缓存（后台预加载下一个角色的图片，消除切换延迟）
const preloadCache = ref<Map<string, string[]>>(new Map()); // 改为存储所有图片数组

// ✅ 图片索引跟踪（记录每个角色当前显示的是第几张图片）
const imageIndexMap = ref<Map<string, number>>(new Map());

/**
 * ✨ 智能分批预加载所有角色的所有图片
 *
 * 策略：
 * - 第1批（立即）：陆副厂长的全部31张图片 → 首屏立即可用
 * - 第2批（3秒后）：其他角色的前5张图片 → 快速切换支持
 * - 第3批（10秒后）：其他角色的剩余图片（6-30） → 完整图库
 */
const smartBatchPreload = async () => {
  if (isPreloading.value) {
    console.log('[预加载] ⚠️ 已有预加载任务在进行中，跳过');
    return;
  }

  isPreloading.value = true;
  loadingProgress.value = 0;

  // 计算总图片数：每个角色31张（0-30）
  const charCount = characterNames.value.length;
  totalImages.value = charCount * 31;

  console.log(`[预加载] 🚀 开始智能分批预加载 (共${charCount}个角色, 预计${totalImages.value}张图片)`);

  try {
    // 🎯 第1批：立即加载陆副厂长的全部图片（0-30）
    preloadPhase.value = '首屏加载中';
    console.log('[预加载] 📦 第1批：陆副厂长全部图片（立即）');

    const lufuIndex = characterNames.value.indexOf(characterNames.value[0]); // 第一个角色
    if (lufuIndex !== -1) {
      const lufuImageName = mapRoleToImageName(characterNames.value[0], lufuIndex);
      await preloadCharacterImages(lufuImageName, 0, 30);
    }

    // 🎯 第2批：延迟3秒后加载其他角色的前5张（0-4）
    setTimeout(async () => {
      if (!isPreloading.value) return; // 如果已经取消预加载，则退出

      preloadPhase.value = '快速切换准备中';
      console.log('[预加载] 📦 第2批：其他角色前5张（延迟3秒）');

      for (let i = 1; i < characterNames.value.length; i++) {
        const charName = characterNames.value[i];
        const imageName = mapRoleToImageName(charName, i);
        await preloadCharacterImages(imageName, 0, 4);
      }

      // 🎯 第3批：延迟10秒后加载其他角色的剩余图片（5-30）
      setTimeout(async () => {
        if (!isPreloading.value) return;

        preloadPhase.value = '完整图库加载中';
        console.log('[预加载] 📦 第3批：其他角色剩余图片（延迟10秒）');

        for (let i = 1; i < characterNames.value.length; i++) {
          const charName = characterNames.value[i];
          const imageName = mapRoleToImageName(charName, i);
          await preloadCharacterImages(imageName, 5, 30);
        }

        // 全部加载完成
        isPreloading.value = false;
        preloadPhase.value = '加载完成';
        console.log(`[预加载] ✅ 全部加载完成！共加载 ${loadingProgress.value} 张图片`);

        // 3秒后隐藏进度条
        setTimeout(() => {
          preloadPhase.value = '';
        }, 3000);
      }, 7000); // 第2批完成后再延迟7秒（总计10秒）
    }, 3000); // 第1批完成后延迟3秒
  } catch (e) {
    console.error('[预加载] ❌ 智能分批预加载失败:', e);
    isPreloading.value = false;
    preloadPhase.value = '加载失败';
  }
};

/**
 * 预加载指定角色的指定范围图片
 */
const preloadCharacterImages = async (imageName: string, rangeStart: number, rangeEnd: number) => {
  try {
    // 使用进度回调
    const onProgress = (loaded: number) => {
      loadingProgress.value += loaded;
    };

    // 加载图片
    const blobUrls = await loadImagesParallel(imageName, rangeStart, rangeEnd, onProgress);

    if (blobUrls.length === 0) {
      console.log(`[预加载] ⚠️ "${imageName}" 范围${rangeStart}-${rangeEnd}没有可用图片`);
      return;
    }

    // 将所有图片存储到预加载缓存中
    const existingUrls = preloadCache.value.get(imageName) || [];
    preloadCache.value.set(imageName, [...existingUrls, ...blobUrls]);

    console.log(`[预加载] ✅ "${imageName}" 范围${rangeStart}-${rangeEnd}加载完成 (${blobUrls.length}张)`);

    // 同时保存到 IndexedDB
    for (const blobUrl of blobUrls) {
      fetch(blobUrl)
        .then(r => r.blob())
        .then(blob => {
          if (blob.size > 0) {
            saveImageToDB(imageName, blob).catch(() => {});
          }
        })
        .catch(() => {});
    }
  } catch (e) {
    console.warn(`[预加载] ❌ 预加载 "${imageName}" 范围${rangeStart}-${rangeEnd}失败:`, e);
  }
};

/**
 * 加载当前角色的图片
 * 优先使用预加载缓存，其次使用 IndexedDB 缓存
 */
const loadCurrentPhoto = async () => {
  try {
    // ✅ 记录当前的 activeChar，用于竞态条件检查
    const targetChar = activeChar.value;

    // ✅ 获取当前角色在列表中的索引
    const currentIndex = characterNames.value.indexOf(targetChar);
    if (currentIndex === -1) {
      console.log(`[照片] 当前角色"${targetChar}"不在角色列表中`);
      currentPhotoUrl.value = '';
      return;
    }

    // ✅ 获取角色名（作为图片文件名）
    const imageKey = mapRoleToImageName(targetChar, currentIndex);

    console.log(`[照片] 角色索引: ${currentIndex}, 角色名: "${targetChar}", 图片名: "${imageKey}"`);

    // ✅ 优先查询预加载缓存（改为数组）
    if (preloadCache.value.has(imageKey)) {
      const preloadedUrls = preloadCache.value.get(imageKey);

      // ⚠️ 竞态条件检查：确保 activeChar 没有变化
      if (activeChar.value !== targetChar) {
        console.log(`[照片] ⚠️ 用户已切换角色，放弃设置旧图片`);
        return;
      }

      if (preloadedUrls && preloadedUrls.length > 0) {
        // 初始化或获取当前索引
        if (!imageIndexMap.value.has(imageKey)) {
          // 首次加载，随机选择一张
          const randomIndex = Math.floor(Math.random() * preloadedUrls.length);
          imageIndexMap.value.set(imageKey, randomIndex);
        }

        const currentIdx = imageIndexMap.value.get(imageKey) || 0;
        currentPhotoUrl.value = preloadedUrls[currentIdx];
        console.log(`[照片] ${imageKey}: 从预加载缓存加载 ⚡ (共${preloadedUrls.length}张，显示第${currentIdx + 1}张)`);
        return;
      }
    }

    // ✅ 从 IndexedDB 缓存中获取图片
    const imageUrl = await getImageFromCache(imageKey);

    // ?? 竞态条件检查：等待完成后，检查 activeChar 是否变化
    if (activeChar.value !== targetChar) {
      console.log(`[照片] ?? 用户已切换角色（${activeChar.value}），放弃设置"${targetChar}"的图片`);
      // 释放这个 Blob URL，因为我们不需要它了
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      return;
    }

    if (imageUrl) {
      currentPhotoUrl.value = imageUrl;
      console.log(`[照片] ${imageKey}: 加载成功`);

      // 将命中的图片加入预加载缓存，确保后续可切换
      const cachedList = preloadCache.value.get(imageKey) || [];
      if (!cachedList.includes(imageUrl)) {
        preloadCache.value.set(imageKey, [...cachedList, imageUrl]);
      }
      if (!imageIndexMap.value.has(imageKey)) {
        imageIndexMap.value.set(imageKey, 0);
      }

      // 后台补全全量图片，填充可切换列表
      loadImagesParallel(imageKey, 0, 30)
        .then(urls => {
          if (!urls.length) return;
          const merged = Array.from(new Set([...(preloadCache.value.get(imageKey) || []), ...urls]));
          preloadCache.value.set(imageKey, merged);
        })
        .catch(() => {});
    } else {
      currentPhotoUrl.value = '';
      console.log(`[照片] ${imageKey}: 暂无图片，暂不显示`);
    }
  } finally {
    // ? 标记初始化完成（无论成功或失败）
    initializationComplete.value = true;
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

    // 检查预加载缓存（改为数组），如果已预加载则直接使用
    if (preloadCache.value.has(imageKey)) {
      const preloadedUrls = preloadCache.value.get(imageKey);
      if (preloadedUrls && preloadedUrls.length > 0) {
        // 初始化或获取当前索引
        if (!imageIndexMap.value.has(imageKey)) {
          // 首次切换到该角色，随机选择一张
          const randomIndex = Math.floor(Math.random() * preloadedUrls.length);
          imageIndexMap.value.set(imageKey, randomIndex);
        }

        const currentIdx = imageIndexMap.value.get(imageKey) || 0;
        currentPhotoUrl.value = preloadedUrls[currentIdx];
        console.log(
          `[切换] ⚡ 使用预加载的图片，零延迟切换完成 (共${preloadedUrls.length}张，显示第${currentIdx + 1}张)`,
        );
        isImageLoading.value = false;
        return;
      }
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

  // 尝试重新加载当前角色的图片
  // 这次会跳过预加载缓存，直接从 CDN 网络加载，不依赖 IndexedDB
  const currentIndex = characterNames.value.indexOf(activeChar.value);
  const imageKey = mapRoleToImageName(activeChar.value, currentIndex);

  console.log('[照片] 🔄 清除 IndexedDB 缓存并从网络重新加载...');

  // 删除 IndexedDB 中可能损坏的缓存
  if (imageDatabase) {
    const transaction = imageDatabase.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    const deleteRequest = store.delete(imageKey);

    deleteRequest.onsuccess = () => {
      console.log(`[照片] 🗑️ 已删除 "${imageKey}" 的缓存数据`);
    };

    deleteRequest.onerror = () => {
      console.warn(`[照片] ⚠️ 删除缓存失败: ${imageKey}`);
    };
  }

  // 直接从网络加载（跳过 IndexedDB）
  loadImagesParallel(imageKey, 0, 30) // 加载全部范围（0-30）
    .then(blobUrls => {
      if (blobUrls.length === 0) {
        console.error(`[照片] ❌ 无法从网络加载 "${imageKey}"`);
        return;
      }

      const randomIndex = Math.floor(Math.random() * blobUrls.length);
      const selectedUrl = blobUrls[randomIndex];

      console.log(`[照片] ✅ 从网络成功加载，设置为 Blob URL...`);
      currentPhotoUrl.value = selectedUrl;

      // 清理其他未使用的 URL
      blobUrls.forEach((url, idx) => {
        if (idx !== randomIndex) {
          URL.revokeObjectURL(url);
        }
      });

      // 异步保存到 IndexedDB（不阻塞 UI）
      fetch(selectedUrl)
        .then(r => r.blob())
        .then(blob => {
          if (blob.size > 0) {
            console.log(`[照片] 💾 重新保存到 IndexedDB...`);
            saveImageToDB(imageKey, blob);
          }
        })
        .catch(err => console.warn('[照片] 保存到 IndexedDB 失败:', err));
    })
    .catch(err => {
      console.error('[照片] ❌ 从网络重新加载失败:', err);
    });
};

const toggleThemeModal = () => {
  showThemeModal.value = !showThemeModal.value;
};

const handlePhotoClick = async () => {
  const imageKey = mapRoleToImageName(activeChar.value, characterNames.value.indexOf(activeChar.value));
  let info = currentImageInfo.value;
  let images = info?.images || [];
  let currentIndex = info?.currentIndex || 0;

  if (!info || !info.hasMultiple) {
    const freshUrls = await loadImagesParallel(imageKey, 0, 30).catch(() => []);
    if (freshUrls && freshUrls.length) {
      const merged = Array.from(new Set([...(preloadCache.value.get(imageKey) || []), ...freshUrls]));
      preloadCache.value.set(imageKey, merged);
      imageIndexMap.value.set(imageKey, imageIndexMap.value.get(imageKey) ?? 0);
      images = merged;
      currentIndex = imageIndexMap.value.get(imageKey) || 0;
      info = {
        imageKey,
        images,
        currentIndex,
        total: images.length,
        hasMultiple: images.length > 1,
      };
    } else {
      console.log('[照片] 当前角色只有一张图片或未加载，无法切换');
      return;
    }
  }

  const nextIndex = ((currentIndex || 0) + 1) % images.length;
  imageIndexMap.value.set(imageKey, nextIndex);

  currentPhotoUrl.value = images[nextIndex];

  console.log(`[照片] ?? 切换图片: ${imageKey} (第${nextIndex + 1}/${images.length}张)`);

  // 触发点击动画
  const photoFrame = document.querySelector('.photo-frame');
  if (photoFrame) {
    photoFrame.classList.add('photo-clicked');
    setTimeout(() => {
      photoFrame.classList.remove('photo-clicked');
    }, 300);
  }
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

  // 5. 等待数据加载完成后，启动智能分批预加载
  const unwatch = watch(
    () => statData.value.角色,
    async newRoles => {
      if (newRoles && Object.keys(newRoles).length > 0) {
        // 等待角色自动选中完成后再启动预加载
        if (activeChar.value) {
          // ✨ 启动智能分批预加载（不await，不阻塞UI）
          smartBatchPreload().catch(e => {
            console.error('[预加载] 启动失败:', e);
          });
          unwatch(); // 只执行一次
        }
      }
    },
    { immediate: true },
  );

  // 同时监听 activeChar 的变化（用户切换角色或初始化时触发）
  watch(activeChar, newChar => {
    if (newChar && characterNames.value.length > 0) {
      // 初次加载角色图片
      loadCurrentPhoto();
    }
  });
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();

  // ✅ 清理延迟释放定时器
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }

  // ✅ 清理当前显示的 Blob URL
  if (currentPhotoUrl.value && currentPhotoUrl.value.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(currentPhotoUrl.value);
      console.log('[清理] ✅ 已释放当前显示的 Blob URL');
    } catch (e) {
      console.warn('[清理] ⚠️ 释放当前 Blob URL 失败:', e);
    }
  }

  // ✅ 清理之前保存的 URL
  // ✅ 清理预加载缓存中的 Blob URL，防止内存泄漏
  preloadCache.value.forEach(blobUrls => {
    blobUrls.forEach(url => {
      if (!url.startsWith('blob:')) return;
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('[清理] ⚠️ 释放预加载缓存 Blob URL 失败:', e);
      }
    });
  });
  preloadCache.value.clear();

  // ✅ 关闭 IndexedDB 连接
  if (imageDatabase) {
    imageDatabase.close();
    console.log('[清理] 已关闭 IndexedDB 连接');
  }

  console.log('[清理] 已释放所有 Blob URL 和资源');
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
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* ✨ 加载进度条样式 */
.progress-bar-container {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  animation: slideDown 0.3s ease-out;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: var(--c-text-sub);

  .progress-icon {
    font-size: 1.1rem;
    animation: pulse 2s infinite;
  }

  .progress-text {
    flex: 1;
    font-weight: 600;
    color: var(--c-text-main);
  }

  .progress-count {
    font-size: 0.8rem;
    font-weight: 500;
    padding: 2px 8px;
    background: var(--glass-panel);
    border-radius: 12px;
    border: 1px solid var(--glass-border);
  }
}

.progress-bar {
  height: 6px;
  background: var(--glass-panel);
  border-radius: 3px;
  overflow: hidden;
  position: relative;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--c-primary), hsl(var(--hue-primary) 80% 70%));
    border-radius: 3px;
    transition: width 0.3s ease-out;
    position: relative;
    overflow: hidden;

    // 闪光动画
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 1.5s infinite;
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  to {
    left: 100%;
  }
}

/* 淡入淡出动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
      'info'
      'photo';

    .photo-section {
      grid-area: photo;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
    }
    .global-info-bar {
      grid-area: info;
    }

    .photo-frame {
      width: 100%;
      max-width: 520px;
      aspect-ratio: 3 / 4;
      min-height: clamp(220px, 34vw, 420px);
      max-height: 420px;
      margin: 0 auto;
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
  cursor: pointer; /* 添加鼠标指针提示可点击 */

  &.has-photo {
    border-color: var(--c-primary);
  }

  /* ✨ 点击动画效果 */
  &.photo-clicked {
    animation: photoClick 0.3s ease-out;
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

  /* 添加点击提示 */
  &.has-photo::after {
    content: '点击切换';
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 0.7rem;
    border-radius: 12px;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  &.has-photo:hover::after {
    opacity: 1;
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
  flex-wrap: wrap; /* 允许换行 */

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

  /* ✨ 图片计数器样式 */
  .image-counter {
    margin-left: auto; /* 推到右侧 */
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--c-text-sub);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    transition: all 0.3s;

    &:hover {
      background: var(--c-primary);
      color: white;
      border-color: var(--c-primary);
      transform: scale(1.05);
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

/* 窄屏下人物选择标签换行展示，避免被截断 */
@media (max-width: 520px) {
  .tabs-nav {
    flex-wrap: wrap;
    justify-content: flex-start;
    row-gap: 6px;
  }

  .tabs-nav .tab-button {
    font-size: 0.85rem;
    padding: 5px 12px;
    min-width: 96px;
    flex: 1 1 46%;
    text-align: center;
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

/* 移动端整体压缩与层级调整 */
@media (max-width: 540px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .progress-bar-container {
    padding: 8px 10px;
  }

  .info-layout {
    gap: 14px;
  }

  .info-item {
    padding: 12px 14px;
  }

  .photo-section {
    gap: 8px;
  }

  .photo-caption .char-name {
    font-size: 0.95rem;
  }

  .tabs-nav {
    gap: 6px;
  }

  .tabs-nav .tab-button {
    padding: 6px 10px;
    font-size: 0.82rem;
    min-height: 36px;
  }

  .card {
    padding: 12px;
    min-height: 120px;
  }

  .text-box {
    font-size: 0.9rem;
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
    background-clip: text;
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
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* 外观特征的文本也使用发光字体 */
  .appearance-text {
    background: linear-gradient(135deg, var(--c-text-main) 0%, var(--c-primary) 100%);
    background-clip: text;
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

/* 设置弹窗样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  z-index: 999;
}

.modal-content {
  width: min(92vw, 360px);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  box-shadow: var(--glass-shadow);
  padding: 18px;
  color: var(--c-text-main);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 1.05rem;
  }
}

.btn-close {
  width: 30px;
  height: 30px;
  border: 1px solid var(--glass-border);
  border-radius: 50%;
  background: var(--glass-panel);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  display: grid;
  place-items: center;
  transition: all 0.2s;

  &:hover {
    background: var(--c-primary);
    color: white;
    border-color: var(--c-primary);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-weight: 600;
    color: var(--c-text-sub);
  }

  select {
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    background: var(--glass-panel);
    color: var(--c-text-main);
    outline: none;

    &:focus {
      border-color: var(--c-primary);
      box-shadow: 0 0 0 2px hsla(var(--hue-primary), 80%, 60%, 0.15);
    }
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

/* ✨ 点击图片时的动画效果 */
@keyframes photoClick {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}
</style>
