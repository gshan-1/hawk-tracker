# 用户行为监控模块 

## 📋 功能概述

用户行为监控模块现已完全集成 Hawk Tracker SDK，提供实时用户行为数据采集、分析和可视化功能。

## 主要特性

###  SDK 集成
- ✅ 完全集成 Hawk Tracker 核心 SDK
- ✅ 实时行为数据采集和上报
- ✅ 自动网络请求监控（Fetch/XHR）
- ✅ 用户行为追踪
- ✅ 数据持久化和离线支持

### 监控能力
- ✅ 点击事件监控：自动捕获元素点击、位置信息
- ✅ 滚动事件监控：监控页面滚动行为和性能
- ✅ 曝光事件监控：元素可见性监控
- ✅ 页面访问监控：PV/UV 统计
- ✅ 网络请求监控：Fetch 和 XHR 请求拦截
- ✅ 用户标识监控：用户会话和身份管理

### 数据分析
- ✅ 实时行为数据统计
- ✅ 时间分布分析
- ✅ 用户活跃度分析
- ✅ 事件类型分布
- ✅ 详细事件列表和搜索


### 核心组件
- BehaviorTest: 行为事件测试组件
- UserSessionAnalysis: 用户会话分析组件
- EventList: 事件列表展示组件
-  SDK 集成: 通过 monitor.ts 集成

## 技术实现

### SDK 初始化
```typescript
// 在 monitor.ts 中初始化
import { init } from '@hawk-tracker/core';
import { BehaviorPlugin } from '@hawk-tracker/plugin-behavior';

const tracker = init({
  dsn: 'http://localhost:3001/api',
  behavior: { core: true, maxSize: 200 }
});

tracker.use(BehaviorPlugin, {
  stackName: 'user_behavior',
  enableClick: true
});
```

### 事件监控
```typescript
// 在 BehaviorTest 组件中
const testRealClick = () => {
  const success = addBehavior('click', {
    element: { tagName: 'button', position: { x: 100, y: 100 } },
    timestamp: Date.now(),
    pageUrl: window.location.href
  });
  
  if (success) {
    trackEvent('test_click', { success: true });
  }
};
```

### 数据获取
```typescript
const fetchBehaviorDataFromSDK = async () => {
  const behaviors = getBehaviors({
    maxCount: 200,
    includeTypes: ['click', 'scroll', 'fetch', 'xhr', 'pv', 'uv', 'exposure']
  });
  
  return convertToBehaviorData(behaviors);
};
```

## 数据流程

### 1. 事件采集
```
用户行为 → Hawk Tracker SDK → 行为栈 → 数据上报
```

### 2. 数据处理
```
原始数据 → 格式转换 → 统计分析 → UI 展示
```

### 3. 实时更新
```
新事件 → 自动刷新 → 实时统计 → 动态图表
```

## 使用场景

### 开发测试
- 验证监控 SDK 功能
- 测试各种用户行为场景
- 调试数据采集逻辑

### 生产监控
- 用户行为分析
- 性能问题排查
- 用户路径优化

### 数据分析
- 用户行为模式识别
- 产品使用情况统计
- 转化率优化

## 插件配置

### BehaviorPlugin 配置
```typescript
{
  stackName: 'user_behavior',        // 行为栈名称
  maxSize: 200,                      // 最大事件数量
  maxAge: 5 * 60 * 1000,            // 最大事件年龄（5分钟）
  debug: true,                       // 调试模式
  enableClick: true                  // 启用点击监控
}
```

### 监控配置
```typescript
{
  dsn: 'http://localhost:3001/api',  // 上报地址
  batchSize: 1,                      // 批量上报大小
  sendInterval: 1000,                // 上报间隔
  maxRetry: 3,                       // 最大重试次数
  offlineStorageKey: 'hawk_tracker_queue' // 离线存储键名
}
```

## 📱 用户界面

### 测试控制面板
- ✅ 点击事件监控
- ✅ 滚动事件监控
- ✅ 曝光事件监控
- ✅  Fetch 请求监控
- ✅  XHR 请求监控
- ✅ 页面访问监控
- ✅ 用户标识监控

### 数据分析面板
- 用户基本信息展示
- 时间活跃度分布（24小时热力图）
- 用户行为模式分析
- 事件类型统计

### 事件列表
- 实时事件展示
- 事件详情查看
- 时间排序和筛选
- 数据刷新和清空


### 依赖包
```json
{
  "@hawk-tracker/core": "workspace:*",
  "@hawk-tracker/plugin-behavior": "workspace:*",
}
```

### 构建步骤
```bash
# 安装依赖
pnpm install

# 构建核心包
pnpm build --filter @hawk-tracker/core
pnpm build --filter @hawk-tracker/plugin-behavior

# 启动web
pnpm dev
```

## 🔍 监控指标

### 核心指标
- 总事件数: 所有行为事件的总数
- 活跃小时数: 有活动的小时数
- 最活跃时间段: 事件最集中的时间段

### 事件分布
- 点击事件: 用户点击行为统计
- 滚动事件: 页面滚动行为统计
- 网络请求: Fetch 和 XHR 请求统计
- 页面访问: PV/UV 统计

### 性能指标
- 请求响应时间: 网络请求耗时
- 事件处理延迟: 事件采集到上报的延迟
- 数据上报成功率: 数据上报的成功率

## 故障排除

### 常见问题

#### 1. 监控实例未初始化
```
症状: 显示"监控实例未初始化"警告
解决: 检查 monitor.ts 中的初始化代码，确保 SDK 正确加载
```

#### 2. 事件记录失败
```
症状: 点击测试按钮显示"事件记录失败"
解决: 检查 BehaviorPlugin 配置，确保行为栈正确创建
```

#### 3. 数据不显示
```
症状: 测试后页面仍显示"暂无数据"
解决: 检查数据转换逻辑，确保 SDK 数据格式正确
```