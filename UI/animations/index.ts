/**
 * 动画工具库 - GSAP封装和常用动画效果
 * 提供流畅的页面转场和交互动画
 */

import { gsap } from 'gsap';

// 页面动画预设（遵循200-300ms标准时长）
export const pageAnimations = {
  // 淡入动画 - 标准状态变化：250ms
  fadeIn: (selector: string, duration = 0.25) => {
    return gsap.fromTo(
      selector,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration, ease: 'cubic-bezier(0.4, 0, 0.2, 1)' }
    );
  },

  // 滑入动画 - 标准状态变化：250ms
  slideIn: (selector: string, direction: 'left' | 'right' | 'up' | 'down' = 'up', duration = 0.25) => {
    const fromVars: any = { opacity: 0 };
    const toX = 0, toY = 0;

    switch (direction) {
      case 'left':
        fromVars.x = -50;
        break;
      case 'right':
        fromVars.x = 50;
        break;
      case 'up':
        fromVars.y = 50;
        break;
      case 'down':
        fromVars.y = -50;
        break;
    }

    return gsap.fromTo(
      selector,
      fromVars,
      { x: toX, y: toY, opacity: 1, duration, ease: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)' }
    );
  },

  // 弹跳进入 - 强调动画：300ms
  bounceIn: (selector: string, duration = 0.3) => {
    return gsap.fromTo(
      selector,
      { scale: 0.3, opacity: 0 },
      { scale: 1, opacity: 1, duration, ease: 'bounce.out' }
    );
  },

  // 缩放出现 - 微交互：200ms
  scaleIn: (selector: string, duration = 0.2) => {
    return gsap.fromTo(
      selector,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration, ease: 'cubic-bezier(0.3, 0, 0.8, 0.15)' }
    );
  },

  // 旋转进入 - 页面转场：350ms
  rotateIn: (selector: string, duration = 0.35) => {
    return gsap.fromTo(
      selector,
      { rotation: -180, scale: 0, opacity: 0 },
      { rotation: 0, scale: 1, opacity: 1, duration, ease: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)' }
    );
  }
};

// 交互动画（遵循200-300ms标准）
export const interactionAnimations = {
  // 悬停放大 - 微交互：200ms
  hoverScale: (selector: string, scale = 1.05) => {
    return gsap.to(selector, {
      scale,
      duration: 0.2,
      ease: 'cubic-bezier(0.3, 0, 0.8, 0.15)'
    });
  },

  // 按钮点击反馈 - 微交互：150ms
  buttonClick: (selector: string) => {
    return gsap.fromTo(
      selector,
      { scale: 1 },
      { scale: 0.95, duration: 0.15, yoyo: true, repeat: 1, ease: 'cubic-bezier(0.3, 0, 1, 1)' }
    );
  },

  // 卡片悬停效果 - 微交互：200ms
  cardHover: (selector: string) => {
    const tl = gsap.timeline({ paused: true });
    tl.to(selector, {
      y: -8,
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
      duration: 0.2,
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
    return tl;
  },

  // 加载动画 - 加载动画：1000ms
  loadingSpinner: (selector: string) => {
    return gsap.to(selector, {
      rotation: 360,
      duration: 1,
      repeat: -1,
      ease: 'linear'
    });
  }
};

// 页面转场动画
export const pageTransitions = {
  // 滑动转场
  slideTransition: (containerSelector: string, direction: 'left' | 'right' = 'left') => {
    const tl = gsap.timeline();
    const offset = direction === 'left' ? '-100%' : '100%';

    tl.fromTo(
      containerSelector,
      { x: offset, opacity: 0 },
      { x: '0%', opacity: 1, duration: 0.5, ease: 'power3.inOut' }
    );

    return tl;
  },

  // 淡入淡出转场
  fadeTransition: (selector: string) => {
    const tl = gsap.timeline();
    tl.to(selector, { opacity: 0, duration: 0.3 })
      .fromTo(
        selector,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    return tl;
  }
};

// 列表动画
export const listAnimations = {
  // 列表项依次进入
  staggerIn: (selector: string, stagger = 0.1) => {
    return gsap.fromTo(
      selector,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger,
        ease: 'power2.out'
      }
    );
  },

  // 瀑布流加载动画
  waterfall: (selector: string, stagger = 0.05) => {
    return gsap.fromTo(
      selector,
      { opacity: 0, scale: 0.8, y: 20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        stagger,
        ease: 'back.out(1.7)'
      }
    );
  }
};

// 进度条动画
export const progressAnimations = {
  // 数字递增
  counter: (selector: string, toValue: number, duration = 2) => {
    const obj = { value: 0 };
    return gsap.to(obj, {
      value: toValue,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) element.textContent = Math.floor(obj.value).toString();
      }
    });
  },

  // 进度条填充
  progressFill: (selector: string, toPercentage: number, duration = 1.5) => {
    return gsap.to(selector, {
      width: `${toPercentage}%`,
      duration,
      ease: 'power2.inOut'
    });
  }
};

export default {
  pageAnimations,
  interactionAnimations,
  pageTransitions,
  listAnimations,
  progressAnimations
};
