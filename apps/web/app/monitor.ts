import { init } from '@hawk-tracker/core';
import { ErrorPlugin } from '@hawk-tracker/plugin-error';
import { PerformancePlugin } from '@hawk-tracker/plugin-performance';
import { BehaviorPlugin } from '@hawk-tracker/plugin-behavior';

// 监控配置 - 基于你的SDK实际配置结构
const monitorConfig = {
  // 基础配置
  dsn: 'http://localhost:3001/api', // 上报地址
  appName: 'Hawk Tracker Web', // 应用名称
  appCode: 'hawk-tracker-web', // 应用代码
  appVersion: '1.0.0', // 应用版本

  // 调试配置
  debug: false, // 关闭调试模式，减少日志输出
  sampleRate: 1.0, // 采样率 100%

  // 数据发送配置
  batchSize: 10, // 批量上报大小
  sendInterval: 5000, // 上报间隔 5秒
  maxRetry: 3, // 最大重试次数
  backoffBaseMs: 1000, // 退避基础时间
  backoffMaxMs: 10000, // 退避最大时间
  maxConcurrentRequests: 3, // 最大并发请求数
  offlineStorageKey: 'hawk_tracker_queue', // 离线存储键名

  // 功能开关
  pv: true, // 页面访问统计
  performance: {
    core: true, // 性能监控
    firstResource: true, // 首次资源加载
    server: true, // 接口请求监控
  },
  error: {
    core: true, // 错误监控
    server: true, // 接口错误监控
  },
  event: {
    core: true, // 事件监控
  },

  // 行为栈配置
  behavior: {
    core: true, // 启用行为栈管理
    maxSize: 100, // 最大事件数量
    maxAge: 5 * 60 * 1000, // 最大事件年龄 5分钟
    debug: false, // 关闭行为栈调试模式

    // 点击事件配置
    click: {
      enabled: true, // 启用点击事件监控
      throttle: 100, // 点击事件节流时间
      ignoreSelectors: ['.ignore-click', '[data-ignore-click]'], // 忽略的选择器
      capturePosition: true, // 捕获点击位置
      captureElementInfo: true, // 捕获元素详细信息
      maxElementTextLength: 100, // 元素文本最大长度
      customAttributes: ['data-track', 'data-event'], // 自定义属性
    },
  },

  // 错误过滤
  ignoreErrors: [
    /Script error\.?/, // 忽略跨域脚本错误
    /ResizeObserver loop limit exceeded/, // 忽略 ResizeObserver 错误
  ],

  // 请求过滤
  ignoreRequest: [
    /localhost:3001/, // 忽略对监控服务器的请求
    /\.(css|js|png|jpg|jpeg|gif|svg|ico)$/, // 忽略静态资源
  ],

  // 超时配置
  timeout: 10000, // 上报超时时间 10秒
  maxQueueLength: 1000, // 最大队列长度

  // 自定义全局参数
  ext: {
    projectId: 'hawk-tracker-web',
    environment: process.env.NODE_ENV,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
  },
};

// 全局监控实例
let monitorInstance: any = null;

// 初始化监控
export function initMonitor() {
  try {
    console.log('🚀 初始化 Hawk Tracker 监控...');
    console.log('📊 配置信息:', {
      dsn: monitorConfig.dsn,
      appName: monitorConfig.appName,
      debug: monitorConfig.debug,
    });

    // 初始化核心监控
    monitorInstance = init(monitorConfig);

    // 使用 use 方法加载插件
    console.log('🔌 加载监控插件...');

    // 加载错误监控插件
    monitorInstance.use(ErrorPlugin, {
      behaviorStackName: 'user_behavior',
      behaviorSnapshotCount: 50,
      attachRrweb: true,
      rrwebMaxSize: 200,
      rrwebMaxBytes: 64 * 1024,
      appId: monitorConfig.appCode,
      version: monitorConfig.appVersion,
      dedupeWindowMs: 3000,
      maxConsecutiveFailures: 3,
      circuitOpenMs: 5000,
    });

    // 加载性能监控插件
    monitorInstance.use(PerformancePlugin, {
      // 页面性能监控
      pagePerformance: {
        enabled: true,
        metrics: [
          'navigation',
          'paint',
          'largest-contentful-paint',
          'first-input-delay',
        ],
      },
      // 资源性能监控
      resourcePerformance: {
        enabled: true,
        includeTypes: [
          'script',
          'css',
          'image',
          'font',
          'fetch',
          'xmlhttprequest',
        ],
        excludeUrls: [/localhost:3001/], // 排除监控服务器
      },
      // 接口性能监控
      apiPerformance: {
        enabled: true,
        includeMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        excludeUrls: [/localhost:3001/], // 排除监控服务器
        slowRequestThreshold: 3000, // 慢请求阈值 3秒
      },
      // 自定义性能指标
      customMetrics: {
        enabled: true,
        metrics: ['memory', 'longTasks'],
      },
    });

    // 加载行为监控插件
    monitorInstance.use(BehaviorPlugin, {
      stackName: 'user_behavior',
      maxSize: 200,
      maxAge: 5 * 60 * 1000,
      debug: false,
      enableClick: true,
    });

    console.log('✅ Hawk Tracker 监控初始化成功');
    console.log(
      '📦 已加载插件: ErrorPlugin, PerformancePlugin, BehaviorPlugin',
    );

    return monitorInstance;
  } catch (error) {
    console.error('❌ Hawk Tracker 监控初始化失败:', error);
    return null;
  }
}

