// 用户行为监控工具函数 - 真实 SDK 集成版本

import { getMonitor, getBehaviors, addBehavior, trackEvent } from '../../../../../monitor';
import { BehaviorEvent, BehaviorData } from './types';

// 检查监控实例是否可用
export function isMonitorAvailable(): boolean {
  try {
    const monitor = getMonitor();
    return monitor !== null && monitor !== undefined;
  } catch (error) {
    console.error('检查监控实例失败:', error);
    return false;
  }
}

// 获取监控实例状态信息
export function getMonitorStatus(): {
  available: boolean;
  initialized: boolean;
  plugins: string[];
} {
  try {
    const monitor = getMonitor();
    if (!monitor) {
      return {
        available: false,
        initialized: false,
        plugins: []
      };
    }

    return {
      available: true,
      initialized: true,
      plugins: ['BehaviorPlugin', 'ErrorPlugin', 'PerformancePlugin']
    };
  } catch (error) {
    console.error('获取监控状态失败:', error);
    return {
      available: false,
      initialized: false,
      plugins: []
    };
  }
}

// 从 SDK 获取行为数据快照
export async function getBehaviorSnapshot(options: {
  maxCount?: number;
  includeTypes?: string[];
  excludeTypes?: string[];
  startTime?: number;
  endTime?: number;
} = {}): Promise<BehaviorEvent[]> {
  try {
    const monitor = getMonitor();
    if (!monitor) {
      console.warn('监控实例未初始化');
      return [];
    }

    const behaviors = getBehaviors({
      maxCount: options.maxCount || 100,
      includeTypes: options.includeTypes,
      excludeTypes: options.excludeTypes,
      startTime: options.startTime,
      endTime: options.endTime
    });

    // 转换为标准格式
    return behaviors.map((behavior: any, index: number) => ({
      id: behavior.id || `behavior-${index}`,
      type: behavior.type || 'unknown',
      timestamp: behavior.timestamp || Date.now(),
      pageUrl: behavior.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      userId: behavior.userId || 'unknown',
      sessionId: behavior.sessionId || 'unknown',
      context: behavior.context || {}
    }));
  } catch (error) {
    console.error('获取行为快照失败:', error);
    return [];
  }
}

// 手动添加行为事件到 SDK
export function addBehaviorEvent(
  eventType: string,
  context: Record<string, any> = {}
): boolean {
  try {
    if (!isMonitorAvailable()) {
      console.warn('监控实例不可用，无法添加行为事件');
      return false;
    }

    const success = addBehavior(eventType, {
      ...context,
      timestamp: Date.now(),
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      sdkVersion: '1.0.0',
      source: 'manual'
    });

    if (success) {
      console.log(`✅ 行为事件添加成功: ${eventType}`, context);
      return true;
    } else {
      console.warn(`❌ 行为事件添加失败: ${eventType}`);
      return false;
    }
  } catch (error) {
    console.error('添加行为事件失败:', error);
    return false;
  }
}

// 批量添加行为事件
export function addBatchBehaviorEvents(events: Array<{
  type: string;
  context?: Record<string, any>;
}>): number {
  let successCount = 0;

  events.forEach(event => {
    if (addBehaviorEvent(event.type, event.context)) {
      successCount++;
    }
  });

  console.log(`批量添加行为事件完成: ${successCount}/${events.length} 成功`);
  return successCount;
}

// 获取行为统计信息
export function getBehaviorStats(events: BehaviorEvent[]): {
  totalEvents: number;
  eventTypeCounts: Record<string, number>;
  timeDistribution: Record<string, number>;
  userDistribution: Record<string, number>;
} {
  try {
    const eventTypeCounts: Record<string, number> = {};
    const timeDistribution: Record<string, number> = {};
    const userDistribution: Record<string, number> = {};

    events.forEach(event => {
      // 事件类型统计
      eventTypeCounts[event.type] = (eventTypeCounts[event.type] || 0) + 1;

      // 时间分布统计（按小时）
      if (typeof window !== 'undefined') {
        const hour = new Date(event.timestamp).getHours();
        timeDistribution[hour.toString()] = (timeDistribution[hour.toString()] || 0) + 1;
      }

      // 用户分布统计
      userDistribution[event.userId] = (userDistribution[event.userId] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      eventTypeCounts,
      timeDistribution,
      userDistribution
    };
  } catch (error) {
    console.error('计算行为统计信息失败:', error);
    return {
      totalEvents: 0,
      eventTypeCounts: {},
      timeDistribution: {},
      userDistribution: {}
    };
  }
}

// 格式化时间戳
export function formatTimestamp(timestamp: number): string {
  try {
    if (typeof window !== 'undefined') {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    return new Date(timestamp).toISOString();
  } catch (error) {
    console.error('格式化时间戳失败:', error);
    return 'Invalid Date';
  }
}

// 计算时间差（毫秒）
export function getTimeDifference(timestamp1: number, timestamp2: number): number {
  return Math.abs(timestamp2 - timestamp1);
}

// 格式化时间差
export function formatTimeDifference(diffMs: number): string {
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

// 验证行为事件数据
export function validateBehaviorEvent(event: any): event is BehaviorEvent {
  try {
    return (
      event &&
      typeof event.id === 'string' &&
      typeof event.type === 'string' &&
      typeof event.timestamp === 'number' &&
      typeof event.pageUrl === 'string' &&
      typeof event.userId === 'string' &&
      typeof event.sessionId === 'string' &&
      typeof event.context === 'object'
    );
  } catch (error) {
    console.error('验证行为事件失败:', error);
    return false;
  }
}

// 过滤行为事件
export function filterBehaviorEvents(
  events: BehaviorEvent[],
  filters: {
    types?: string[];
    userIds?: string[];
    timeRange?: { start: number; end: number };
    searchText?: string;
  }
): BehaviorEvent[] {
  try {
    return events.filter(event => {
      // 类型过滤
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(event.type)) {
          return false;
        }
      }

      // 用户ID过滤
      if (filters.userIds && filters.userIds.length > 0) {
        if (!filters.userIds.includes(event.userId)) {
          return false;
        }
      }

      // 时间范围过滤
      if (filters.timeRange) {
        if (event.timestamp < filters.timeRange.start || event.timestamp > filters.timeRange.end) {
          return false;
        }
      }

      // 搜索文本过滤
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const searchableText = [
          event.type,
          event.userId,
          event.pageUrl,
          JSON.stringify(event.context)
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  } catch (error) {
    console.error('过滤行为事件失败:', error);
    return events;
  }
}
