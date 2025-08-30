import {
  BasePlugin,
  LISTEN_TYPES,
  SEND_TYPES,
  getGlobalHawkTracker,
  BehaviorStack,
} from '@hawk-tracker/core';
/**
 * 用户行为监控插件
 * 使用核心级别的行为栈管理器来记录用户行为
 */
export class BehaviorPlugin extends BasePlugin {
  private behaviorStack!: BehaviorStack;
  private globalTracker: any;
  private clickEnabled: boolean = true;

  constructor(
    options: {
      stackName?: string;
      maxSize?: number;
      maxAge?: number;
      debug?: boolean;
      enableClick?: boolean; // 是否启用点击事件监控
    } = {},
  ) {
    super(SEND_TYPES.BEHAVIOR);

    // 获取全局跟踪器实例
    this.globalTracker = getGlobalHawkTracker();
    // 设置点击事件控制
    this.clickEnabled = options.enableClick !== false; // 默认启用

    if (!this.globalTracker) {
      console.error('[BehaviorPlugin] 全局跟踪器未初始化');
      return;
    }

    // 设置点击事件控制
    this.clickEnabled = options.enableClick !== false; // 默认启用

    // 创建或获取专用的行为栈
    this.behaviorStack = this.globalTracker.createBehaviorStack(
      options.stackName || 'user_behavior',
      {
        maxSize: options.maxSize ?? 200,
        maxAge: options.maxAge ?? 5 * 60 * 1000,
        debug: options.debug ?? false,
      },
    );

    console.log('[BehaviorPlugin] 初始化完成', {
      stackName: this.behaviorStack.getName(),
      clickEnabled: this.clickEnabled,
      config: {
        maxSize: options.maxSize ?? 200,
        maxAge: options.maxAge ?? 5 * 60 * 1000,
        debug: options.debug ?? false,
      },
    });
  }

