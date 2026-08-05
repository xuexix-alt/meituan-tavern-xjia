/**
 * 统一日志管理工具
 * 根据环境变量或设置决定是否输出日志
 */

// 全局日志开关
const ENABLE_LOGS = process.env.NODE_ENV !== 'production';
const ENABLE_PERF_VERBOSE = false;

class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  private formatArgs(args: any[]): any[] {
    if (this.prefix) {
      if (typeof args[0] === 'string') {
        return [`${this.prefix}${args[0]}`, ...args.slice(1)];
      }
      return [this.prefix, ...args];
    }
    return args;
  }

  log(...args: any[]) {
    if (ENABLE_LOGS) {
      console.log(...this.formatArgs(args));
    }
  }

  info(...args: any[]) {
    if (ENABLE_LOGS) {
      console.info(...this.formatArgs(args));
    }
  }

  warn(...args: any[]) {
    console.warn(...this.formatArgs(args));
  }

  error(...args: any[]) {
    console.error(...this.formatArgs(args));
  }

  // 性能日志 - 仅在开启详细性能日志时输出
  perf(...args: any[]) {
    if (ENABLE_PERF_VERBOSE) {
      console.log(...this.formatArgs(['[性能]', ...args]));
    }
  }
}

export const logger = new Logger();
export const perfLogger = new Logger('性能');
export const mvuLogger = new Logger('MVU');
export const sysLogger = new Logger('系统');
