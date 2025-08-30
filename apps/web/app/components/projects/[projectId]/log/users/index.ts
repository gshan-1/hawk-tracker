// 主页面组件
export { default as UsersPage } from './page';
// 子组件
export { default as BehaviorTest } from './components/BehaviorTest';
export { default as EventList } from './components/EventList';
export { default as UserSessionAnalysis } from './components/UserSessionAnalysis';

// 类型导出
export type { BehaviorEvent, BehaviorStats, BehaviorData } from './types';

// 工具函数导出
export {
  isMonitorAvailable,
  getMonitorStatus,
  getBehaviorSnapshot,
  addBehaviorEvent,
  getBehaviorStats,
  formatTimestamp,
  getTimeDifference,
  formatTimeDifference,
  validateBehaviorEvent,
  filterBehaviorEvents
} from './utils';
