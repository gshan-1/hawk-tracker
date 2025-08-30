import { useEffect, useRef, useState, useCallback } from 'react';

export type GetFlagFn = (projectId: string) => Promise<string>;

export interface UseServerWatchOptions {
  projectId?: string;
  // 服务端变化标识计算函数；默认用 错误总数 + 最新一条 receivedAt
  getFlag?: GetFlagFn;
  // 变化时触发（例如：拉取最新列表）
  onChange: () => Promise<void> | void;
  // 是否首次立即拉一次 onChange
  initialFetch?: boolean;
  // 起始轮询间隔
  baseInterval?: number; // ms
  // 退避间隔（无变化时逐级使用）
  backoffSteps?: number[]; // ms
  maxIdleInterval?: number; // 新增：空闲最大间隔（ms），默认 10000
}

// 默认 flag：错误总数 + 最新一条 receivedAt
async function defaultErrorsFlag(projectId: string): Promise<string> {
  try {
    const sRes = await fetch(
      `http://localhost:3001/api/stats?projectId=${projectId}`,
    );
    const sJson = await sRes.json();
    const count = sJson?.data?.errors ?? 0;

    const lRes = await fetch(
      `http://localhost:3001/api/data?type=errors&projectId=${projectId}&limit=1`,
    );
    const lJson = await lRes.json();
    const latestTs = lJson?.data?.list?.[0]?.receivedAt ?? 0;

    return `${count}-${latestTs}`;
  } catch (error) {
    console.error('获取flag失败:', error);
    return `error-${Date.now()}`;
  }
}

export function useServerWatch({
  projectId,
  getFlag = defaultErrorsFlag,
  onChange,
  initialFetch = true,
  baseInterval = 2000,
  backoffSteps = [5000, 10000],
  maxIdleInterval = 10000, // 默认 10s 上限
}: UseServerWatchOptions) {
  const runningRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const lastFlagRef = useRef<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // 使用useRef存储稳定的函数引用
  const onChangeRef = useRef(onChange);
  const getFlagRef = useRef(getFlag);

  // 更新ref
  onChangeRef.current = onChange;
  getFlagRef.current = getFlag;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const tick = useCallback(async () => {
    if (!projectId || !runningRef.current) {
      return;
    }

    let nextInterval = baseInterval;
    try {
      const flag = await getFlagRef.current(projectId);

      if (!lastFlagRef.current) {
        lastFlagRef.current = flag;
        if (initialFetch) await onChangeRef.current();
      } else if (flag !== lastFlagRef.current) {
        await onChangeRef.current();
        lastFlagRef.current = flag;
      } else {
        // 无变化 → 退避
        nextInterval = backoffSteps[0] ?? baseInterval;
        if (lastFlagRef.current.startsWith('idle2:')) {
          nextInterval = backoffSteps[1] ?? nextInterval;
        }
        // 空闲状态下也不超过 maxIdleInterval，避免等待过久
        nextInterval = Math.min(nextInterval, maxIdleInterval);
        lastFlagRef.current = `idle2:${lastFlagRef.current}`;
      }
      setError(null);
    } catch (e) {
      console.error('useServerWatch tick error:', e);
      setError(e);
      nextInterval = Math.min(backoffSteps[0] ?? baseInterval, maxIdleInterval);
    } finally {
      if (runningRef.current) {
        timerRef.current = window.setTimeout(tick, nextInterval);
      }
    }
  }, [projectId, initialFetch, baseInterval, backoffSteps, maxIdleInterval]);

  const start = useCallback(() => {
    if (!projectId || runningRef.current) {
      return;
    }
    runningRef.current = true;
    setIsRunning(true);
    clearTimer();
    timerRef.current = window.setTimeout(tick, 0);
  }, [projectId, tick, clearTimer]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  // 添加refreshNow函数定义
  const refreshNow = useCallback(async () => {
    if (!projectId) return;
    try {
      const flag = await getFlagRef.current(projectId);
      if (flag !== lastFlagRef.current) {
        await onChangeRef.current();
        lastFlagRef.current = flag;
      }
    } catch (e) {
      setError(e);
    }
  }, [projectId]);

  // 页面从隐藏->显示/窗口聚焦时，立即抢占刷新一次
  useEffect(() => {
    const wake = () => {
      if (!projectId) return;
      clearTimer();
      lastFlagRef.current = ''; // 让下一次 tick 立即 initialFetch
      timerRef.current = window.setTimeout(tick, 0);
    };
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) wake();
    });
    window.addEventListener('focus', wake);
    return () => {
      window.removeEventListener('focus', wake);
    };
  }, [projectId, tick, clearTimer]);

  // 修复useEffect，确保正确清理
  useEffect(() => {
    // 先停止之前的轮询
    stop();

    // 重置状态
    lastFlagRef.current = '';

    // 如果有projectId，开始新的轮询
    if (projectId) {
      start();
    }

    // 清理函数
    return () => {
      stop();
    };
  }, [projectId, start, stop]); // 添加start和stop到依赖项

  return { start, stop, refreshNow, isRunning, error };
}
