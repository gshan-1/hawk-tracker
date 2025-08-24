import pako from 'pako';
import { _global } from '../utils';
import { log } from '../utils/debug';
import { $sdkInstance } from '../utils/global';
import { generateUUID } from '../utils/common';

// 定义上报数据的类型
type ReportData = {
  // 数据类型，如 'error', 'performance', 'behavior'
  type: string;
  subType: string;
  // 实际数据
  data: any;
  // 时间戳
  timestamp: number;
  // 是否需要立即上报，用于高优先级数据
  isImmediate: boolean;
  // 当前重试次数
  retryCount: number;
};

// DataSender 的配置
interface SenderConfig {
  dsn: string;
  sampleRate?: number;
  batchSize?: number;
  sendInterval?: number;
  maxConcurrentRequests?: number;
  offlineStorageKey?: string;
  debug?: boolean;
  // 新增：重试相关配置
  maxRetry?: number;
  backoffBaseMs?: number;
  backoffMaxMs?: number;
  // 新增点击事件相关配置
  cacheMaxLength?: number;
  cacheWaitingTime?: number;
  appName?: string; // 添加应用名称
}

export class DataSender {
  // 队列
  private queue: ReportData[] = [];
  // 配置
  private readonly config: Required<SenderConfig>;
  // 定时器
  private timer: number | null = null;
  // 当前进行中的请求数
  private concurrentRequests = 0;
  // 日志方法
  private readonly log: (
    level: 'info' | 'warn' | 'error',
    message: string,
    ...args: any[]
  ) => void;
  // 新增：重试定时器
  private retryTimer: number | null = null;

  constructor(config: SenderConfig) {
    // 设置默认配置并合并
    this.config = {
      dsn: config.dsn,
      sampleRate: config.sampleRate ?? 1,
      batchSize: config.batchSize ?? 50,
      sendInterval: config.sendInterval ?? 5000,
      maxConcurrentRequests: config.maxConcurrentRequests ?? 3,
      offlineStorageKey: config.offlineStorageKey ?? 'sdk_report_queue',
      debug: config.debug ?? false,
      // ... existing code ...
      maxRetry: config.maxRetry ?? 5,
      backoffBaseMs: config.backoffBaseMs ?? 1000,
      backoffMaxMs: config.backoffMaxMs ?? 30000,
        // 新增配置项
      cacheMaxLength: config.cacheMaxLength ?? 10,
      cacheWaitingTime: config.cacheWaitingTime ?? 100,
      appName: config.appName ?? 'unknown-app',
    } as Required<SenderConfig>;

    if (this.config.debug) {
      this.log = log;
    } else {
      this.log = () => {};
    }

    // 初始化时从本地存储恢复数据
    this.restoreFromLocalStorage();

    // 监听网络变化和页面卸载
    this.setupEventListeners();

    // 启动定时上报
    this.startScheduler();
  }

  // 对外暴露的唯一接口
  /*
   * 参数：
   * type: 数据类型
   * data: 数据
   * isImmediate: 是否立即上报
   * 返回值：
   * 无返回值
   * 说明： 将数据入队，如果isImmediate为true，则立即触发上报
   */
  public sendData(
    type: string,
    subType: string,
    data: any,
    isImmediate: boolean = false,
  ): void {
    // 立即事件跳过采样过滤
    if (!isImmediate && Math.random() > this.config.sampleRate) {
      this.log('info', `Data dropped due to sampling:`, data);
      return;
    }

    // 封装基础信息
    const reportData: ReportData = {
      type,
      subType,
      ...data,
      timestamp: Date.now(),
      retryCount: 0,
      eventId: generateUUID(),
    } as any;

    // 立即事件插入队列头部，普通事件追加到尾部
    if (isImmediate) {
      this.queue.unshift(reportData);
      this.log('info', `Added immediate data to queue head:`, reportData);
      this.flush();
    } else {
      this.queue.push(reportData);
      this.log('info', `Added data to queue:`, reportData);
    }
  }

