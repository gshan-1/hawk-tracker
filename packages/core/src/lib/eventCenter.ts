import { EventHandler } from '../types/core';
import { AnyFun } from '../types/common';
import { LISTEN_TYPES } from '../common/event';

// 事件中心
export class EventCenter {
  private eventMap: Map<LISTEN_TYPES, EventHandler[]> = new Map(); // 事件类型与事件处理函数的映射
  private eventQueue: EventHandler[] = []; // 事件队列

  subscribeEvent(handler: EventHandler) {
    console.log('subscribeEvent xxxxx', { handler });
    const handlers = this.eventMap.get(handler.type) || [];
    handlers.push(handler);
    this.eventMap.set(handler.type, handlers);
  }

  delEvent(handler: EventHandler) {
    const handlers = this.eventMap.get(handler.type) || [];
    this.eventMap.set(
      handler.type,
      handlers.filter((h) => h !== handler),
    );
  }

  changeEvent(handler: EventHandler, newCallback: AnyFun) {
    const handlers = this.eventMap.get(handler.type) || [];
    this.eventMap.set(
      handler.type,
      handlers.map((h) =>
        h === handler ? { ...h, callback: newCallback } : h,
      ),
    );
  }

  getEvent(type: LISTEN_TYPES) {
    return this.eventMap.get(type) || [];
  }

  runEvent(type: LISTEN_TYPES, ...args: any[]) {
    const handlers = this.getEvent(type);
    handlers.forEach((handler) => handler.callback(...args));
  }

  // 别名方法，与runEvent功能相同
  emit(type: LISTEN_TYPES, ...args: any[]) {
    this.runEvent(type, ...args);
  }


  /**
   * 点击事件总线
   */
  private clickEventBus: Map<string, Function[]> = new Map();

  /**
   * 订阅点击事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  subscribeClickEvent(event: string, callback: Function): void {
    if (!this.clickEventBus.has(event)) {
      this.clickEventBus.set(event, []);
    }
    this.clickEventBus.get(event)!.push(callback);
  }

  /**
   * 发布点击事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emitClickEvent(event: string, data?: any): void {
    const callbacks = this.clickEventBus.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('ClickEventBus callback error:', error);
        }
      });
    }
  }

  /**
   * 取消订阅点击事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  unsubscribeClickEvent(event: string, callback?: Function): void {
    if (!callback) {
      this.clickEventBus.delete(event);
      return;
    }

    const callbacks = this.clickEventBus.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

}

export const eventCenter = new EventCenter();
