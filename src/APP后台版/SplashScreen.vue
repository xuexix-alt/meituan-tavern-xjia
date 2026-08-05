<template>
  <div class="splash-screen" @click="skipSplash">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle-bg circle-1"></div>
      <div class="circle-bg circle-2"></div>
      <div class="circle-bg circle-3"></div>
    </div>

    <!-- 主要内容 -->
    <div class="splash-content">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-container">
          <div class="logo-icon">
            <i class="fas fa-heart"></i>
          </div>
          <div class="logo-text">
            <h1 class="brand-name">美人团</h1>
            <p class="brand-subtitle">Mei Ren Tuan</p>
          </div>
        </div>
      </div>

      <!-- Slogan区域 -->
      <div class="slogan-section">
        <p class="main-slogan">{{ slogan }}</p>
        <div class="slogan-decoration">
          <div class="decoration-line"></div>
          <i class="fas fa-star"></i>
          <div class="decoration-line"></div>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="footer-section">
        <div class="version-info">
          <span>v3.0.0后台版</span>
        </div>
        <div class="skip-button" :class="{ 'fade-out': isFading }" @click="skipSplash">
          <span>跳过</span>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    </div>

    <!-- 加载动画 -->
    <div class="loading-indicator">
      <div class="loading-dots">
        <span v-for="i in 3" :key="i" class="dot" :style="{ animationDelay: `${(i - 1) * 0.2}s` }"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { navigateToDefaultPage } from './utils';

// 响应式数据
const slogan = ref('为您送上一切心动的美人');
const isFading = ref(false);
const router = useRouter();

// 跳过启动画面
async function skipSplash() {
  try {
    isFading.value = true;
    // 调用智能导航函数决定目标页面
    const targetPath = await navigateToDefaultPage();
    console.log(`[智能导航] 启动画面跳过，跳转到: ${targetPath}`);

    setTimeout(() => {
      router.push(targetPath);
    }, 300);
  } catch (error) {
    console.error('[智能导航] 导航失败，使用默认首页:', error);
    // 出错时默认跳转到首页
    setTimeout(() => {
      router.push('/home');
    }, 300);
  }
}

onMounted(async () => {
  // 启动画面已显示，3秒后自动跳过
  setTimeout(() => {
    skipSplash();
  }, 3000); // 3秒后自动跳过
});
</script>

<style lang="scss" scoped>
.splash-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffc300 0%, #ff9500 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.8s ease-out;
  margin: 0 auto;

  .bg-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;

    .circle-bg {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      animation: float 6s ease-in-out infinite;

      &.circle-1 {
        width: 300px;
        height: 300px;
        top: -100px;
        right: -100px;
        animation-delay: 0s;
      }

      &.circle-2 {
        width: 200px;
        height: 200px;
        bottom: -50px;
        left: -50px;
        animation-delay: 2s;
      }

      &.circle-3 {
        width: 150px;
        height: 150px;
        top: 20%;
        left: 10%;
        animation-delay: 4s;
      }
    }
  }

  .splash-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 0 40px;
    z-index: 1;

    .logo-section {
      margin-bottom: 60px;
      animation: slideInDown 1s ease-out 0.2s both;

      .logo-container {
        text-align: center;

        .logo-icon {
          width: 100px;
          height: 100px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          animation: logoBounce 2s ease-in-out infinite;

          i {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #ff6b35, #ff9500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        }

        .logo-text {
          .brand-name {
            font-size: 2.5rem;
            font-weight: 900;
            color: white;
            margin: 0 0 8px 0;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            letter-spacing: 2px;
          }

          .brand-subtitle {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            font-weight: 500;
            letter-spacing: 1px;
          }
        }
      }
    }

    .slogan-section {
      text-align: center;
      animation: slideInUp 1s ease-out 0.6s both;

      .main-slogan {
        font-size: 1.3rem;
        font-weight: 500;
        color: white;
        margin: 0 0 30px 0;
        line-height: 1.6;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        letter-spacing: 0.5px;
        max-width: 280px;
      }

      .slogan-decoration {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;

        .decoration-line {
          width: 40px;
          height: 2px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 1px;
        }

        i {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          animation: sparkle 2s ease-in-out infinite;
        }
      }
    }
  }

  .footer-section {
    width: 100%;
    padding: 0 40px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    animation: fadeIn 1s ease-out 1s both;

    .version-info {
      span {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8rem;
        font-weight: 500;
      }
    }

    .skip-button {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 8px 12px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.1);
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateX(4px);
      }

      &.fade-out {
        opacity: 0;
        transform: translateX(10px);
      }

      i {
        font-size: 0.8rem;
      }
    }
  }

  .loading-indicator {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    animation: fadeIn 1s ease-out 1.2s both;

    .loading-dots {
      display: flex;
      gap: 8px;

      .dot {
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        animation: loadingDot 1.4s ease-in-out infinite;

        &:nth-child(1) {
          animation-delay: 0s;
        }
        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }
  }
}

// 动画定义
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes logoBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(5deg);
  }
}

@keyframes loadingDot {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  40% {
    opacity: 1;
    transform: scale(1.3);
  }
}
</style>