  install(core: any) {
    console.log('[BehaviorPlugin] 安装插件');

    // 根据配置决定是否订阅点击事件
    if (this.clickEnabled) {
      core.eventCenter.subscribeEvent({
        type: LISTEN_TYPES.CLICK,
        callback: this.handleClickEvent.bind(this),
      });
      console.log('[BehaviorPlugin] 点击事件监控已启用');
    } else {
      console.log('[BehaviorPlugin] 点击事件监控已禁用');
    }

    // 订阅其他事件类型
    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.LOAD,
      callback: this.handlePageLoadEvent.bind(this),
    });

    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.BEFOREUNLOAD,
      callback: this.handlePageUnloadEvent.bind(this),
    });

    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.HASHCHANGE,
      callback: this.handleRouteChangeEvent.bind(this),
    });

    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.HISTORYPUSHSTATE,
      callback: this.handleRouteChangeEvent.bind(this),
    });

    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.HISTORYREPLACESTATE,
      callback: this.handleRouteChangeEvent.bind(this),
    });

    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.POPSTATE,
      callback: this.handleRouteChangeEvent.bind(this),
    });

    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.XHROPEN,
      callback: this.handleNetworkEvent.bind(this),
    });

    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.FETCH,
      callback: this.handleNetworkEvent.bind(this),
    });

    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.ONLINE,
      callback: this.handleNetworkStatusEvent.bind(this),
    });

    core.eventCenter.subscribeEvent({
      type: LISTEN_TYPES.OFFLINE,
      callback: this.handleNetworkStatusEvent.bind(this),
    });

    console.log('[BehaviorPlugin] 事件订阅完成');
  }

  /**
   * 处理点击事件
   */
  private handleClickEvent(event: MouseEvent) {
    if (!this.clickEnabled) return;

    const target = event.target as HTMLElement;
    if (!target) return;

    const elementInfo = this.getElementInfo(target);

    this.behaviorStack.addEvent({
      type: LISTEN_TYPES.CLICK,
      pageUrl: window.location.href,
      context: {
        element: elementInfo,
        customData: {
          position: {
            x: event.clientX,
            y: event.clientY,
          },
        },
      },
    });
  }

  /**
   * 处理页面加载事件
   */
  private handlePageLoadEvent() {
    this.behaviorStack.addEvent({
      type: LISTEN_TYPES.LOAD,
      pageUrl: window.location.href,
      context: {
        page: {
          title: document.title,
          loadTime: performance.now(),
        },
        screen: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        userAgent: navigator.userAgent,
      },
    });
  }

  /**
   * 处理页面卸载事件
   */
  private handlePageUnloadEvent() {
    this.behaviorStack.addEvent({
      type: LISTEN_TYPES.BEFOREUNLOAD,
      pageUrl: window.location.href,
      context: {
        page: {
          title: document.title,
        },
      },
    });
  }

  /**
   * 处理路由变化事件
   */
  private handleRouteChangeEvent(event: any) {
    const from = this.getCurrentUrl();
    const to = window.location.href;

    this.behaviorStack.addEvent({
      type: event.type || 'route_change',
      pageUrl: to,
      context: {
        route: {
          type: this.getRouteChangeType(event),
          from,
          to,
        },
      },
    });
  }

  /**
   * 处理网络请求事件
   */
  private handleNetworkEvent(event: any) {
    const url = event.url || event.target?.responseURL || 'unknown';

    this.behaviorStack.addEvent({
      type: event.type || 'network_request',
      pageUrl: window.location.href,
      context: {
        network: {
          url: event.url || event.target?.responseURL || 'unknown',
          method: event.method || event.target?._method || 'GET',
          status: event.status || event.target?.status,
          statusText: event.statusText || event.target?.statusText,
        },
      },
    });
  }

  /**
   * 处理网络状态事件
   */
  private handleNetworkStatusEvent(event: Event) {
    this.behaviorStack.addEvent({
      type: event.type,
      pageUrl: window.location.href,
      context: {
        network: {
          url: window.location.href,
          status: navigator.onLine ? 200 : 0,
          statusText: navigator.onLine ? 'online' : 'offline',
        },
      },
    });
  }

  /**
   * 获取元素信息
   */
  private getElementInfo(element: HTMLElement) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      textContent: element.textContent?.slice(0, 100) || undefined,
      size: {
        width: element.offsetWidth,
        height: element.offsetHeight,
      },
    };
  }

  /**
   * 获取当前URL
   */
  private getCurrentUrl(): string {
    return window.location.href;
  }

  /**
   * 获取路由变化类型
   */
  private getRouteChangeType(
    event: any,
  ): 'pushState' | 'replaceState' | 'popstate' | 'hashchange' {
    if (event.type === 'pushState') return 'pushState';
    if (event.type === 'replaceState') return 'replaceState';
    if (event.type === 'popstate') return 'popstate';
    if (event.type === 'hashchange') return 'hashchange';
    return 'pushState';
  }

  /**
   * 启用点击事件监控
   */
  public enableClickTracking(): void {
    this.clickEnabled = true;
    console.log('[BehaviorPlugin] 点击事件监控已启用');
  }

  /**
   * 禁用点击事件监控
   */
  public disableClickTracking(): void {
    this.clickEnabled = false;
    console.log('[BehaviorPlugin] 点击事件监控已禁用');
  }

  /**
   * 检查点击事件监控状态
   */
  public isClickTrackingEnabled(): boolean {
    return this.clickEnabled;
  }

  /**
   * 获取行为栈快照
   */
  public getBehaviorSnapshot(options?: any): any[] {
    return this.behaviorStack.getSnapshot(options);
  }

  /**
   * 获取行为栈统计信息
   */
  public getBehaviorStats(): any {
    return this.behaviorStack.getStats();
  }

  /**
   * 添加自定义行为事件
   */
  public addCustomBehavior(type: string, data: Record<string, any> = {}) {
    return this.behaviorStack.addCustomEvent(type, data);
  }
}
