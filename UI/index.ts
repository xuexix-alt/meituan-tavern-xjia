/**
 * UI技能系统 - 主入口文件
 * 统一导出所有UI组件、动画工具和样式工具
 */

// 组件库
export * from './components';

// 动画工具
export * from './animations';

// 样式工具（仅类型导出）
export type {
  // 可以在这里导出样式相关的类型
} from './styles/tokens.scss';

export { default as styleTokens } from './styles/tokens.scss';
export { default as styleMixins } from './styles/mixins.scss';