// 获取监控实例
export function getMonitor() {
  return monitorInstance;
}

// 便捷方法：手动上报事件
export function trackEvent(eventName: string, data: any = {}) {
  if (!monitorInstance) {
    console.warn('⚠️ 监控实例未初始化');
    return;
  }

  try {
    monitorInstance.track('event', {
      eventName,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      page: getCurrentPage(),
      ...data,
    });
  } catch (error) {
    console.error('❌ 事件上报失败:', error);
  }
}

// 便捷方法：上报错误
export function trackError(error: Error, extra?: any) {
  if (!monitorInstance) {
    console.warn('⚠️ 监控实例未初始化');
    return;
  }

  try {
    monitorInstance.track('error', {
      errorType: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      page: getCurrentPage(),
      isImmediate: true, // 关键：立即上报优先级
      ...extra,
    });
    flush();
  } catch (err) {
    console.error('❌ 错误上报失败:', err);
  }
}

// 便捷方法：上报性能数据
export function trackPerformance(data: any) {
  if (!monitorInstance) {
    console.warn('⚠️ 监控实例未初始化');
    return;
  }

  try {
    monitorInstance.track('performance', {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      page: getCurrentPage(),
      ...data,
    });
  } catch (error) {
    console.error('❌ 性能数据上报失败:', error);
  }
}

// 便捷方法：添加用户行为
export function addBehavior(eventType: string, context?: Record<string, any>) {
  if (!monitorInstance) {
    console.warn('⚠️ 监控实例未初始化');
    return false;
  }

  try {
    return monitorInstance.pushBehavior({
      type: eventType,
      context: context || {},
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    });
  } catch (error) {
    console.error('❌ 行为记录失败:', error);
    return false;
  }
}

// 便捷方法：获取行为数据
export function getBehaviors(options?: any) {
  if (!monitorInstance) {
    console.warn('⚠️ 监控实例未初始化');
    return [];
  }

  try {
    return monitorInstance.getBehaviors(options);
  } catch (error) {
    console.error('❌ 获取行为数据失败:', error);
    return [];
  }
}

// 便捷方法：清空行为数据
export function clearBehaviors() {
  if (!monitorInstance) {
    console.warn('⚠️ 监控实例未初始化');
    return;
  }

  try {
    monitorInstance.clearBehaviors();
    console.log('🗑️ 行为数据已清空');
  } catch (error) {
    console.error('❌ 清空行为数据失败:', error);
  }
}

// 获取当前页面信息
function getCurrentPage(): string {
  if (typeof window === 'undefined') return 'unknown';

  const path = window.location.pathname;
  if (path === '/') return 'home';
  if (path.startsWith('/projects')) return 'projects';
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/login')) return 'login';
  if (path.startsWith('/register')) return 'register';
  return 'unknown';
}

// 手动发送数据
export function flush() {
  if (monitorInstance && monitorInstance.dataSender) {
    monitorInstance.dataSender.flush();
  }
}

// 销毁监控实例
export function destroy() {
  if (monitorInstance) {
    // 清空行为数据
    clearBehaviors();

    // 发送剩余数据
    flush();

    monitorInstance = null;
    console.log('��️ 监控实例已销毁');
  }
}
