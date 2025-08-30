// 错误插件使用示例

// ==================== Vue 使用示例 ====================

// 1. 初始化监控
import { init } from '@hawk-tracker/core';
import { createVueErrorHandler } from '@hawk-tracker/plugin-error';
import { ErrorPlugin } from '@hawk-tracker/plugin-error';
import { RrwebPlugin } from '@hawk-tracker/plugin-rrweb';

// 方式一：使用全局实例（推荐）
init({
  dsn: 'https://your-server.com/collect',
  appId: 'my-vue-app',
  version: '1.0.0',
});

// 注册错误处理器（不传参）
Vue.config.errorHandler = createVueErrorHandler();

// 方式二：传参方式
const vueCore = init({
  dsn: 'https://your-server.com/collect',
  appId: 'my-vue-app',
  version: '1.0.0',
});

// 安装录屏插件
vueCore.use(
  new RrwebPlugin({
    preset: 'balanced',
    maxEvents: 500,
  }),
);

// 安装错误插件，启用录屏关联
vueCore.use(
  new ErrorPlugin({
    attachRrweb: true,
    rrwebMaxSize: 200,
    behaviorSnapshotCount: 50,
  }),
);

// 注册错误处理器（不传参）
Vue.config.errorHandler = createVueErrorHandler();

// 方式二：传参方式
const vueCoreWithParam = init({
  dsn: 'https://your-server.com/collect',
  appId: 'my-vue-app',
  version: '1.0.0',
});

// 注册错误处理器（传参）
Vue.config.errorHandler = createVueErrorHandler(vueCoreWithParam);

// ==================== React 使用示例 ====================

import React from 'react';
import { withReactErrorBoundary } from '@hawk-tracker/plugin-error';

// 方式一：使用全局实例（推荐）
const reactCore = init({
  dsn: 'https://your-server.com/collect',
  appId: 'my-react-app',
  version: '1.0.0',
});

// 安装录屏插件
reactCore.use(
  new RrwebPlugin({
    preset: 'balanced',
    maxEvents: 500,
  }),
);

// 安装错误插件，启用录屏关联
reactCore.use(
  new ErrorPlugin({
    attachRrweb: true,
    rrwebMaxSize: 200,
    behaviorSnapshotCount: 50,
  }),
);

// 原始组件
function App() {
  const [count, setCount] = React.useState(0);

  const triggerError = () => {
    throw new Error('这是一个测试错误');
  };

  return (
    <div>
      <h1>React 应用</h1>
      <p>点击次数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <button onClick={triggerError}>触发错误</button>
    </div>
  );
}

// 包装组件（不传参）
const SafeApp = withReactErrorBoundary()(App);

// 方式二：传参方式
const reactCoreWithParam = init({
  dsn: 'https://your-server.com/collect',
  appId: 'my-react-app',
  version: '1.0.0',
});

// 包装组件（传参）
const SafeAppWithCore = withReactErrorBoundary(reactCoreWithParam)(App);

// ==================== 错误录屏关联示例 ====================

// 错误发生时，录屏插件会自动标记错误点
// 错误数据会包含：
// 1. rrwebSnapshot: 最近的录屏事件
// 2. errorContext: 错误发生时的上下文信息
// 3. 错误发生前后的用户行为

// 示例：获取错误相关的录屏数据
function demonstrateErrorRecording() {
  // 模拟错误发生
  try {
    throw new Error('演示错误');
  } catch (error) {
    // 错误插件会自动：
    // 1. 捕获错误
    // 2. 标记录屏时间点
    // 3. 收集错误上下文
    // 4. 发送完整数据到服务器

    console.log('错误已被捕获并关联录屏数据');
  }
}

// 手动获取录屏数据（用于调试）
function getRecordingData() {
  const api = window.$hawkRrweb;
  if (api) {
    // 获取最近的录屏事件
    const replay = api.getReplay({ maxSize: 100 });
    console.log('录屏回放数据:', replay);

    // 获取错误上下文
    const errorContext = api.getErrorContext({
      errorType: 'Error',
      errorMessage: '测试错误',
      timestamp: Date.now(),
    });
    console.log('错误上下文:', errorContext);

    // 获取用户行为
    const userBehavior = api.getErrorBehavior({
      errorType: 'Error',
      errorMessage: '测试错误',
    });
    console.log('用户行为:', userBehavior);
  }
}

// ==================== 测试错误示例 ====================

// Vue 测试组件
const ErrorTestVue = {
  name: 'ErrorTest',
  template: `
    <div>
      <h1>Vue 错误测试</h1>
      <button @click="testSyncError">测试同步错误</button>
      <button @click="testAsyncError">测试异步错误</button>
      <button @click="testRecordingData">查看录屏数据</button>
    </div>
  `,
  methods: {
    testSyncError() {
      throw new Error('这是一个同步错误测试');
    },
    async testAsyncError() {
      try {
        await fetch('/api/nonexistent');
      } catch (error) {
        throw new Error('异步错误测试: ' + error.message);
      }
    },

  },
};

// React 测试组件
function ErrorTestReact() {
  const testSyncError = () => {
    throw new Error('这是一个同步错误测试');
  };

  const testAsyncError = async () => {
    try {
      await fetch('/api/nonexistent');
    } catch (error) {
      throw new Error('异步错误测试: ' + error.message);
    }
  };

  const testRecordingData = () => {
    getRecordingData();
  };

  return (
    <div>
      <h1>React 错误测试</h1>
      <button onClick={testSyncError}>测试同步错误</button>
      <button onClick={testAsyncError}>测试异步错误</button>
      <button onClick={testRecordingData}>查看录屏数据</button>
    </div>
  );
}

// 包装 React 测试组件
const SafeErrorTestReact = withReactErrorBoundary()(ErrorTestReact);

// ==================== 环境配置示例 ====================

// 根据环境调整配置
const getConfig = () => {
  const baseConfig = {
    appId: 'my-app',
    version: '1.0.0',
  };

  if (process.env.NODE_ENV === 'development') {
    return {
      ...baseConfig,
      dsn: 'https://dev-server.com/collect',
      debug: true,
      sampleRate: 1.0, // 开发环境全量采集
    };
  }

  return {
    ...baseConfig,
    dsn: 'https://prod-server.com/collect',
    debug: false,
    sampleRate: 0.1, // 生产环境采样 10%
  };
};

// 使用环境配置
const config = getConfig();
init(config);

// ==================== 错误边界粒度控制示例 ====================

// React 应用中为不同组件设置错误边界
const SafeHeader = withReactErrorBoundary()(Header);
const SafeMainContent = withReactErrorBoundary()(MainContent);
const SafeFooter = withReactErrorBoundary()(Footer);

function AppWithErrorBoundaries() {
  return (
    <div>
      <SafeHeader />
      <SafeMainContent />
      <SafeFooter />
    </div>
  );
}

// 这样即使某个组件出错，其他组件仍然正常工作
