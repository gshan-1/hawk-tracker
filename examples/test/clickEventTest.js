import { init } from '@hawk-tracker/core';
import { BehaviorPlugin } from '@hawk-tracker/plugin-behavior';

// 初始化 Hawk Tracker
const hawkTracker = init({
  dsn: 'http://localhost:9999/disabled', // 禁用数据上报
  appName: 'click-event-test',
  appCode: 'click-test',
  appVersion: '1.0.0',
  sampleRate: 1,
  debug: true,
  behavior: { 
    core: true, 
    maxSize: 100, 
    debug: true,
    click: {
      enabled: true,
      ignoreSelectors: ['.no-track', '[data-no-track]'],
      customAttributes: ['category', 'action', 'value'],
      beforeSend: (event) => {
        console.log('点击事件被捕获:', event);
        logEvent('点击事件被捕获', event);
        updateStats();
        return event;
      }
    }
  },
});

// 使用行为插件
hawkTracker.use(BehaviorPlugin, {
  stackName: 'click-test-stack',
  maxSize: 100,
  debug: true,
  enableClick: true,
});

// 获取行为栈
const behaviorStack = hawkTracker.getBehaviorStack('click-test-stack');

// 统计变量
let stats = {
  totalClicks: 0,
  trackedClicks: 0,
  ignoredClicks: 0
};

// 日志管理
class EventLogger {
  constructor() {
    this.logElement = document.getElementById('event-log');
    this.snapshotElement = document.getElementById('behavior-snapshot');
    this.resultsElement = document.getElementById('test-results');
  }

  log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    
    if (data) {
      console.log(logEntry, data);
      this.logElement.textContent += `${logEntry}\n${JSON.stringify(data, null, 2)}\n\n`;
    } else {
      console.log(logEntry);
      this.logElement.textContent += `${logEntry}\n`;
    }
    
    this.logElement.scrollTop = this.logElement.scrollHeight;
  }

  updateSnapshot() {
    const snapshot = behaviorStack?.getSnapshot?.({ maxCount: 20 }) || [];
    this.snapshotElement.textContent = JSON.stringify(snapshot, null, 2);
  }

  clear() {
    this.logElement.textContent = '';
    this.snapshotElement.textContent = '';
    this.resultsElement.textContent = '';
  }
}

const logger = new EventLogger();

// 全局点击监听器（用于统计）
document.addEventListener('click', (e) => {
  stats.totalClicks++;
  updateStats();
  
  // 检查是否被忽略
  const isIgnored = e.target.closest('.no-track') || e.target.closest('[data-no-track]');
  if (isIgnored) {
    stats.ignoredClicks++;
    logger.log('点击被忽略', {
      element: e.target.tagName,
      className: e.target.className,
      reason: '元素被忽略'
    });
  } else if (e.target.hasAttribute('data-tracking-event-id')) {
    stats.trackedClicks++;
  }
});

// 更新统计信息
function updateStats() {
  document.getElementById('total-clicks').textContent = stats.totalClicks;
  document.getElementById('tracked-clicks').textContent = stats.trackedClicks;
  document.getElementById('ignored-clicks').textContent = stats.ignoredClicks;
  document.getElementById('behavior-stack-size').textContent = 
    behaviorStack?.getStats?.()?.size || 0;
  
  // 更新行为栈快照
  logger.updateSnapshot();
}

// 控制函数
window.enableClickTracking = function() {
  if (hawkTracker.enableClickTracking) {
    hawkTracker.enableClickTracking();
    document.getElementById('tracking-status').textContent = '状态: 已启用';
    document.getElementById('tracking-status').style.color = '#28a745';
    logger.log('点击监控已启用');
  }
};

window.disableClickTracking = function() {
  if (hawkTracker.disableClickTracking) {
    hawkTracker.disableClickTracking();
    document.getElementById('tracking-status').textContent = '状态: 已禁用';
    document.getElementById('tracking-status').style.color = '#dc3545';
    logger.log('点击监控已禁用');
  }
};

window.clearLogs = function() {
  logger.clear();
  stats = { totalClicks: 0, trackedClicks: 0, ignoredClicks: 0 };
  updateStats();
  logger.log('日志已清空');
};

// 日志事件函数
function logEvent(message, data) {
  logger.log(message, data);
}

// 自动化测试
class TestResults {
  constructor() {
    this.results = [];
    this.element = document.getElementById('test-results');
  }

  addTest(name, passed, details = '') {
    this.results.push({ name, passed, details });
    this.updateDisplay();
  }

  updateDisplay() {
    this.element.textContent = this.results.map(result => 
      `${result.passed ? '✅' : '❌'} ${result.name}: ${result.details}`
    ).join('\n');
  }

  clear() {
    this.results = [];
    this.updateDisplay();
  }
}

const testResults = new TestResults();

// 自动化测试函数
window.runAutomatedTests = async function() {
  testResults.clear();
  logger.log('开始自动化测试...');
  
  const tests = [
    {
      name: '基础点击事件捕获',
      test: () => {
        const button = document.querySelector('[data-tracking-event-id="btn-1"]');
        if (!button) return false;
        
        const initialSize = behaviorStack?.getStats?.()?.size || 0;
        button.click();
        
        // 等待事件处理
        setTimeout(() => {
          const newSize = behaviorStack?.getStats?.()?.size || 0;
          const passed = newSize > initialSize;
          testResults.addTest('基础点击事件捕获', passed, 
            `栈大小: ${initialSize} -> ${newSize}`);
        }, 100);
      }
    },
    {
      name: '忽略元素测试',
      test: () => {
        const button = document.querySelector('.no-track');
        if (!button) return false;
        
        const initialSize = behaviorStack?.getStats?.()?.size || 0;
        button.click();
        
        setTimeout(() => {
          const newSize = behaviorStack?.getStats?.()?.size || 0;
          const passed = newSize === initialSize; // 应该不增加
          testResults.addTest('忽略元素测试', passed, 
            `栈大小: ${initialSize} -> ${newSize} (应该不变)`);
        }, 100);
      }
    },
    {
      name: '自定义属性提取',
      test: () => {
        const button = document.querySelector('[data-category="test"]');
        if (!button) return false;
        
        button.click();
        
        setTimeout(() => {
          const snapshot = behaviorStack?.getSnapshot?.({ maxCount: 1 }) || [];
          const lastEvent = snapshot[snapshot.length - 1];
          const hasCustomAttr = lastEvent && lastEvent.params && 
                               lastEvent.params.category === 'test';
          testResults.addTest('自定义属性提取', hasCustomAttr, 
            hasCustomAttr ? '属性提取成功' : '属性提取失败');
        }, 100);
      }
    }
  ];

  // 执行测试
  for (const test of tests) {
    test.test();
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  logger.log('自动化测试完成');
};

// 初始化
logger.log('点击事件测试页面已加载');
logger.log('Hawk Tracker 配置:', {
  dsn: hawkTracker.config?.dsn,
  clickEnabled: hawkTracker.config?.behavior?.click?.enabled,
  ignoreSelectors: hawkTracker.config?.behavior?.click?.ignoreSelectors
});

// 定期更新统计
setInterval(updateStats, 1000);

// 暴露到全局
window.hawkTracker = hawkTracker;
window.behaviorStack = behaviorStack;
window.logger = logger;