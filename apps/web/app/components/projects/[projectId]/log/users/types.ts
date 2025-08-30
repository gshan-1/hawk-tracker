// 用户行为监控数据类型定义

export interface BehaviorEvent {
  id: string;
  type: 'click' | 'scroll' | 'exposure' | 'pv' | 'uv' | 'fetch' | 'xhr';
  timestamp: number;
  pageUrl: string;
  userId: string;
  sessionId: string;
  context: {
    element?: {
      tagName: string;
      textContent?: string;
      className?: string;
      position?: { x: number; y: number };
    };
    network?: {
      url: string;
      method: string;
      status: number;
      duration: number;
    };
    scroll?: {
      scrollTop: number;
      scrollPercentage: number;
    };
    exposure?: {
      elementId: string;
      elementText: string;
      viewportPercentage: number;
    };
    customData?: Record<string, any>;
  };
}

export interface BehaviorStats {
  totalEvents: number;
  pv: number;
  uv: number;
  clickEvents: number;
  scrollEvents: number;
  exposureEvents: number;
  networkEvents: number;
  typeDistribution: Record<string, number>;
  timeDistribution: Record<string, number>;
}

export interface BehaviorData {
  events: BehaviorEvent[];
  stats: BehaviorStats;
}

// 事件类型常量
export const EVENT_TYPES = {
  CLICK: 'click',
  SCROLL: 'scroll',
  EXPOSURE: 'exposure',
  PV: 'pv',
  UV: 'uv',
  FETCH: 'fetch',
  XHR: 'xhr'
} as const;

// 时间范围常量
export const TIME_RANGES = {
  ONE_HOUR: '1h',
  SIX_HOURS: '6h',
  ONE_DAY: '24h',
  ONE_WEEK: '7d'
} as const;

// 事件类型图标映射
export const EVENT_TYPE_ICONS: Record<string, string> = {
  click: '🖱️',
  scroll: '📜',
  exposure: '👁️',
  pv: '📊',
  uv: '👤',
  fetch: '🌐',
  xhr: '🌐',
  input: '⌨️',
  route: '🔄',
  performance: '⚡',
  error: '❌'
};

// 事件类型颜色映射
export const EVENT_TYPE_COLORS: Record<string, string> = {
  click: 'bg-blue-100 text-blue-800',
  scroll: 'bg-green-100 text-green-800',
  exposure: 'bg-purple-100 text-purple-800',
  pv: 'bg-indigo-100 text-indigo-800',
  uv: 'bg-pink-100 text-pink-800',
  fetch: 'bg-orange-100 text-orange-800',
  xhr: 'bg-orange-100 text-orange-800',
  input: 'bg-yellow-100 text-yellow-800',
  route: 'bg-purple-100 text-purple-800',
  performance: 'bg-orange-100 text-orange-800',
  error: 'bg-red-100 text-red-800'
};

// 事件类型名称映射
export const EVENT_TYPE_NAMES: Record<string, string> = {
  click: '点击事件',
  scroll: '滚动事件',
  exposure: '曝光事件',
  pv: '页面访问',
  uv: '用户标识',
  fetch: 'Fetch请求',
  xhr: 'XHR请求',
  input: '输入事件',
  route: '路由事件',
  performance: '性能事件',
  error: '错误事件'
};

// 用户活跃度级别
export const USER_ACTIVITY_LEVELS = {
  HIGH: 'high',      // ≥5个事件
  MODERATE: 'moderate', // 2-4个事件
  LOW: 'low'         // <2个事件
} as const;

// 会话时长级别
export const SESSION_DURATION_LEVELS = {
  SHORT: 'short',    // ≤5分钟
  MEDIUM: 'medium',  // 5-15分钟
  LONG: 'long'       // >15分钟
} as const;