  // 上报调度器
  private startScheduler(): void {
    if (this.timer !== null) return;

    const tick = () => {
      // 智能调度：如果队列为空或并发数已达上限，跳过本次执行
      if (
        this.queue.length === 0 ||
        this.concurrentRequests >= this.config.maxConcurrentRequests
      ) {
        this.log(
          'info',
          `Skipping flush: queue=${this.queue.length}, concurrent=${this.concurrentRequests}`,
        );
        return;
      }

      // 在浏览器空闲时触发上报，最大化性能
      // requestIdleCallback 仅在浏览器有空闲时间时才会执行
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => this.flush());
      } else {
        // 如果不支持，则直接执行
        this.flush();
      }
    };

    this.timer = window.setInterval(tick, this.config.sendInterval);
  }

  // 清空队列并发送数据
  private async flush(): Promise<void> {
    // 并发控制：如果正在进行的请求数已达上限，则等待
    if (this.concurrentRequests >= this.config.maxConcurrentRequests) {
      this.log(
        'warn',
        `Reached max concurrent requests (${this.config.maxConcurrentRequests}), waiting...`,
      );
      return;
    }

    // 队列为空，无需操作
    if (this.queue.length === 0) {
      return;
    }

    // 从队列头部取出一定数量的数据
    const dataToSend = this.queue.splice(0, this.config.batchSize);
    const finalData = {
      dataQueue: dataToSend,
      baseInfo: { ...this.getBaseInfo(), sendTime: Date.now() },
    };
    this.concurrentRequests++;
    this.log(
      'info',
      `Flushing ${dataToSend.length} items from queue. Concurrent requests: ${this.concurrentRequests}`,
    );

    try {
      await this.transport(finalData);
      this.log('info', `Successfully sent ${dataToSend.length} items.`);
      // 成功：如果还有数据，继续快速冲队列
      if (this.queue.length > 0) {
        this.flush();
      }
    } catch (error) {
      // 失败时，将数据放回队列，并增加重试次数
      this.log('error', `Failed to send data, error:`, error);
      dataToSend.forEach(
        (item) => (item.retryCount = (item.retryCount || 0) + 1),
      );

      // 根据最大重试次数拆分：继续重试 vs 归档离线
      const toRetry: ReportData[] = [];
      const toArchive: ReportData[] = [];
      for (const item of dataToSend) {
        if ((item.retryCount || 0) < this.config.maxRetry) {
          toRetry.push(item);
        } else {
          toArchive.push(item);
        }
      }

      if (toArchive.length > 0) {
        this.saveToOfflineStorage(toArchive);
        this.log(
          'warn',
          `Archived ${toArchive.length} items after exceeding maxRetry=${this.config.maxRetry}.`,
        );
      }

      if (toRetry.length > 0) {
        this.queue.unshift(...toRetry);
      }

      // 离线则等待 online 事件再触发
      if (!navigator.onLine) {
        this.log('warn', 'Network offline, waiting for online event to retry.');
      } else if (toRetry.length > 0 || this.queue.length > 0) {
        // 在线失败：按照指数退避重试
        const maxRetryCount =
          toRetry.length > 0
            ? Math.max(...toRetry.map((i) => i.retryCount || 1))
            : 1;
        const base = this.config.backoffBaseMs;
        const cap = this.config.backoffMaxMs;
        const delay = Math.min(
          base * Math.pow(2, Math.max(0, maxRetryCount - 1)),
          cap,
        );
        const jitter = Math.floor(Math.random() * Math.floor(delay * 0.2));
        this.scheduleRetry(delay + jitter);
      }
    } finally {
      this.concurrentRequests--;
    }

    // 成功与失败的后续行为已分别处理，这里不再立即递归 flush，避免无限重试
  }

  // 新增：带退避的重试调度
  private scheduleRetry(delayMs: number): void {
    if (this.retryTimer !== null) return;
    this.log('warn', `Scheduling retry in ${delayMs} ms`);
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      this.flush();
    }, delayMs);
  }

  // 传输通道，选择最合适的传输方式
  private async transport(data: {
    dataQueue: ReportData[];
    baseInfo: Record<string, any>;
  }): Promise<void> {
    const payload = JSON.stringify(data);

    // 使用 pako 进行 gzip 压缩
    const compressedPayload = pako.gzip(payload);

    // 根据网络状态决定是否发送
    if (!navigator.onLine) {
      throw new Error('Network is offline, suspending transport.');
    }

    // 数据大小超过 64KB，sendBeacon 降级到 fetch
    if (compressedPayload.length > 64 * 1024) {
      this.log(
        'warn',
        `Payload size exceeds sendBeacon limit, falling back to fetch.`,
      );
      const response = await fetch(this.config.dsn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip',
        },
        body: compressedPayload as any,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } else {
      // 优先使用 sendBeacon
      const success = (navigator as any).sendBeacon(
        this.config.dsn,
        compressedPayload as any,
      );
      if (!success) {
        throw new Error('sendBeacon failed');
      }
    }
  }

  // 离线存储与恢复
  private restoreFromLocalStorage(): void {
    try {
      const storedData = localStorage.getItem(this.config.offlineStorageKey);
      if (storedData) {
        this.queue = JSON.parse(storedData);
        localStorage.removeItem(this.config.offlineStorageKey);
        this.log(
          'info',
          `Restored ${this.queue.length} items from offline storage.`,
        );
      }
    } catch (e) {
      this.log('error', 'Failed to restore data from localStorage:', e);
    }
  }

  // 新增：保存超出最大重试次数的数据到离线存储
  private saveToOfflineStorage(items: ReportData[]): void {
    try {
      const key = this.config.offlineStorageKey;
      const existing = localStorage.getItem(key);
      const arr: ReportData[] = existing ? JSON.parse(existing) : [];
      arr.push(...items);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      this.log('error', 'Failed to save items to offline storage:', e);
    }
  }

  // 事件监听器，处理网络状态和页面卸载
  private setupEventListeners(): void {
    // 监听网络恢复
    window.addEventListener('online', () => {
      this.log('info', 'Network online, flushing pending data.');
      // 恢复离线存储的数据再冲队列
      this.restoreFromLocalStorage();
      this.flush(); // 立即上报积压的数据
      this.startScheduler(); // 重新启动定时器
    });

    // 监听网络断开
    window.addEventListener('offline', () => {
      this.log('warn', 'Network offline, pausing scheduler.');
      if (this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
      }
    });

    // 页面卸载时进行离线存储
    window.addEventListener('beforeunload', () => {
      this.flush(); // 再次尝试清空队列
      if (this.queue.length > 0) {
        localStorage.setItem(
          this.config.offlineStorageKey,
          JSON.stringify(this.queue),
        );
        this.log(
          'info',
          `Saved ${this.queue.length} items to offline storage.`,
        );
      }
    });
  }

  // 辅助方法，获取基础信息
  private getBaseInfo(): Record<string, any> {
    const { baseInfo = {} } = $sdkInstance || {};
    return {
      ...baseInfo,
      timestamp: Date.now(),
      // IP 和会话 ID 等通常在后端通过请求头获取，前端无法直接获取
      // 这里可以放置会话 ID 或其他客户端信息
    };
  }
  

  /**
   * 点击事件缓存
   */
  private clickEventCache: any[] = [];
  private clickEventTimer: NodeJS.Timeout | null = null;

  /**
   * 发送点击事件数据
   * @param clickEvent 点击事件数据
   */
  sendClickEvent(clickEvent: any): void {
    this.clickEventCache.push(clickEvent);

    // 如果缓存达到最大长度，立即发送
    if (this.clickEventCache.length >= (this.config.cacheMaxLength || 10)) {
      this.sendClickEventBatch();
    } else if (!this.clickEventTimer) {
      // 否则设置定时器延迟发送
      this.clickEventTimer = setTimeout(() => {
        this.sendClickEventBatch();
      }, this.config.cacheWaitingTime || 100);
    }
  }

  /**
   * 发送批量点击事件数据
   */
  private async sendClickEventBatch(): Promise<void> {
    if (this.clickEventCache.length === 0) return;

    const events = [...this.clickEventCache];
    this.clickEventCache = [];

    if (this.clickEventTimer) {
      clearTimeout(this.clickEventTimer);
      this.clickEventTimer = null;
    }

    try {
      const response = await fetch(this.config.dsn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appName: this.config.appName,
          events,
          timestamp: Date.now(),
          type: 'click_events',
        }),
      });

      const success = response.ok;
      
      if (this.config.debug) {
        console.log('Click tracking data sent:', { success, events });
      }
    } catch (error) {
      console.error('Failed to send click tracking data:', error);
    }
  }

  /**
   * 强制发送点击事件缓存数据
   */
  flushClickEvents(): void {
    this.sendClickEventBatch();
  }
}
