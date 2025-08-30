import { BasePlugin, SEND_TYPES } from '@hawk-tracker/core';
import { record } from 'rrweb';

type RecordOptions = Omit<
  NonNullable<Parameters<typeof record>[0]>,
  'emit' | 'sampling'
>;

type PresetName = 'privacy' | 'balanced' | 'quality';

/**
 * rrweb 插件配置项（已去除自动上报相关配置）
 */
type RrwebPluginOptions = {
  maxEvents?: number;
  sampling?: NonNullable<Parameters<typeof record>[0]>['sampling'];
  emit?: (event: any) => void;
  preset?: PresetName;
  recordOptions?: RecordOptions;
};

/** 内部配置 */
type InternalOptions = {
  preset: PresetName;
  maxEvents: number;
  sampling: NonNullable<Parameters<typeof record>[0]>['sampling'];
  recordOptions: RecordOptions;
  emit: (event: any) => void;
};

/**
 * rrweb 录屏插件
 * 用于集成 rrweb 录屏能力到 hawk-tracker
 */
export class RrwebPlugin extends BasePlugin {
  private options: InternalOptions;
  private events: any[] = [];
  private stopFn: (() => void) | null = null;
  private errorPoints: Array<{
    type: string;
    error: any;
    timestamp: number;
    eventIndex: number;
  }> = [];
  private currentEventIndex: number = 0;

  constructor(options: RrwebPluginOptions = {}) {
    super(SEND_TYPES.RRWEB);

    const preset = this.getPreset(options.preset);

    const mergedSampling = {
      ...preset.sampling,
      ...(options.sampling || {}),
    } as NonNullable<Parameters<typeof record>[0]>['sampling'];

    const mergedRecordOptions: RecordOptions = {
      ...preset.recordOptions,
      ...(options.recordOptions || {}),
    } as RecordOptions;

    const mergedMaxEvents = options.maxEvents ?? preset.maxEvents;

    this.options = {
      preset: preset.name,
      maxEvents: mergedMaxEvents,
      sampling: mergedSampling,
      recordOptions: mergedRecordOptions,
      emit: options.emit ?? (() => {}),
    };
  }

  /** 安装插件，启动 rrweb 录制（不再进行任何自动上报） */
  install(_core: any): void {
    if (typeof window === 'undefined') return;
    if (this.stopFn) return;

    const stop = record({
      ...this.options.recordOptions,
      sampling: this.options.sampling,
      emit: (e: any) => {
        this.events.push(e);
        this.currentEventIndex++;
        // 维护环形缓存
        if (this.events.length > this.options.maxEvents) {
          this.events.splice(0, this.events.length - this.options.maxEvents);
          this.errorPoints = this.errorPoints.map((point) => ({
            ...point,
            eventIndex: Math.max(
              0,
              point.eventIndex - (this.events.length - this.options.maxEvents),
            ),
          }));
        }
        // 自定义回调
        this.options.emit(e);
      },
    });
    if (stop) this.stopFn = stop;

    // 全局调试 API（新）
    (window as any).__hawk_rrweb = {
      getEvents: () => this.events.slice(),
      stop: () => this.stop(),
      getErrorPoints: () => this.errorPoints.slice(),
      // 兼容两种调用：markErrorPoint(type, error) 或 markErrorPoint({ type, error, timestamp })
      markErrorPoint: (arg1: any, arg2?: any) => {
        if (typeof arg1 === 'object' && arg1 && 'type' in arg1) {
          const info = arg1 as { type: string; error: any; timestamp?: number };
          this.errorPoints.push({
            type: info.type,
            error: info.error,
            timestamp: info.timestamp ?? Date.now(),
            eventIndex: this.currentEventIndex,
          });
        } else {
          this.errorPoints.push({
            type: String(arg1),
            error: arg2,
            timestamp: Date.now(),
            eventIndex: this.currentEventIndex,
          });
        }
      },
    };

    // 全局调试 API（旧，向后兼容给错误插件使用）
    (window as any).$hawkRrweb = {
      getReplay: ({
        maxSize = this.options.maxEvents,
        maxBytes,
      }: { maxSize?: number; maxBytes?: number } = {}) => {
        const size = Math.min(maxSize, this.events.length);
        let slice = this.events.slice(this.events.length - size);
        if (typeof maxBytes === 'number' && maxBytes > 0) {
          // 粗略基于 JSON 字节长度的裁剪（UTF-8 近似）
          let json = '';
          while (slice.length > 0) {
            json = JSON.stringify(slice);
            const bytes = new TextEncoder().encode(json).length;
            if (bytes <= maxBytes) break;
            // 移除最早的 10% 或至少 1 条，优先保留最近事件
            const drop = Math.max(1, Math.floor(slice.length * 0.1));
            slice = slice.slice(drop);
          }
        }
        return slice;
      },
      getErrorContext: (_: any) => {
        // 简化的错误上下文：取错误点附近的片段
        const last = this.errorPoints.at(-1);
        if (!last) return null;
        const before = this.events.slice(
          Math.max(0, last.eventIndex - 20),
          last.eventIndex,
        );
        const after = this.events.slice(
          last.eventIndex,
          Math.min(this.events.length, last.eventIndex + 10),
        );
        return {
          errorPoint: last,
          eventsBeforeError: before,
          eventsAfterError: after,
          totalEvents: this.events.length,
          errorCount: this.errorPoints.length,
        };
      },
      markErrorPoint: (info: {
        type: string;
        error: any;
        timestamp?: number;
      }) => {
        (window as any).__hawk_rrweb.markErrorPoint(info);
      },
    };
  }

  /** 仅停止录制（不做自动上报） */
  public stop(): void {
    if (this.stopFn) {
      this.stopFn();
      this.stopFn = null;
    }
  }

  private getPreset(preset?: PresetName): {
    name: PresetName;
    sampling: NonNullable<Parameters<typeof record>[0]>['sampling'];
    recordOptions: RecordOptions;
    maxEvents: number;
  } {
    const pres: Record<
      PresetName,
      { sampling: any; recordOptions: RecordOptions; maxEvents: number }
    > = {
      privacy: {
        sampling: { mousemove: 80, scroll: 80, input: 'last', media: 80 },
        recordOptions: { maskAllInputs: true, recordCanvas: false } as any,
        maxEvents: 200,
      },
      balanced: {
        sampling: { mousemove: 50, scroll: 50, input: 'last', media: 50 },
        recordOptions: { maskAllInputs: false, recordCanvas: false } as any,
        maxEvents: 300,
      },
      quality: {
        sampling: { mousemove: 20, scroll: 20, input: 'all', media: 20 },
        recordOptions: { maskAllInputs: false, recordCanvas: true } as any,
        maxEvents: 600,
      },
    };
    const name: PresetName = preset ?? 'balanced';
    const cfg = pres[name];
    return {
      name,
      sampling: cfg.sampling,
      recordOptions: cfg.recordOptions,
      maxEvents: cfg.maxEvents,
    };
  }
}
