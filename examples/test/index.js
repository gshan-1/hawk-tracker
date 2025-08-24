// 该文件作用：测试core和plugin-error、plugin-behavior的打包与核心机制展示

// import { init } from '/@fs/E:/my-pnpm-protect/埋点sdk/packages/core/src/index.ts';
// import { ErrorPlugin } from '/@fs/E:/my-pnpm-protect/埋点sdk/packages/plugin-error/src/index.ts';
// import { BehaviorPlugin } from '/@fs/E:/my-pnpm-protect/埋点sdk/packages/plugin-behavior/src/index.ts';
import { init } from '@hawk-tracker/core';
import { ErrorPlugin } from '@hawk-tracker/plugin-error';
import { BehaviorPlugin } from '@hawk-tracker/plugin-behavior';
console.log('Initializing Hawk Tracker...');

const hawkTracker = init({
  // dsn: 'http://127.0.0.1:3000/api/data',
  dsn: 'http://localhost:9999/disabled', // 设置为不存在的地址，禁用数据上报
  appName: 'demo-app',
  appCode: 'demo-code',
  appVersion: '1.0.0',
  sampleRate: 1,
  debug: true,
  batchSize: 15,
  sendInterval: 5000,
  maxConcurrentRequests: 3,
  offlineStorageKey: 'sdk_report_queue',
  // behavior: { core: true, maxSize: 300, debug: true },
  behavior: { 
    core: true, 
    maxSize: 300, 
    debug: true,
    click: {
      enabled: true,
      ignoreSelectors: ['.no-track', '[data-no-track]'],
      customAttributes: ['category', 'action', 'value'],
      beforeSend: (event) => {
        console.log('点击事件被捕获:', event);
        return event; // 返回事件继续处理
      }
    }
  },
});

console.log('Using ErrorPlugin...');
hawkTracker.use(ErrorPlugin);

console.log('Using BehaviorPlugin...');
hawkTracker.use(BehaviorPlugin, {
  stackName: 'plugin:behavior:main',
  maxSize: 300,
  debug: true,
});

// UI wiring
const els = {
  statsCore: document.getElementById('stats-core'),
  statsPlugin: document.getElementById('stats-plugin'),
  snapshotCore: document.getElementById('snapshot-core'),
  snapshotPlugin: document.getElementById('snapshot-plugin'),
  btnCustom: document.getElementById('btn-custom'),
  btnFetch: document.getElementById('btn-fetch'),
  btnPush: document.getElementById('btn-pushstate'),
  btnHash: document.getElementById('btn-hash'),
  btnClear: document.getElementById('btn-clear'),
  btnRender: document.getElementById('btn-render'),
};

const defaultStack = hawkTracker.getBehaviorStack();
const pluginStack = hawkTracker.getBehaviorStack('plugin:behavior:main');

function render() {
  if (els.statsCore) {
    els.statsCore.textContent = JSON.stringify(
      defaultStack?.getStats?.() || {},
      null,
      2,
    );
  }
  if (els.statsPlugin) {
    els.statsPlugin.textContent = JSON.stringify(
      pluginStack?.getStats?.() || {},
      null,
      2,
    );
  }
  if (els.snapshotCore) {
    els.snapshotCore.textContent = JSON.stringify(
      defaultStack?.getSnapshot?.({ maxCount: 10 }) || [],
      null,
      2,
    );
  }
  if (els.snapshotPlugin) {
    els.snapshotPlugin.textContent = JSON.stringify(
      pluginStack?.getSnapshot?.({ maxCount: 10 }) || [],
      null,
      2,
    );
  }
}

// initial render on load event to ensure BehaviorPlugin captured load
window.addEventListener('load', () => setTimeout(render, 50));

// add custom event
els.btnCustom?.addEventListener('click', () => {
  defaultStack?.addCustomEvent(
    'custom_button_click',
    { source: 'btn-custom' },
    { customData: { action: 'click' } },
  );
  render();
});

// trigger fetch (captured by AOP fetch replacement and BehaviorPlugin)
els.btnFetch?.addEventListener('click', async () => {
  try {
    await fetch('https://jsonplaceholder.typicode.com/todos/1');
  } catch (e) {}
  render();
});

// trigger history.pushState
els.btnPush?.addEventListener('click', () => {
  history.pushState(
    { t: Date.now() },
    '',
    `?p=${Math.random().toString(16).slice(2, 6)}`,
  );
  render();
});

// trigger hashchange
els.btnHash?.addEventListener('click', () => {
  location.hash = `#h=${Math.random().toString(16).slice(2, 6)}`;
  render();
});

// clear default stack
els.btnClear?.addEventListener('click', () => {
  defaultStack?.clear?.();
  render();
});

// force render
els.btnRender?.addEventListener('click', render);

// Expose for console demo
window.hawkTracker = hawkTracker;
window.defaultStack = defaultStack;
window.pluginStack = pluginStack;
