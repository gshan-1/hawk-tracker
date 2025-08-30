// 该文件作用：测试core和plugin-error、plugin-behavior的打包与核心机制展示

import { init } from '../../packages/core/dist/index.mjs';
import { ErrorPlugin } from '../../packages/plugin-error/dist/index.mjs';
import { PerformancePlugin } from '../../packages/plugin-performance/dist/index.mjs';

console.log('Initializing Hawk Tracker...');

const hawkTracker = init({
  dsn: 'https://your-dsn.com',
  appName: 'demo-app',
  appCode: 'demo-code',
  appVersion: '1.0.0',
  sampleRate: 1,
  debug: true,
  batchSize: 15,
  sendInterval: 5000,
  maxConcurrentRequests: 3,
  offlineStorageKey: 'sdk_report_queue',
  behavior: {
    core: true,
    maxSize: 300,
    debug: true,
  },
});

console.log('Using ErrorPlugin...');
hawkTracker.use(ErrorPlugin);

console.log('Using PerformancePlugin...');
hawkTracker.use(PerformancePlugin, {
  enableWebVitals: true,
  enableResourceTiming: true,
  enableNavigationTiming: true,
  resourceTypes: ['script', 'css', 'img', 'fetch', 'xmlhttprequest'],
  performanceThresholds: {
    loadTime: 3000,
    domContentLoaded: 1500,
    firstPaint: 1000,
    lcp: 2500,
    fid: 100,
    cls: 0.1,
  },
});

// 将 hawkTracker 实例暴露到全局，方便测试
window.hawkTracker = hawkTracker;

// 添加性能监控相关的全局函数
window.getPerformanceData = () => {
  const performancePlugin = hawkTracker.plugins.find(
    (p) => p.constructor.name === 'PerformancePlugin',
  );
  if (performancePlugin) {
    return performancePlugin.collectManualPerformanceData();
  }
  return null;
};

window.getResourceTimingData = () => {
  const performancePlugin = hawkTracker.plugins.find(
    (p) => p.constructor.name === 'PerformancePlugin',
  );
  if (performancePlugin) {
    return performancePlugin.getResourceTimingData();
  }
  return null;
};

// 新增：获取资源汇总统计的全局函数
window.getResourceSummary = () => {
  const performancePlugin = hawkTracker.plugins.find(
    (p) => p.constructor.name === 'PerformancePlugin',
  );
  if (performancePlugin && performancePlugin.getResourceSummary) {
    return performancePlugin.getResourceSummary();
  }

  // 如果插件中没有getResourceSummary方法，则手动计算
  const resources = performance.getEntriesByType('resource');
  const summary = {
    totalResources: resources.length,
    totalBytes: resources.reduce(
      (sum, resource) => sum + (resource.transferSize || 0),
      0,
    ),
    byType: {},
  };

  resources.forEach((resource) => {
    const type = resource.initiatorType;
    if (!summary.byType[type]) {
      summary.byType[type] = { count: 0, bytes: 0 };
    }
    summary.byType[type].count++;
    summary.byType[type].bytes += resource.transferSize || 0;
  });

  return summary;
};

console.log('Hawk Tracker 初始化完成，包含错误监控和性能监控功能');
